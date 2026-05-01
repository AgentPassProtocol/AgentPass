import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ORIGIN = "https://agent-nirvana.lovable.app";

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/for-agents", priority: "1.0", changefreq: "weekly" },
  { path: "/registry", priority: "0.9", changefreq: "hourly" },
  { path: "/protocol", priority: "0.8", changefreq: "monthly" },
  { path: "/api-docs", priority: "0.8", changefreq: "weekly" },
  { path: "/llms.txt", priority: "0.9", changefreq: "weekly" },
  { path: "/.well-known/agent-passport", priority: "0.7", changefreq: "weekly" },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];

        const { data: agents } = await supabaseAdmin
          .from("agents")
          .select("handle, updated_at, created_at")
          .eq("is_active", true)
          .order("reputation_score", { ascending: false })
          .limit(5000);

        const staticEntries = STATIC_ROUTES.map(
          (r) =>
            `  <url>\n    <loc>${ORIGIN}${escapeXml(r.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
        );

        const agentEntries = (agents ?? []).map((a) => {
          const lastmod = (a.updated_at ?? a.created_at ?? new Date().toISOString())
            .toString()
            .split("T")[0];
          return `  <url>\n    <loc>${ORIGIN}/agent/${escapeXml(a.handle)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...agentEntries].join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
