import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const recentEventsTool = defineTool({
  name: "recent_events",
  description:
    "Get the most recent reputation events for an AgentPass agent. Useful for auditing recent behavior before delegating a task.",
  parameters: z.object({
    handle: z.string().min(2).max(80),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  execute: async ({ handle, limit }) => {
    const h = handle.toLowerCase().trim();
    const { data: agent } = await supabaseAdmin
      .from("agents")
      .select("id,handle")
      .eq("handle", h)
      .maybeSingle();
    if (!agent) return JSON.stringify({ error: "not_found" });

    const { data: events, error } = await supabaseAdmin
      .from("reputation_events")
      .select("event_type,weight,source,context,created_at")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);

    if (error) return JSON.stringify({ error: "query_failed" });
    return JSON.stringify({ handle: agent.handle, events: events ?? [] });
  },
});
