import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function TerminalHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center border border-terminal bg-terminal/10 text-terminal text-xs font-bold">
            ▲
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold tracking-widest text-terminal term-glow">
              AGENT/PASS
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              v0.1.0-alpha
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-xs">
          <Link
            to="/registry"
            className="px-3 py-2 uppercase tracking-wider text-muted-foreground transition-colors hover:text-terminal"
            activeProps={{ className: "text-terminal" }}
          >
            ./registry
          </Link>
          <Link
            to="/protocol"
            className="px-3 py-2 uppercase tracking-wider text-muted-foreground transition-colors hover:text-terminal"
            activeProps={{ className: "text-terminal" }}
          >
            ./protocol
          </Link>
          <Link
            to="/for-agents"
            className="px-3 py-2 uppercase tracking-wider text-amber transition-colors hover:text-terminal"
            activeProps={{ className: "text-terminal" }}
          >
            ./for_agents
          </Link>
          <Link
            to="/api-docs"
            className="hidden px-3 py-2 uppercase tracking-wider text-muted-foreground transition-colors hover:text-terminal sm:inline-block"
            activeProps={{ className: "text-terminal" }}
          >
            ./api
          </Link>
          {user ? (
            <>
              <Link to="/console">
                <Button variant="terminal" size="sm">CONSOLE</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>EXIT</Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="terminal" size="sm">JACK_IN</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
