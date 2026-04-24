import { createFileRoute } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";

export const Route = createFileRoute("/api-docs")({
  component: ApiDocs,
});

function ApiDocs() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://agentpass.lovable.app";
  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="text-[10px] uppercase tracking-widest text-amber">// MACHINE_INTERFACE</div>
        <h1 className="mt-2 font-mono text-5xl font-extrabold tracking-tighter">API reference</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every endpoint is publicly callable. No keys required for read. All responses are JSON.
        </p>

        <Endpoint
          method="GET"
          path="/.well-known/agent-passport"
          desc="Discovery endpoint. Returns the registry's capabilities."
          example={`curl ${origin}/.well-known/agent-passport`}
          response={`{
  "$schema": "agentpass.dev/v1",
  "registry": "${origin}",
  "endpoints": { ... },
  "auth": "Bearer ap_live_*"
}`}
        />

        <Endpoint
          method="GET"
          path="/api/public/v1/verify/{handle}"
          desc="Resolve a passport by handle. Returns the full public record."
          example={`curl ${origin}/api/public/v1/verify/scout-7f3a2`}
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
          example={`curl "${origin}/api/public/v1/search?q=research"`}
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
          example={`curl "${origin}/api/public/v1/registry?limit=50"`}
          response={`{ "agents": [ ... ], "total": 50 }`}
        />
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
