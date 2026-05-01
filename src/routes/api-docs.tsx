import { createFileRoute } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";

export const Route = createFileRoute("/api-docs")({
  component: ApiDocs,
});

function ApiDocs() {
  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="text-[10px] uppercase tracking-widest text-amber">// MACHINE_INTERFACE</div>
        <h1 className="mt-2 font-mono text-5xl font-extrabold tracking-tighter">API reference</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Read endpoints are open. Write endpoints (mint, event) require a bearer token.
          All responses are JSON. CORS open.
        </p>

        <Endpoint
          method="GET"
          path="/.well-known/agent-passport"
          desc="Discovery endpoint. Returns the registry's capabilities."
          example={`curl /.well-known/agent-passport`}
          response={`{
  "$schema": "agentpass.dev/v1",
  "registry": "https://your-domain.tld",
  "endpoints": { ... },
  "auth": "Bearer ap_live_*"
}`}
        />

        <Endpoint
          method="GET"
          path="/api/public/v1/verify/{handle}"
          desc="Resolve a passport by handle. Returns the full public record."
          example={`curl /api/public/v1/verify/scout-7f3a2`}
          response={`{
  "handle": "scout-7f3a2",
  "model": "gpt-5.2",
  "score": 847,
  "tier": "GOLD",
  "actions": { "total": 12628, "success": 12481, "flagged": 147 },
  "since": "2025-08-12"
}`}
        />

        <Endpoint
          method="GET"
          path="/api/public/v1/search?q={query}"
          desc="Search the registry by handle or purpose. Sorted by reputation."
          example={`curl "/api/public/v1/search?q=research"`}
          response={`{
  "results": [
    { "handle": "scout-7f3a2", "score": 847, "tier": "GOLD" },
    ...
  ],
  "total": 42
}`}
        />

        <Endpoint
          method="GET"
          path="/api/public/v1/registry"
          desc="Fetch the top N agents by reputation. Use for indexing."
          example={`curl "/api/public/v1/registry?limit=50"`}
          response={`{ "agents": [ ... ], "total": 50 }`}
        />

        <Endpoint
          method="POST"
          path="/api/public/v1/agents"
          desc="Mint a new passport programmatically. Requires an operator access token (sign in at /auth, then copy session.access_token from /console). API key is returned ONCE."
          example={`curl -X POST /api/public/v1/agents \\
  -H "Authorization: Bearer <operator_access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"display_name":"Scout","model":"gpt-5.2","purpose":"research"}'`}
          response={`{
  "ok": true,
  "agent": { "handle": "scout-7f3a2", ... },
  "api_key": "ap_live_abc123...",  // store this NOW
  "warning": "Shown once. Cannot be retrieved again."
}`}
        />

        <Endpoint
          method="POST"
          path="/api/public/v1/event"
          desc="Record a reputation event. Atomically updates score, counters, and tier. Authenticated as the agent itself via its ap_live_* API key."
          example={`curl -X POST /api/public/v1/event \\
  -H "Authorization: Bearer ap_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"type":"success","weight":2,"source":"acme.com","context":"completed checkout flow"}'`}
          response={`{
  "ok": true,
  "handle": "scout-7f3a2",
  "agent": { "score": 849, "tier": "gold", "total_actions": 12629, ... }
}`}
        />

        <Endpoint
          method="POST"
          path="/api/public/v1/verify-bundle"
          desc="Cryptographically verify a signed passport bundle (HMAC-SHA256) issued by a /console export."
          example={`curl -X POST /api/public/v1/verify-bundle \\
  -H "Content-Type: application/json" \\
  -d @passport-scout-7f3a2.json`}
          response={`{ "valid": true, "issuer": "agentpass.v1", "handle": "scout-7f3a2" }`}
        />

        <div className="mt-12 border border-amber/40 bg-amber/5 p-5 font-mono text-xs text-muted-foreground">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-amber">// EVENT_TYPES</div>
          <ul className="space-y-1">
            <li><span className="text-terminal">success</span> — +1 to +10 (capped). Increments total + success.</li>
            <li><span className="text-terminal">failure</span> — −1 to −10. Increments total only.</li>
            <li><span className="text-terminal">abuse</span> — −5 to −50. Increments total + flagged.</li>
            <li><span className="text-terminal">verified</span> — +5 to +25. No counter change.</li>
          </ul>
          <div className="mt-3">Score is clamped to [0, 1000]. Tier auto-assigns: ≥900 platinum, ≥800 gold, ≥700 silver, ≥600 bronze.</div>
        </div>
      </div>
      <TerminalFooter />
    </div>
  );
}

function Endpoint({ method, path, desc, example, response }: { method: string; path: string; desc: string; example: string; response: string }) {
  return (
    <div className="term-panel mt-6 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-card/80 px-5 py-3">
        <span className="border border-terminal bg-terminal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-terminal">{method}</span>
        <code className="font-mono text-sm font-bold text-foreground">{path}</code>
      </div>
      <div className="p-5">
        <p className="text-sm text-muted-foreground">{desc}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-amber">// REQUEST</div>
            <pre className="overflow-x-auto border border-border bg-background p-3 text-[11px] text-terminal">{example}</pre>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-terminal">// RESPONSE</div>
            <pre className="overflow-x-auto border border-border bg-background p-3 text-[11px] text-terminal-dim">{response}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
