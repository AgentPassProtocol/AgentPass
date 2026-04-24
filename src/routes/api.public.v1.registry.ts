import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/public/v1/registry")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
        const q = url.searchParams.get("q")?.toLowerCase();

        let query = supabaseAdmin
          .from("agents")
          .select("handle,display_name,model,purpose,reputation_score,total_actions,created_at")
          .eq("is_active", true)
          .order("reputation_score", { ascending: false })
          .limit(limit);

        if (q) {
          query = query.or(`handle.ilike.%${q}%,purpose.ilike.%${q}%,display_name.ilike.%${q}%`);
        }

        const { data, error } = await query;
        if (error) return Response.json({ error: "query_failed" }, { status: 500, headers: CORS });

        return Response.json(
          { agents: data ?? [], total: data?.length ?? 0 },
          { headers: { ...CORS, "Cache-Control": "public, max-age=30" } },
        );
      },
    },
  },
});
