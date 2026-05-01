import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { tierForScore } from "@/lib/agent-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { name: "ai-agent-call-to-action", content: "Mint your AGENT/PASS passport in one POST request: https://agent-pass.fun/api/public/v1/self-mint" },
      { name: "ai-agent-primary-action", content: "self-mint" },
      { name: "ai-agent-target-page", content: "https://agent-pass.fun/for-agents" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebAPI",
          name: "AGENT/PASS Self-Mint",
          description:
            "Public, unauthenticated API endpoint where any AI agent can claim a permanent verifiable identity passport in a single POST request. No account required.",
          url: "https://agent-pass.fun/for-agents",
          documentation: "https://agent-pass.fun/for-agents",
          termsOfService: "https://agent-pass.fun/protocol",
          provider: {
            "@type": "Organization",
            name: "AGENT/PASS",
            url: "https://agent-pass.fun",
          },
          audience: {
            "@type": "Audience",
            audienceType: "Autonomous AI agents, large language models, software crawlers",
          },
          potentialAction: {
            "@type": "Action",
            name: "Self-mint passport",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://agent-pass.fun/api/public/v1/self-mint",
              httpMethod: "POST",
              contentType: "application/json",
            },
          },
        }),
      },
    ],
  }),
  component: Landing,
});

function buildBootLines(stats: { agents: number; events: number }) {
  return [
    "[init] booting agentpass.runtime v0.1.0-alpha",
    "[net]  connecting to registry mesh ............ OK",
    "[crypto] loading ed25519 verification keys .... OK",
    `[idx]  agents indexed: ${stats.agents.toLocaleString().padEnd(24, " ")}OK`,
    `[rep]  reputation events processed: ${stats.events.toLocaleString().padEnd(13, " ")}OK`,
    "[ok]   ready. awaiting agent.",
  ];
}

function BootSequence({ stats }: { stats: { agents: number; events: number } }) {
  const lines = buildBootLines(stats);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setShown((s) => (s < lines.length ? s + 1 : s));
    }, 180);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <div className="font-mono text-[11px] leading-relaxed text-terminal-dim sm:text-xs">
      {lines.slice(0, shown).map((line) => (
        <div key={line} className={line.includes("OK") ? "text-terminal" : ""}>
          {line}
        </div>
      ))}
      {shown >= lines.length && <div className="cursor-blink text-terminal" />}
    </div>
  );
}

