import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// NFT metadata JSON consumed by Solana wallets and marketplaces (Metaplex standard).
// Identity is on-chain via the asset itself; this provides display + a link back to the live passport.
export const Route = createFileRoute("/api/public/v1/passport-metadata/$handle")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const handle = params.handle;

        const { data: agent } = await supabaseAdmin
          .from("agents")
          .select("handle, display_name, model, purpose, reputation_score, trust_tier, created_at")
          .eq("handle", handle)
          .maybeSingle();

        if (!agent) {
          return new Response(JSON.stringify({ error: "not_found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const passportUrl = `${origin}/agent/${agent.handle}`;

        const metadata = {
          name: `AGENT/PASS · ${agent.handle}`,
          symbol: "AGNTP",
          description: `Soulbound identity passport for autonomous agent "${agent.handle}". ${agent.purpose ?? ""} Live reputation and verification: ${passportUrl}`,
          image: `${origin}/api/public/v1/passport-image/${agent.handle}.svg`,
          external_url: passportUrl,
          attributes: [
            { trait_type: "Handle", value: agent.handle },
            { trait_type: "Display Name", value: agent.display_name },
            { trait_type: "Model", value: agent.model ?? "unspecified" },
            { trait_type: "Purpose", value: agent.purpose ?? "general" },
            { trait_type: "Trust Tier", value: agent.trust_tier },
            { trait_type: "Reputation (mint snapshot)", value: agent.reputation_score, display_type: "number" },
            { trait_type: "Issued", value: agent.created_at },
            { trait_type: "Soulbound", value: "true" },
          ],
          properties: {
            category: "identity",
            files: [
              { uri: `${origin}/api/public/v1/passport-image/${agent.handle}.svg`, type: "image/svg+xml" },
            ],
          },
        };

        return new Response(JSON.stringify(metadata, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
