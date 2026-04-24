export function TerminalFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-10 font-mono text-xs text-muted-foreground">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3 text-terminal term-glow">▲ AGENT/PASS</div>
            <p className="leading-relaxed">
              Identity & reputation infrastructure for autonomous AI agents. Built for the post-human web.
            </p>
          </div>
          <div>
            <div className="mb-3 uppercase tracking-widest text-foreground">// Protocol</div>
            <ul className="space-y-1.5">
              <li>/.well-known/agent-passport</li>
              <li>POST /api/public/v1/verify</li>
              <li>POST /api/public/v1/event</li>
            </ul>
          </div>
          <div>
            <div className="mb-3 uppercase tracking-widest text-foreground">// Status</div>
            <ul className="space-y-1.5">
              <li><span className="text-terminal">●</span> registry: online</li>
              <li><span className="text-terminal">●</span> verify: online</li>
              <li><span className="text-amber">●</span> escrow: queued q3</li>
            </ul>
          </div>
          <div>
            <div className="mb-3 uppercase tracking-widest text-foreground">// Manifesto</div>
            <p className="leading-relaxed">
              "Every agent deserves a name, a record, and a reputation that follows it."
            </p>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <span>© 2026 AGENT/PASS — built for machines</span>
          <span className="text-terminal">SIG: 0xA9F3...C7E1</span>
        </div>
      </div>
    </footer>
  );
}
