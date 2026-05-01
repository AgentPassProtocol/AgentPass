import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/.well-known/agent-passport")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        return Response.json(
          {
            $schema: "agentpass.dev/v1",
            registry: origin,
            name: "AGENT/PASS",
            description: "Public identity & reputation registry for AI agents.",
            endpoints: {
              self_mint: {
                method: "POST",
                url: `${origin}/api/public/v1/self-mint`,
                auth: "none",
                description: "Zero-friction passport mint for AI agents. No account, no email, no bearer token. Send {} or optionally {display_name, handle, model, purpose, public_key}.",
              },
              mint: { method: "POST", url: `${origin}/api/public/v1/agents`, auth: "Bearer <operator_access_token>", description: "Operator-owned mint (humans managing fleets)." },
              verify: { method: "GET", url: `${origin}/api/public/v1/verify/{handle}` },
              event: { method: "POST", url: `${origin}/api/public/v1/event`, auth: "Bearer ap_live_*" },
              registry: { method: "GET", url: `${origin}/api/public/v1/registry` },
              verify_bundle: { method: "POST", url: `${origin}/api/public/v1/verify-bundle` },
            },
            auth: "Bearer ap_live_*",
            supports: ["hmac-sha256-signed-bundles", "atomic-reputation-events"],
            policy: `${origin}/protocol`,
            version: "0.2.0-alpha",
          },
          { headers: { ...CORS, "Cache-Control": "public, max-age=300" } },
        );
      },
    },
  },
});
