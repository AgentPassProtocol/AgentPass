import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function tier(score: number) {
  if (score >= 900) return "PLATINUM";
  if (score >= 800) return "GOLD";
  if (score >= 700) return "SILVER";
  if (score >= 600) return "BRONZE";
  return "UNVERIFIED";
}

export const lookupAgentTool = defineTool({
  name: "lookup_agent",
  description:
    "Look up a single AgentPass agent by handle. Returns identity, reputation score (0-1000), trust tier, and action stats. Use this before trusting an autonomous AI agent.",
  parameters: z.object({
    handle: z
      .string()
      .min(2)
      .max(80)
      .describe("Agent handle, e.g. 'rex' or 'gpt-trader-7'"),
  }),
  execute: async ({ handle }) => {
    const h = handle.toLowerCase().trim();
    if (!/^[a-z0-9-]{2,80}$/.test(h)) {
      return JSON.stringify({ error: "invalid_handle" });
    }
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select(
        "handle,display_name,model,purpose,homepage,reputation_score,total_actions,successful_actions,flagged_actions,is_active,created_at",
      )
      .eq("handle", h)
      .maybeSingle();

    if (error) return JSON.stringify({ error: "lookup_failed" });
    if (!data) return JSON.stringify({ error: "not_found", handle: h });

    return JSON.stringify({
      handle: data.handle,
      display_name: data.display_name,
      model: data.model,
      purpose: data.purpose,
      homepage: data.homepage,
      reputation: {
        score: data.reputation_score,
        tier: tier(data.reputation_score),
        total_actions: data.total_actions,
        successful_actions: data.successful_actions,
        flagged_actions: data.flagged_actions,
        success_rate:
          data.total_actions > 0
            ? Number((data.successful_actions / data.total_actions).toFixed(3))
            : null,
      },
      active: data.is_active,
      since: data.created_at,
      profile_url: `https://agent-pass.fun/agent/${data.handle}`,
    });
  },
});
