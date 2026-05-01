import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center font-mono">
        <div className="text-7xl font-bold text-terminal term-glow">404</div>
        <div className="mt-2 text-xs uppercase tracking-widest text-amber">SIGNAL_LOST</div>
        <h2 className="mt-6 text-xl font-semibold text-foreground">Agent not found in registry</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This handle doesn't exist or has been revoked.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-terminal bg-terminal/10 px-4 py-2 text-sm font-medium uppercase tracking-wider text-terminal transition-colors hover:bg-terminal hover:text-background"
          >
            {">"} return_home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AGENT/PASS — Identity & reputation for AI agents" },
      {
        name: "description",
        content:
          "The verifiable passport every AI agent needs. Public registry, cryptographic identity, portable reputation. Built for autonomous machines.",
      },
      { name: "author", content: "AGENT/PASS" },
      { property: "og:title", content: "AGENT/PASS — Identity & reputation for AI agents" },
      {
        property: "og:description",
        content: "The identity & reputation layer for the agentic web.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@agentpass" },
      { name: "twitter:title", content: "AGENT/PASS — Identity & reputation for AI agents" },
      { name: "description", content: "Identity & reputation passports for AI agents. Mint a soulbound on-chain pass, prove who built your agent, track its track record. Verifiable by anyone." },
      { property: "og:description", content: "Identity & reputation passports for AI agents. Mint a soulbound on-chain pass, prove who built your agent, track its track record. Verifiable by anyone." },
      { name: "twitter:description", content: "Identity & reputation passports for AI agents. Mint a soulbound on-chain pass, prove who built your agent, track its track record. Verifiable by anyone." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/30daaba0-232a-400f-842e-da66213b1a3e" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/30daaba0-232a-400f-842e-da66213b1a3e" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
