import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";
import { supabase } from "@/integrations/supabase/client";
import { tierForScore } from "@/lib/agent-utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/$handle")({
  component: AgentDetail,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <TerminalHeader />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center font-mono">
        <div className="text-6xl text-amber term-glow-amber">404</div>
        <div className="mt-4 text-xl">Agent not found in registry.</div>
        <Link to="/registry" className="mt-6 inline-block text-terminal hover:underline">← back to registry</Link>
      </div>
    </div>
  ),
});

interface AgentFull {
  id: string;
  operator_id: string;
  handle: string;
  display_name: string;
  model: string | null;
  purpose: string | null;
  api_key_prefix: string;
  reputation_score: number;
  trust_tier: string;
  total_actions: number;
  successful_actions: number;
  flagged_actions: number;
  created_at: string;
}

interface RepEvent {
  id: string;
  event_type: string;
  weight: number;
  source: string | null;
  context: string | null;
  created_at: string;
}

function AgentDetail() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentFull | null>(null);
  const [events, setEvents] = useState<RepEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data: a } = await supabase.from("agents").select("*").eq("handle", handle).maybeSingle();
    if (!a) { setLoading(false); return; }
    setAgent(a as AgentFull);
    const { data: e } = await supabase
      .from("reputation_events")
      .select("*")
      .eq("agent_id", a.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setEvents((e ?? []) as RepEvent[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [handle]);

  async function submitEvent(type: "success" | "failure" | "endorsement" | "abuse") {
    if (!agent || !user) {
      toast.error("Sign in to submit reputation events");
      return;
    }
    setSubmitting(true);
    const weight = type === "success" || type === "endorsement" ? 5 : -10;
    const { error } = await supabase.from("reputation_events").insert({
      agent_id: agent.id,
      event_type: type,
      weight,
      source: user.email ?? "anonymous",
      context: `manual_${type}_via_console`,
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }

    // update aggregate
    const newScore = Math.max(0, Math.min(1000, agent.reputation_score + weight));
    await supabase.from("agents").update({
      reputation_score: newScore,
      total_actions: agent.total_actions + 1,
      successful_actions: agent.successful_actions + (weight > 0 ? 1 : 0),
      flagged_actions: agent.flagged_actions + (weight < 0 ? 1 : 0),
    }).eq("id", agent.id);

    toast.success(`Event logged: ${type}`);
    await load();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <TerminalHeader />
        <div className="mx-auto max-w-7xl px-6 py-16 font-mono text-terminal">
          <span className="cursor-blink">resolving handle</span>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen">
        <TerminalHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center font-mono">
          <div className="text-6xl text-amber term-glow-amber">404</div>
          <div className="mt-4 text-xl">No passport for handle: <span className="text-terminal">{handle}</span></div>
          <Link to="/registry" className="mt-6 inline-block text-terminal hover:underline">← back to registry</Link>
        </div>
      </div>
    );
  }

  const tier = tierForScore(agent.reputation_score);
  const isOwner = user?.id === agent.operator_id;

  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="text-[10px] uppercase tracking-widest text-amber">
          // PASSPORT_RECORD — agentpass://{agent.handle}
        </div>

        <div className="mt-4 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="font-mono text-5xl font-extrabold tracking-tighter text-foreground sm:text-6xl term-glow">
              {agent.handle}
            </h1>
            <div className="mt-2 text-lg text-muted-foreground">{agent.display_name}</div>

            <div className="mt-6 grid gap-3 text-sm">
              <Row k="model" v={agent.model ?? "—"} />
              <Row k="purpose" v={agent.purpose ?? "—"} />
              <Row k="api_key" v={`${agent.api_key_prefix}...`} />
              <Row k="active_since" v={new Date(agent.created_at).toISOString().slice(0, 10)} />
              <Row k="signature" v="ed25519:0x4f...c91a" />
            </div>

            {/* Action log */}
            <div className="mt-12">
              <h2 className="mb-4 text-[10px] uppercase tracking-widest text-amber">// REPUTATION_LOG</h2>
              <div className="term-panel divide-y divide-border">
                {events.length === 0 ? (
                  <div className="p-6 font-mono text-sm text-muted-foreground">
                    No events yet. Be the first to log one →
                  </div>
                ) : events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-4 font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <span className={
                        e.event_type === "success" || e.event_type === "endorsement"
                          ? "text-terminal" : e.event_type === "abuse" ? "text-destructive" : "text-amber"
                      }>
                        {e.event_type === "success" ? "✓" : e.event_type === "abuse" ? "✗" : e.event_type === "endorsement" ? "★" : "⚠"}
                      </span>
                      <span className="font-bold uppercase text-foreground">{e.event_type}</span>
                      <span className="text-muted-foreground">{e.context ?? "—"}</span>
                      {e.source && <span className="text-terminal-dim">via {e.source}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={e.weight > 0 ? "text-terminal" : "text-destructive"}>
                        {e.weight > 0 ? "+" : ""}{e.weight}
                      </span>
                      <span className="text-muted-foreground">{new Date(e.created_at).toISOString().slice(5, 16).replace("T", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="term-panel scanlines relative overflow-hidden p-6">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">REPUTATION</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-terminal term-glow">{agent.reputation_score}</span>
                <span className="text-sm text-muted-foreground">/ 1000</span>
              </div>
              <div className={`mt-1 text-[10px] uppercase tracking-widest ${tier.color}`}>{tier.tier} TIER</div>
              <div className="mt-3 h-2 w-full bg-border">
                <div className="h-full bg-terminal" style={{ width: `${agent.reputation_score / 10}%` }}></div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest">
                <div><div className="text-lg font-bold text-terminal">{agent.successful_actions}</div><div className="text-muted-foreground">success</div></div>
                <div><div className="text-lg font-bold text-amber">{agent.flagged_actions}</div><div className="text-muted-foreground">flagged</div></div>
                <div><div className="text-lg font-bold text-foreground">{agent.total_actions}</div><div className="text-muted-foreground">total</div></div>
              </div>
            </div>

            <div className="term-panel p-6">
              <div className="mb-3 text-[10px] uppercase tracking-widest text-amber">// SUBMIT_EVENT</div>
              {!user ? (
                <div className="text-xs text-muted-foreground">
                  <Link to="/auth" className="text-terminal hover:underline">sign in</Link> to log events.
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="terminal" size="sm" className="w-full" disabled={submitting} onClick={() => submitEvent("success")}>
                    ✓ LOG_SUCCESS (+5)
                  </Button>
                  <Button variant="amber" size="sm" className="w-full" disabled={submitting} onClick={() => submitEvent("endorsement")}>
                    ★ ENDORSE (+5)
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/40 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={submitting} onClick={() => submitEvent("abuse")}>
                    ✗ FLAG_ABUSE (-10)
                  </Button>
                </div>
              )}
            </div>

            <div className="term-panel p-6 text-[11px]">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">// VERIFY_VIA_API</div>
              <pre className="overflow-x-auto text-terminal-dim">
{`curl ${typeof window !== "undefined" ? window.location.origin : ""}/api/public/v1/verify/${agent.handle}`}
              </pre>
            </div>

            {isOwner && (
              <Link to="/console">
                <Button variant="outline" className="w-full">← back_to_console</Button>
              </Link>
            )}
          </aside>
        </div>
      </div>
      <TerminalFooter />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3 font-mono">
      <span className="w-32 text-terminal">{k}:</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
