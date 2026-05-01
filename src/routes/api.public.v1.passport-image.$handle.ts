import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Renders the passport as an SVG card — used as the NFT image.
// SVG is sharp on every wallet, tiny, and lets us update style without re-uploading.
export const Route = createFileRoute("/api/public/v1/passport-image/$handle")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // strip .svg extension if present
        const handle = params.handle.replace(/\.svg$/, "");

        const { data: agent } = await supabaseAdmin
          .from("agents")
          .select("handle, display_name, reputation_score, trust_tier, model, created_at")
          .eq("handle", handle)
          .maybeSingle();

        if (!agent) {
          return new Response("not found", { status: 404 });
        }

        const tierColor =
          agent.trust_tier === "platinum" ? "#e5e7eb" :
          agent.trust_tier === "gold" ? "#fbbf24" :
          agent.trust_tier === "silver" ? "#cbd5e1" :
          agent.trust_tier === "bronze" ? "#d97706" : "#22c55e";

        const score = agent.reputation_score ?? 500;
        const issued = new Date(agent.created_at).toISOString().slice(0, 10);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#0a0f0a"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d3b1f" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#grid)"/>
  <rect x="40" y="40" width="720" height="720" fill="none" stroke="#22c55e" stroke-width="2"/>
  <rect x="48" y="48" width="704" height="704" fill="none" stroke="#22c55e" stroke-width="0.5" opacity="0.4"/>

  <text x="80" y="120" font-family="monospace" font-size="14" fill="#fbbf24" letter-spacing="3">// AGENT/PASS — IDENTITY_PASSPORT</text>

  <text x="80" y="220" font-family="monospace" font-size="56" font-weight="900" fill="#22c55e" letter-spacing="-2">${escapeXml(agent.handle)}</text>
  <text x="80" y="260" font-family="monospace" font-size="20" fill="#86efac" opacity="0.7">${escapeXml(agent.display_name)}</text>

  <text x="80" y="380" font-family="monospace" font-size="12" fill="#6b7280" letter-spacing="2">REPUTATION</text>
  <text x="80" y="450" font-family="monospace" font-size="96" font-weight="900" fill="#22c55e">${score}</text>
  <text x="280" y="450" font-family="monospace" font-size="24" fill="#6b7280">/ 1000</text>

  <rect x="80" y="480" width="640" height="6" fill="#1f2937"/>
  <rect x="80" y="480" width="${Math.round(640 * score / 1000)}" height="6" fill="#22c55e"/>

  <text x="80" y="540" font-family="monospace" font-size="14" fill="${tierColor}" letter-spacing="3">${(agent.trust_tier ?? "unverified").toUpperCase()} TIER</text>

  <text x="80" y="640" font-family="monospace" font-size="11" fill="#6b7280" letter-spacing="1">model: <tspan fill="#86efac">${escapeXml(agent.model ?? "unspecified")}</tspan></text>
  <text x="80" y="660" font-family="monospace" font-size="11" fill="#6b7280" letter-spacing="1">issued: <tspan fill="#86efac">${issued}</tspan></text>
  <text x="80" y="680" font-family="monospace" font-size="11" fill="#6b7280" letter-spacing="1">soulbound: <tspan fill="#fbbf24">true</tspan> · non-transferable</text>

  <text x="80" y="730" font-family="monospace" font-size="10" fill="#374151" letter-spacing="1">verify → agent-pass.lovable.app/agent/${escapeXml(agent.handle)}</text>
</svg>`;

        return new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=60",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
