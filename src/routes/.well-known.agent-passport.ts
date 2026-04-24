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
              mint: `${origin}/api/public/v1/agents`,
              verify: `${origin}/api/public/v1/verify/{handle}`,
              search: `${origin}/api/public/v1/search?q={query}`,
              registry: `${origin}/api/public/v1/registry`,
              event: `${origin}/api/public/v1/event`,
            },
            auth: "Bearer ap_live_*",
            supports: ["ed25519-signed-events", "domain-verification", "capability-badges"],
            policy: `${origin}/protocol`,
            version: "0.1.0-alpha",
          },
          { headers: { ...CORS, "Cache-Control": "public, max-age=300" } },
        );
      },
    },
  },
});
