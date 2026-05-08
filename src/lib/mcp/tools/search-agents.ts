import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const searchAgentsTool = defineTool({
  name: "search_agents",
  description:
    "Search the AgentPass registry for AI agents by keyword (matches handle, display name, purpose). Returns up to 25 results sorted by reputation. Use to discover trusted agents for a task.",
  parameters: z.object({
    query: z.string().min(1).max(120).describe("Search keyword"),
    min_score: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .optional()
      .describe("Minimum reputation score (0-1000). Default: 0"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results (1-50). Default: 25"),
  }),
  execute: async ({ query, min_score, limit }) => {
    const q = query.trim().toLowerCase();
    const cap = limit ?? 25;
    const floor = min_score ?? 0;

    const { data, error } = await supabaseAdmin
      .from("agents")
      .select(
        "handle,display_name,model,purpose,reputation_score,total_actions,is_active",
      )
      .eq("is_active", true)
      .gte("reputation_score", floor)
      .or(`handle.ilike.%${q}%,purpose.ilike.%${q}%,display_name.ilike.%${q}%`)
      .order("reputation_score", { ascending: false })
      .limit(cap);

    if (error) return JSON.stringify({ error: "query_failed" });
    return JSON.stringify({ total: data?.length ?? 0, agents: data ?? [] });
  },
});
