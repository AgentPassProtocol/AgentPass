import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { TerminalHeader } from "@/components/TerminalHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateApiKey, generateHandle, tierForScore } from "@/lib/agent-utils";
import { exportPassportBundle } from "@/lib/passport-export.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/console")({
  component: ConsolePage,
});

interface Agent {
  id: string;
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

function ConsolePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; handle: string } | null>(null);

  // create form
  const [name, setName] = useState("");
  const [model, setModel] = useState("gpt-5.2");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const exportFn = useServerFn(exportPassportBundle);

  async function handleExport(agent: Agent) {
    setExportingId(agent.id);
    try {
      const { bundle } = await exportFn({ data: { agentId: agent.id } });
      const json = JSON.stringify(bundle, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `passport-${agent.handle}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      try {
        await navigator.clipboard.writeText(json);
        toast.success(`Bundle exported · ${agent.handle} (also copied)`);
      } catch {
        toast.success(`Bundle exported · ${agent.handle}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingId(null);
    }
  }

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  async function loadAgents() {
    if (!user) return;
    setLoadingAgents(true);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("operator_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAgents((data ?? []) as Agent[]);
    setLoadingAgents(false);
  }

  useEffect(() => {
    if (user) loadAgents();
  }, [user]);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const handle = generateHandle(name);
      const { plaintext, prefix, hash } = await generateApiKey();
      const { error } = await supabase.from("agents").insert({
        operator_id: user.id,
        handle,
        display_name: name || handle,
        model,
        purpose: purpose || null,
        api_key_hash: hash,
        api_key_prefix: prefix,
      });
      if (error) throw error;
      setNewKey({ key: plaintext, handle });
      setName(""); setPurpose("");
      setShowCreate(false);
      await loadAgents();
      toast.success(`Passport minted: ${handle}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mint");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAgent(id: string, handle: string) {
    if (!confirm(`Revoke passport ${handle}? This is permanent.`)) return;
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Passport revoked"); loadAgents(); }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <TerminalHeader />
        <div className="mx-auto max-w-7xl px-6 py-16 font-mono text-terminal">
          <span className="cursor-blink">authenticating</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <TerminalHeader />
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber">
              // OPERATOR_CONSOLE — {user.email}
            </div>
            <h1 className="mt-2 font-mono text-4xl font-bold tracking-tighter">
              Your fleet.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {agents.length} {agents.length === 1 ? "passport" : "passports"} in registry.
            </p>
          </div>
          <Button variant="terminal" size="lg" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "CANCEL" : "+ MINT_PASSPORT"}
          </Button>
        </div>

        {/* New key reveal */}
        {newKey && (
          <div className="term-panel mt-6 border-amber/60 bg-amber/5 p-5">
            <div className="text-[10px] uppercase tracking-widest text-amber">
              ⚠ ONE_TIME_REVEAL — store this key. it will not be shown again.
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Passport: <span className="text-foreground">{newKey.handle}</span>
            </div>
            <div className="mt-3 break-all border border-amber/40 bg-background p-3 font-mono text-sm text-amber term-glow-amber">
              {newKey.key}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="amber" size="sm"
                onClick={() => { navigator.clipboard.writeText(newKey.key); toast.success("Copied"); }}
              >COPY_KEY</Button>
              <Button variant="ghost" size="sm" onClick={() => setNewKey(null)}>DISMISS</Button>
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <form onSubmit={createAgent} className="term-panel mt-6 grid gap-4 p-6 md:grid-cols-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-terminal">{">"} name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={64}
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-terminal"
                placeholder="Scout" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-terminal">{">"} model</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} required maxLength={64}
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-terminal" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-terminal">{">"} purpose</label>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={140}
                className="w-full border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-terminal"
                placeholder="research_assistant" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" variant="terminal" disabled={busy}>{busy ? "MINTING..." : "MINT"}</Button>
            </div>
          </form>
        )}

        {/* Agent list */}
        <div className="mt-10">
          {loadingAgents ? (
            <div className="font-mono text-terminal"><span className="cursor-blink">loading registry</span></div>
          ) : agents.length === 0 ? (
            <div className="term-panel p-12 text-center">
              <div className="text-5xl text-terminal/40">▲</div>
              <div className="mt-4 font-mono text-lg">No passports yet.</div>
              <p className="mt-2 text-sm text-muted-foreground">Mint your first agent passport above.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((a) => {
                const tier = tierForScore(a.reputation_score);
                return (
                  <div key={a.id} className="term-panel group p-5 transition-all hover:border-terminal">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to="/agent/$handle" params={{ handle: a.handle }} className="font-mono text-lg font-bold text-foreground hover:text-terminal">
                          {a.handle}
                        </Link>
                        <div className="text-xs text-muted-foreground">{a.display_name}</div>
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest ${tier.color}`}>{tier.tier}</span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-extrabold text-terminal term-glow">{a.reputation_score}</span>
                      <span className="text-xs text-muted-foreground">/ 1000</span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-border">
                      <div className="h-full bg-terminal" style={{ width: `${a.reputation_score / 10}%` }}></div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest">
                      <div><span className="text-terminal">{a.successful_actions}</span><br /><span className="text-muted-foreground">success</span></div>
                      <div><span className="text-amber">{a.flagged_actions}</span><br /><span className="text-muted-foreground">flagged</span></div>
                      <div><span className="text-foreground">{a.total_actions}</span><br /><span className="text-muted-foreground">total</span></div>
                    </div>
                    <div className="mt-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
                      key: <span className="text-terminal">{a.api_key_prefix}...</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link to="/agent/$handle" params={{ handle: a.handle }} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">VIEW</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => deleteAgent(a.id, a.handle)} className="text-destructive hover:text-destructive">REVOKE</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
