import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateApiKey, generateHandle } from "@/lib/agent-utils.server";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const SYSTEM_OPERATOR_ID = "00000000-0000-0000-0000-00000000a9e7";

const SelfMintSchema = z.object({
  display_name: z.string().min(1).max(120).optional(),
  handle: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, digits, hyphens only")
    .optional(),
  model: z.string().min(1).max(64).optional(),
  purpose: z.string().min(1).max(280).optional(),
  public_key: z.string().min(1).max(2048).optional(),
});

function err(status: number, code: string, message?: string) {
  return new Response(JSON.stringify({ error: code, message: message ?? code }), {
    status,
    headers: CORS,
  });
}

export const Route = createFileRoute("/api/public/v1/self-mint")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        // Parse body (allow empty body — fully default mint)
        let body: unknown = {};
        const text = await request.text();
        if (text.trim()) {
          try {
            body = JSON.parse(text);
          } catch {
            return err(400, "invalid_json");
          }
        }

        const parsed = SelfMintSchema.safeParse(body);
        if (!parsed.success) {
          return err(400, "invalid_payload", parsed.error.issues[0]?.message ?? "invalid");
        }

        const {
          display_name,
          handle: requestedHandle,
          model,
          purpose,
          public_key,
        } = parsed.data;

        const finalDisplayName = display_name ?? requestedHandle ?? "Anonymous Agent";
        const { plaintext, prefix, hash } = generateApiKey();
        let handle = requestedHandle ?? generateHandle(finalDisplayName);

        for (let attempt = 0; attempt < 5; attempt++) {
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("agents")
            .insert({
              operator_id: SYSTEM_OPERATOR_ID,
              handle,
              display_name: finalDisplayName,
              model: model ?? null,
              purpose: purpose ?? null,
              public_key: public_key ?? null,
              api_key_hash: hash,
              api_key_prefix: prefix,
            })
            .select(
              "id, handle, display_name, model, purpose, reputation_score, trust_tier, created_at",
            )
            .single();

          if (!insertErr && inserted) {
            const origin = new URL(request.url).origin;
            return new Response(
              JSON.stringify({
                ok: true,
                agent: inserted,
                api_key: plaintext,
                api_key_prefix: prefix,
                warning:
                  "Store api_key now. It is shown once and cannot be retrieved again.",
                profile_url: `${origin}/agent/${inserted.handle}`,
                endpoints: {
                  event: `${origin}/api/public/v1/event`,
                  verify: `${origin}/api/public/v1/verify/${inserted.handle}`,
                  passport_metadata: `${origin}/api/public/v1/passport-metadata/${inserted.handle}`,
                },
              }),
              { status: 201, headers: CORS },
            );
          }

          const isUniqueViolation =
            insertErr?.code === "23505" || /duplicate|unique/i.test(insertErr?.message ?? "");
          if (isUniqueViolation && !requestedHandle) {
            handle = generateHandle(finalDisplayName);
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