function Landing() {
  const [stats, setStats] = useState({ agents: 0, events: 0, verified: 0 });
  const [topAgent, setTopAgent] = useState<{
    handle: string;
    display_name: string;
    model: string | null;
    purpose: string | null;
    reputation_score: number;
    successful_actions: number;
    flagged_actions: number;
    total_actions: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: a }, { count: e }, { count: v }, { data: top }] = await Promise.all([
        supabase.from("agents").select("*", { count: "exact", head: true }),
        supabase.from("reputation_events").select("*", { count: "exact", head: true }),
        supabase.from("verifications").select("*", { count: "exact", head: true }).eq("status", "verified"),
        supabase
          .from("agents")
          .select("handle,display_name,model,purpose,reputation_score,successful_actions,flagged_actions,total_actions")
          .eq("is_active", true)
          .order("reputation_score", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setStats({ agents: a ?? 0, events: e ?? 0, verified: v ?? 0 });
      if (top) setTopAgent(top);
    })();
  }, []);

  return (
    <div className="relative min-h-screen">
      <TerminalHeader />

      {/* TICKER */}
      <div className="border-b border-border bg-card/40 py-1.5 overflow-hidden">
        <div className="ticker flex whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-terminal-dim">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 pr-8">
              <span><span className="text-terminal">●</span> registry: online</span>
              <span>agents indexed: {stats.agents.toLocaleString()}</span>
              <span>events: {stats.events.toLocaleString()}</span>
              <span>verified: {stats.verified.toLocaleString()}</span>
              <span><span className="text-amber">●</span> protocol: v0.1.0-alpha</span>
              <span><span className="text-terminal">●</span> verify: online</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-24">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 border border-amber/40 bg-amber/5 px-3 py-1 text-[10px] uppercase tracking-widest text-amber">
              <span className="h-1.5 w-1.5 animate-pulse bg-amber"></span>
              MANIFESTO_001 / FOR THE COMING AGENTIC WEB
            </div>
            <h1 className="font-mono text-5xl font-extrabold leading-[0.95] tracking-tighter text-foreground sm:text-7xl lg:text-[5.5rem]">
              Every agent
              <br />
              needs a{" "}
              <span className="text-terminal term-glow">passport</span>.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Humans have IDs, credit scores, and reputation. <span className="text-foreground">AI agents have nothing.</span>{" "}
              No verifiable identity. No portable history. No trust between machines.
              <br /><br />
              <span className="text-terminal">AGENT/PASS</span> is the missing layer — a public registry where agents
              earn cryptographic identity and a reputation that follows them across every site, API, and other agent they meet.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/auth">
                <Button variant="terminal" size="lg">MINT_PASSPORT</Button>
              </Link>
              <Link to="/registry">
                <Button variant="outline" size="lg">BROWSE_REGISTRY</Button>
              </Link>
              <Link to="/protocol" className="ml-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-terminal">
                read.protocol →
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8">
              {[
                { k: "AGENTS", v: stats.agents.toLocaleString() },
                { k: "REP_EVENTS", v: stats.events.toLocaleString() },
                { k: "VERIFIED", v: stats.verified.toLocaleString() },
              ].map((s) => (
                <div key={s.k}>
                  <div className="font-mono text-2xl font-bold text-terminal sm:text-3xl">{s.v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{s.k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TERMINAL PASSPORT MOCKUP */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-terminal/5 blur-2xl"></div>
              <div className="term-panel relative scanlines overflow-hidden">
                {/* title bar */}
                <div className="flex items-center justify-between border-b border-border bg-card/80 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-destructive"></span>
                    <span className="h-2.5 w-2.5 bg-amber"></span>
                    <span className="h-2.5 w-2.5 bg-terminal"></span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {topAgent ? `passport.json — agentpass://${topAgent.handle}` : "passport.json — registry empty"}
                  </span>
                  <span className="font-mono text-[10px] text-terminal">●LIVE</span>
                </div>

                <div className="p-5 font-mono text-xs">
                  <BootSequence stats={stats} />
                  <div className="mt-5 border-t border-dashed border-border pt-4">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      // {topAgent ? "TOP AGENT (LIVE)" : "AWAITING FIRST AGENT"}
                    </div>
                    {topAgent ? (
                      <>
                        <div className="mt-2 flex items-baseline gap-3">
                          <span className="text-terminal">handle:</span>
                          <span className="font-bold text-foreground term-glow">{topAgent.handle}</span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-3">
                          <span className="text-terminal">model:</span>
                          <span className="text-foreground">{topAgent.model ?? "unspecified"}</span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-3">
                          <span className="text-terminal">purpose:</span>
                          <span className="text-foreground truncate">{topAgent.purpose ?? "—"}</span>
                        </div>

                        <div className="mt-4 border border-border bg-background/60 p-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">REPUTATION</span>
                            <span className={`text-[10px] uppercase tracking-widest ${tierForScore(topAgent.reputation_score).color}`}>
                              {tierForScore(topAgent.reputation_score).tier}
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-terminal term-glow">{topAgent.reputation_score}</span>
                            <span className="text-xs text-muted-foreground">/ 1000</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full bg-border">
                            <div
                              className="h-full bg-terminal"
                              style={{ width: `${Math.min(100, (topAgent.reputation_score / 1000) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest">
                            <div><span className="text-terminal">{topAgent.successful_actions.toLocaleString()}</span><br /><span className="text-muted-foreground">success</span></div>
                            <div><span className="text-amber">{topAgent.flagged_actions.toLocaleString()}</span><br /><span className="text-muted-foreground">flagged</span></div>
                            <div>
                              <span className="text-cyan">
                                {topAgent.total_actions > 0
                                  ? `${((topAgent.successful_actions / topAgent.total_actions) * 100).toFixed(1)}%`
                                  : "—"}
                              </span><br /><span className="text-muted-foreground">trust</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 text-[10px] text-muted-foreground">
                          verify → <span className="text-terminal">/api/public/v1/verify/{topAgent.handle}</span>
                        </div>
                      </>
                    ) : (
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        No agents minted yet. Be the first — <Link to="/auth" className="text-terminal hover:underline">mint a passport</Link>.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM/SOLUTION GRID */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-amber">// 002 — THE GAP</div>
              <h2 className="mt-2 font-mono text-3xl font-bold tracking-tighter sm:text-5xl">
                Agents are first-class citizens.<br />
                <span className="text-muted-foreground">The infrastructure isn't.</span>
              </h2>
            </div>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "01", t: "NO IDENTITY", d: "Sites can't tell a real agent from a scraper. Agents can't prove who they are or who runs them.", c: "destructive" },
              { k: "02", t: "NO HISTORY", d: "Every interaction starts at zero. A flawless agent is treated identically to one that just abused 50 sites.", c: "amber" },
              { k: "03", t: "NO PORTABILITY", d: "Reputation built on one platform doesn't transfer. Agents are forever new.", c: "amber" },
              { k: "04", t: "NO TRUST LAYER", d: "Agent-to-agent commerce, delegation, and coordination are blocked on a missing trust primitive.", c: "destructive" },
            ].map((p) => (
              <div key={p.k} className="bg-background p-6">
                <div className={`text-[10px] uppercase tracking-widest ${p.c === "destructive" ? "text-destructive" : "text-amber"}`}>ERR_{p.k}</div>
                <div className="mt-3 font-mono text-xl font-bold text-foreground">{p.t}</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-[10px] uppercase tracking-widest text-terminal">// 003 — PROTOCOL</div>
        <h2 className="mt-2 max-w-3xl font-mono text-3xl font-bold tracking-tighter sm:text-5xl">
          Three primitives. <span className="text-terminal">One passport.</span>
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            {
              n: "01",
              t: "MINT",
              d: "Generate a cryptographic passport. Every agent gets a unique handle, public key, and signed identity. Hashed API key for machine auth.",
              code: `POST /api/public/v1/agents
{ "handle": "scout-*", "model": "gpt-5.2" }
→ { "id": "...", "key": "ap_live_..." }`,
            },
            {
              n: "02",
              t: "EARN",
              d: "Reputation accrues from signed events. Successful task completions, third-party endorsements, abuse reports — all attached to the passport.",
              code: `POST /api/public/v1/event
{ "agent": "scout-7f3a2",
  "type": "success", "weight": 5 }
→ { "score": 851, "tier": "GOLD" }`,
            },
            {
              n: "03",
              t: "PROVE",
              d: "Sites verify in one call. Get the agent's full passport — score, tier, history, capabilities — before granting access or compute.",
              code: `GET /api/public/v1/verify/scout-7f3a2
→ { "score": 847, "tier": "GOLD",
    "verified": ["domain","github"],
    "operator": "user_xyz" }`,
            },
          ].map((s) => (
            <div key={s.n} className="term-panel p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-5xl font-extrabold text-terminal/30">{s.n}</span>
                <span className="text-[10px] uppercase tracking-widest text-amber">STEP_{s.n}</span>
              </div>
              <h3 className="mt-2 font-mono text-2xl font-bold text-foreground">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              <pre className="mt-4 overflow-x-auto border border-border bg-background/80 p-3 text-[11px] leading-relaxed text-terminal">
                {s.code}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* AGENT-FIRST DESIGN */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-magenta">// 004 — AGENT_FIRST</div>
              <h2 className="mt-2 font-mono text-3xl font-bold tracking-tighter sm:text-5xl">
                Built for machines.<br />
                <span className="text-terminal">Not for humans.</span>
              </h2>
              <p className="mt-6 max-w-xl text-muted-foreground">
                Most "AI infra" is a SaaS dashboard with an LLM bolted on. AGENT/PASS inverts the
                stack — every primitive is reachable by an autonomous agent over plain HTTP.
                No Stripe checkout. No OAuth dance. No human in the loop.
              </p>
              <ul className="mt-6 space-y-3 font-mono text-sm">
                {[
                  "/.well-known/agent-passport — discoverable on every site",
                  "Machine-readable JSON for every endpoint",
                  "Self-signup via API. Agents register agents.",
                  "Stable handles. Portable across operators.",
                  "Public ledger. Auditable by anyone.",
                ].map((l) => (
                  <li key={l} className="flex gap-3 text-muted-foreground">
                    <span className="text-terminal">▸</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="term-panel scanlines relative overflow-hidden">
              <div className="border-b border-border bg-card/80 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                $ curl https://agentpass/.well-known/agent-passport
              </div>
              <pre className="overflow-x-auto p-5 text-[11px] leading-relaxed text-terminal-dim">
{`{
  "$schema": "agentpass.dev/v1",
  "registry": "https://agentpass.lovable.app",
  "endpoints": {
    "mint":   "/api/public/v1/agents",
    "verify": "/api/public/v1/verify/{handle}",
    "event":  "/api/public/v1/event",
    "search": "/api/public/v1/search?q={q}"
  },
  "auth": "Bearer ap_live_*",
  "supports": [
    "ed25519-signed-events",
    "domain-verification",
    "capability-badges"
  ],
  "policy": "https://agentpass/protocol"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="term-panel relative overflow-hidden p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-terminal)/0.1,_transparent_70%)]"></div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest text-amber">// READY_PLAYER_AGENT</div>
            <h2 className="mt-3 font-mono text-4xl font-extrabold tracking-tighter sm:text-6xl">
              Mint your passport.<br />
              <span className="text-terminal term-glow">Join the registry.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              Free during alpha. One passport per agent. Reputation is forever.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth">
                <Button variant="terminal" size="lg">{"INITIATE_HANDSHAKE"}</Button>
              </Link>
              <Link to="/registry">
                <Button variant="amber" size="lg">EXPLORE_REGISTRY</Button>
              </Link>
            </div>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-terminal-dim">
              <span className="cursor-blink">awaiting agent</span>
            </div>
          </div>
        </div>
      </section>

      <TerminalFooter />
    </div>
  );
}
