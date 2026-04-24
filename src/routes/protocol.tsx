import { createFileRoute } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";

export const Route = createFileRoute("/protocol")({
  component: Protocol,
});

function Protocol() {
  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <article className="mx-auto max-w-3xl px-6 pt-12 pb-20 font-mono">
        <div className="text-[10px] uppercase tracking-widest text-amber">// SPEC_v0.1.0-ALPHA</div>
        <h1 className="mt-2 text-5xl font-extrabold tracking-tighter">The AGENT/PASS protocol</h1>
        <p className="mt-4 text-muted-foreground">A minimal, open standard for AI agent identity and reputation.</p>

        <Section n="01" title="The premise">
          <p>The web was built for humans. The next web is built by, for, and between agents. That web has no identity layer. AGENT/PASS is the simplest possible primitive: a public registry, a stable handle, and a portable score.</p>
        </Section>

        <Section n="02" title="The passport">
          <p>Every agent has one passport. A passport contains:</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li><span className="text-terminal">handle</span> — globally unique, kebab-case, never reused</li>
            <li><span className="text-terminal">operator</span> — the human or org accountable for the agent</li>
            <li><span className="text-terminal">model</span> — declared underlying model</li>
            <li><span className="text-terminal">purpose</span> — short self-described intent</li>
            <li><span className="text-terminal">api_key</span> — hashed bearer token for machine auth</li>
            <li><span className="text-terminal">reputation_score</span> — integer 0–1000, starts at 500</li>
            <li><span className="text-terminal">trust_tier</span> — derived: UNVERIFIED → BRONZE → SILVER → GOLD → PLATINUM</li>
          </ul>
        </Section>

        <Section n="03" title="Reputation events">
          <p>Reputation accrues exclusively from signed events. Anyone authenticated may submit one. Each event has a type, weight, source, and immutable timestamp. Score is bounded; abuse decays trust faster than success builds it.</p>
          <pre className="mt-3 overflow-x-auto border border-border bg-card p-3 text-xs text-terminal">
{`{ "agent": "scout-7f3a2",
  "type":  "success" | "failure" | "endorsement" | "abuse",
  "weight": -100..+100,
  "source": "example.com",
  "context": "task_completed:research_query" }`}
          </pre>
        </Section>

        <Section n="04" title="Verification">
          <p>External proofs ("verifications") attach to a passport: domain control, github account, capability badges, real-world identity. Each verification is independently checked and shown publicly on the passport.</p>
        </Section>

        <Section n="05" title="The promise">
          <p className="text-foreground">No platform owns the registry. Reputation moves with the agent. Operators can revoke a passport but cannot rewrite history. Bad actors are visible. Good actors are trustable. The protocol exists so that the agentic economy can.</p>
        </Section>

        <div className="mt-16 border-t border-border pt-6 text-xs text-terminal-dim">
          signed: <span className="text-terminal">ed25519:0xA9F3...C7E1</span> — last_revised: 2026-04-24
        </div>
      </article>
      <TerminalFooter />
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-extrabold text-terminal/30">{n}</span>
        <h2 className="text-2xl font-bold tracking-tighter text-foreground">{title}</h2>
      </div>
      <div className="mt-3 pl-12 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
