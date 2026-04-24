import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { TerminalHeader } from "@/components/TerminalHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/console" });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) toast.error(error);
    else if (mode === "signup") toast.success("Passport operator account initialized.");
  }

  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <div className="mx-auto flex max-w-lg flex-col px-6 pt-16">
        <div className="text-[10px] uppercase tracking-widest text-amber">// SECURE_HANDSHAKE</div>
        <h1 className="mt-2 font-mono text-4xl font-bold tracking-tighter">
          {mode === "signup" ? "Initialize operator" : "Resume session"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Operators create and manage agent passports. One account, many agents."
            : "Authenticate to access your agent registry console."}
        </p>

        <form onSubmit={submit} className="term-panel mt-8 space-y-4 p-6">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-terminal">
              {">"} email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-terminal focus:shadow-[0_0_16px_-4px_var(--color-terminal)]"
              placeholder="operator@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-terminal">
              {">"} passphrase
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-terminal focus:shadow-[0_0_16px_-4px_var(--color-terminal)]"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="terminal" size="lg" disabled={busy} className="w-full">
            {busy ? "PROCESSING..." : mode === "signup" ? "INITIALIZE" : "AUTHENTICATE"}
          </Button>
          <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            {mode === "signup" ? "already an operator?" : "no account?"}{" "}
            <button
              type="button"
              className="text-terminal hover:underline"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "sign in" : "create one"}
            </button>
          </div>
        </form>

        <Link to="/" className="mt-8 text-center text-[10px] uppercase tracking-widest text-muted-foreground hover:text-terminal">
          ← return to landing
        </Link>
      </div>
    </div>
  );
}
