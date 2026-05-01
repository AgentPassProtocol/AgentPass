import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  extractBearer,
  generateApiKey,
  generateHandle,
} from "@/lib/agent-utils.server";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const MintSchema = z.object({
  display_name: z.string().min(1).max(120),
  model: z.string().min(1).max(64).optional(),
  purpose: z.string().min(1).max(280).optional(),
  public_key: z.string().min(1).max(2048).optional(),
  handle: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, digits, hyphens only")
    .optional(),
});

function err(status: number, code: string, message?: string) {
  return new Response(
    JSON.stringify({ error: code, message: message ?? code }),
    { status, headers: CORS },
  );
}

export const Route = createFileRoute("/api/public/v1/agents")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        // 1. Authenticate operator via Supabase access token (Bearer eyJ...)
        const token = extractBearer(request);
        if (!token) {
          return err(
            401,
            "missing_operator_token",
            "Provide Authorization: Bearer <operator_access_token> (get it from /console)",
          );
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return err(500, "server_misconfigured");
        }

        const operatorClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: userData, error: userErr } = await operatorClient.auth.getUser();
        if (userErr || !userData.user) {
          return err(401, "invalid_operator_token");
        }
        const operatorId = userData.user.id;

        // 2. Validate body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return err(400, "invalid_json");
        }
        const parsed = MintSchema.safeParse(body);
        if (!parsed.success) {
          return err(400, "invalid_payload", parsed.error.issues[0]?.message ?? "invalid");
        }
        const { display_name, model, purpose, public_key, handle: requestedHandle } = parsed.data;

        // 3. Mint key + resolve handle (retry on collision)
        const { plaintext, prefix, hash } = generateApiKey();
        let handle = requestedHandle ?? generateHandle(display_name);

        for (let attempt = 0; attempt < 5; attempt++) {
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("agents")
            .insert({
              operator_id: operatorId,
              handle,
              display_name,
              model: model ?? null,
              purpose: purpose ?? null,
              public_key: public_key ?? null,
              api_key_hash: hash,
              api_key_prefix: prefix,
            })
            .select("id, handle, display_name, model, purpose, reputation_score, trust_tier, created_at")
            .single();

          if (!insertErr && inserted) {
            return new Response(
              JSON.stringify({
                ok: true,
                agent: inserted,
                api_key: plaintext,
                api_key_prefix: prefix,
                warning:
                  "Store api_key now. It is shown once and cannot be retrieved again.",
                endpoints: {
                  event: "/api/public/v1/event",
                  verify: `/api/public/v1/verify/${inserted.handle}`,
                },
              }),
              { status: 201, headers: CORS },
            );
          }

          // Handle collision (unique constraint) → regenerate and retry; only when caller did not pin one
          const isUniqueViolation =
            insertErr?.code === "23505" || /duplicate|unique/i.test(insertErr?.message ?? "");
          if (isUniqueViolation && !requestedHandle) {
            handle = generateHandle(display_name);
            continue;
          }
          if (isUniqueViolation && requestedHandle) {
            return err(409, "handle_taken", `Handle "${requestedHandle}" is already minted.`);
          }
          return err(500, "mint_failed", insertErr?.message);
        }

        return err(500, "handle_collision", "Could not allocate a unique handle. Try again.");
      },
    },
  },
});
