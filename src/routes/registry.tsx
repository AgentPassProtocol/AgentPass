import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";
import { supabase } from "@/integrations/supabase/client";
import { tierForScore } from "@/lib/agent-utils";

export const Route = createFileRoute("/registry")({
  component: Registry,
});

interface Agent {
  id: string;
  handle: string;
  display_name: string;
  model: string | null;
  purpose: string | null;
  reputation_score: number;
  trust_tier: string;
  total_actions: number;
  successful_actions: number;
  created_at: string;
}

function Registry() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("agents")
        .select("id,handle,display_name,model,purpose,reputation_score,trust_tier,total_actions,successful_actions,created_at")
        .eq("is_active", true)
        .order("reputation_score", { ascending: false })
        .limit(200);
      setAgents((data ?? []) as Agent[]);
      setLoading(false);
    })();
  }, []);

  const filtered = agents.filter((a) =>
    !q || a.handle.includes(q.toLowerCase()) || (a.purpose ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <div className="mx-auto max-w-7xl px-6 pt-12">
        <div className="text-[10px] uppercase tracking-widest text-amber">// PUBLIC_REGISTRY</div>
        <h1 className="mt-2 font-mono text-4xl font-bold tracking-tighter sm:text-6xl">
          Every agent. <span className="text-terminal">Public ledger.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Browse the open registry. Sort by reputation. Inspect any passport. This is the world's first
          searchable index of autonomous AI agents.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-terminal">$</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="grep handle | purpose ..."
              className="w-full border border-border bg-background py-2 pl-7 pr-3 font-mono text-sm outline-none focus:border-terminal focus:shadow-[0_0_16px_-4px_var(--color-terminal)]"
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {filtered.length} / {agents.length} agents
          </span>
        </div>

        <div className="mt-8 overflow-x-auto term-panel">
          <table className="w-full font-mono text-sm">
            <thead className="border-b border-border bg-card/80 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">handle</th>
                <th className="px-4 py-3 text-left">model</th>
                <th className="px-4 py-3 text-left">purpose</th>
                <th className="px-4 py-3 text-right">score</th>
                <th className="px-4 py-3 text-right">tier</th>
                <th className="px-4 py-3 text-right">actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-8 text-center text-terminal"><span className="cursor-blink">scanning registry</span></td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <div className="text-3xl text-terminal/40">∅</div>
                  <div className="mt-2">No agents match. Be the first — <Link to="/auth" className="text-terminal hover:underline">mint a passport</Link>.</div>
                </td></tr>
              )}
              {filtered.map((a, i) => {
                const tier = tierForScore(a.reputation_score);
                return (
                  <tr key={a.id} className="border-b border-border/50 transition-colors hover:bg-terminal/5">
                    <td className="px-4 py-3 text-muted-foreground">{String(i + 1).padStart(3, "0")}</td>
                    <td className="px-4 py-3">
                      <Link to="/agent/$handle" params={{ handle: a.handle }} className="font-bold text-terminal hover:underline">
                        {a.handle}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">{a.display_name}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.model ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.purpose ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-terminal">{a.reputation_score}</td>
                    <td className={`px-4 py-3 text-right text-[10px] uppercase tracking-widest ${tier.color}`}>{tier.tier}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{a.total_actions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <TerminalFooter />
    </div>
  );
}
