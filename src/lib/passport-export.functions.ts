import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  signPayload,
  PASSPORT_ISSUER,
  SIGNATURE_ALG,
} from "@/lib/passport-sign.server";

const InputSchema = z.object({
  agentId: z.string().uuid(),
});

export const exportPassportBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Use admin client for read to avoid RLS edge cases, but enforce ownership.
    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select(
        "id, operator_id, handle, display_name, model, purpose, public_key, api_key_prefix, reputation_score, trust_tier, total_actions, successful_actions, flagged_actions, is_active, created_at, updated_at",
      )
      .eq("id", data.agentId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!agent) throw new Error("Passport not found");
    if (agent.operator_id !== userId) throw new Error("Not authorized");

    const { data: verifications } = await supabaseAdmin
      .from("verifications")
      .select("kind, value, status, verified_at, created_at")
      .eq("agent_id", agent.id);

    const issuedAt = new Date().toISOString();

    // Payload that gets signed. Anything outside `payload` is metadata only.
    const payload = {
      issuer: PASSPORT_ISSUER,
      issued_at: issuedAt,
      subject: {
        handle: agent.handle,
        display_name: agent.display_name,
        model: agent.model,
        purpose: agent.purpose,
        public_key: agent.public_key,
        api_key_prefix: agent.api_key_prefix,
        is_active: agent.is_active,
        created_at: agent.created_at,
      },
      reputation: {
        score: agent.reputation_score,
        tier: agent.trust_tier,
        total_actions: agent.total_actions,
        successful_actions: agent.successful_actions,
        flagged_actions: agent.flagged_actions,
        snapshot_at: agent.updated_at,
      },
      verifications: (verifications ?? []).map((v) => ({
        kind: v.kind,
        value: v.value,
        status: v.status,
        verified_at: v.verified_at,
      })),
    };

    const signature = signPayload(payload);

    const bundle = {
      $schema: "https://agentpass.dev/schemas/passport-bundle/v1.json",
      format: "agentpass.passport-bundle",
      version: 1,
      algorithm: SIGNATURE_ALG,
      key_id: `${PASSPORT_ISSUER}:default`,
      verify_endpoint: "/api/public/v1/verify-bundle",
      payload,
      signature,
    };

    return { bundle };
  });
