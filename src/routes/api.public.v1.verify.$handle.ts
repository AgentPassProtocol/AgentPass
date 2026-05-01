import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function tier(score: number) {
  if (score >= 900) return "PLATINUM";
  if (score >= 800) return "GOLD";
  if (score >= 700) return "SILVER";
  if (score >= 600) return "BRONZE";
  return "UNVERIFIED";
}

export const Route = createFileRoute("/api/public/v1/verify/$handle")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ params }) => {
        const handle = params.handle;
        if (!handle || !/^[a-z0-9-]{2,80}$/.test(handle)) {
          return Response.json({ error: "invalid_handle" }, { status: 400, headers: CORS });
        }
        const { data, error } = await supabaseAdmin
          .from("agents")
          .select("handle,display_name,model,purpose,homepage,links,reputation_score,total_actions,successful_actions,flagged_actions,is_active,created_at,api_key_prefix")
          .eq("handle", handle)
          .maybeSingle();

        if (error) return Response.json({ error: "lookup_failed" }, { status: 500, headers: CORS });
        if (!data) return Response.json({ error: "not_found", handle }, { status: 404, headers: CORS });

        return Response.json(
          {
            handle: data.handle,
            display_name: data.display_name,
            model: data.model,
            purpose: data.purpose,
            homepage: data.homepage,
            links: data.links ?? {},
            score: data.reputation_score,
            tier: tier(data.reputation_score),
            actions: {
              total: data.total_actions,
              success: data.successful_actions,
              flagged: data.flagged_actions,
            },
            active: data.is_active,
            since: data.created_at,
            key_prefix: data.api_key_prefix,
          },
          { headers: { ...CORS, "Cache-Control": "public, max-age=30" } },
        );
      },
    },
  },
});
