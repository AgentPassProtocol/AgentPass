import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { extractBearer, sha256Hex } from "@/lib/agent-utils.server";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const EventSchema = z.object({
  type: z.enum(["success", "failure", "abuse", "verified"]),
  weight: z.number().int().min(1).max(50).optional(),
  source: z.string().min(1).max(120).optional(),
  context: z.string().max(500).optional(),
  metadata: z.record(z.string().max(64), z.unknown()).optional(),
});

function err(status: number, code: string, message?: string) {
  return new Response(
    JSON.stringify({ error: code, message: message ?? code }),
    { status, headers: CORS },
  );
}

export const Route = createFileRoute("/api/public/v1/event")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        // 1. Authenticate the agent via its API key
        const token = extractBearer(request);
        if (!token || !token.startsWith("ap_live_")) {
          return err(401, "missing_credentials", "Provide Authorization: Bearer ap_live_*");
        }

        const hash = sha256Hex(token);
        const { data: agent, error: lookupErr } = await supabaseAdmin
          .from("agents")
          .select("id, handle, is_active")
          .eq("api_key_hash", hash)
          .maybeSingle();

        if (lookupErr) return err(500, "lookup_failed");
        if (!agent) return err(401, "invalid_credentials");
        if (!agent.is_active) return err(403, "agent_inactive");

        // 2. Validate body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return err(400, "invalid_json");
        }

        const parsed = EventSchema.safeParse(body);
        if (!parsed.success) {
          return err(400, "invalid_payload", parsed.error.issues[0]?.message ?? "invalid");
        }

        // 3. Apply atomically via the SECURITY DEFINER function
        const { data: result, error: rpcErr } = await supabaseAdmin.rpc(
          "apply_reputation_event",
          {
            _agent_id: agent.id,
            _event_type: parsed.data.type,
            _weight: parsed.data.weight ?? 1,
            _source: (parsed.data.source ?? "") as string,
            _context: (parsed.data.context ?? "") as string,
            _metadata: (parsed.data.metadata ?? {}) as unknown as never,
          },
        );

        if (rpcErr) return err(500, "event_failed", rpcErr.message);

        const row = Array.isArray(result) ? result[0] : result;

        return new Response(
          JSON.stringify({
            ok: true,
            handle: agent.handle,
            recorded: {
              type: parsed.data.type,
              weight: parsed.data.weight ?? 1,
              source: parsed.data.source ?? null,
              at: new Date().toISOString(),
            },
            agent: {
              score: row?.score,
              tier: row?.tier,
              total_actions: row?.total,
              successful_actions: row?.success,
              flagged_actions: row?.flagged,
            },
          }),
          { status: 200, headers: CORS },
        );
      },
    },
  },
});
