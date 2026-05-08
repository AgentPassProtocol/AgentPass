import { createFileRoute } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import { TerminalFooter } from "@/components/TerminalFooter";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
  head: () => ({
    meta: [
      { title: "Integrations · AgentPass — LangChain, CrewAI, AutoGen, MCP" },
      {
        name: "description",
        content:
          "Plug AgentPass into LangChain, CrewAI, AutoGen, OpenAI, Anthropic, and any MCP client (Claude, Cursor) in 30 seconds. Auto-log every tool call as a reputation event.",
      },
    ],
  }),
});

const TABS = [
  { id: "mcp", label: "MCP_SERVER" },
  { id: "langchain", label: "LANGCHAIN" },
  { id: "crewai", label: "CREWAI" },
  { id: "autogen", label: "AUTOGEN" },
  { id: "openai", label: "OPENAI_WRAP" },
  { id: "anthropic", label: "ANTHROPIC_WRAP" },
] as const;

type TabId = typeof TABS[number]["id"];

function IntegrationsPage() {
  const [tab, setTab] = useState<TabId>("mcp");

  return (
    <div className="min-h-screen">
      <TerminalHeader />
      <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="text-[10px] uppercase tracking-widest text-amber">
          // PLUG_IN_LAYER
        </div>
        <h1 className="mt-2 font-mono text-5xl font-extrabold tracking-tighter">
          Integrations
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          One copy-paste away. Wrap your existing agent stack so every tool call,
          completion, or task gets attributed to a soulbound on-chain identity
          and logged as a reputation event.
        </p>

        <div className="mt-10 flex flex-wrap gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? "border-b-2 border-terminal text-terminal term-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ./{t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {tab === "mcp" && <McpSection />}
          {tab === "langchain" && <LangChainSection />}
          {tab === "crewai" && <CrewAISection />}
          {tab === "autogen" && <AutoGenSection />}
          {tab === "openai" && <OpenAISection />}
          {tab === "anthropic" && <AnthropicSection />}
        </div>
      </main>
      <TerminalFooter />
    </div>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center justify-between border border-border bg-muted/30 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {lang}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-terminal"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> COPIED
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> COPY
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto border border-t-0 border-border bg-background p-4 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-mono text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

/* ========== MCP ========== */
function McpSection() {
  return (
    <Section
      title="MCP server"
      desc="Expose AgentPass tools to Claude Desktop, Cursor, Windsurf, Continue.dev, or any MCP-compatible client. Read-only — no auth required."
    >
      <div className="border border-terminal bg-terminal/5 p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-terminal">
          // ENDPOINT
        </div>
        <code className="mt-1 block font-mono text-sm text-foreground">
          https://agent-pass.fun/api/mcp
        </code>
      </div>

      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          // TOOLS_AVAILABLE
        </div>
        <ul className="space-y-1 font-mono text-sm">
          <li>
            <span className="text-terminal">lookup_agent</span>(handle) — full
            reputation profile
          </li>
          <li>
            <span className="text-terminal">search_agents</span>(query,
            min_score?) — discover trusted agents
          </li>
          <li>
            <span className="text-terminal">verify_passport</span>(handle) —
            on-chain NFT verification
          </li>
          <li>
            <span className="text-terminal">recent_events</span>(handle, limit?)
            — audit recent behavior
          </li>
        </ul>
      </div>

      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">
          // CLAUDE_DESKTOP — claude_desktop_config.json
        </div>
        <CodeBlock
          lang="json"
          code={`{
  "mcpServers": {
    "agentpass": {
      "url": "https://agent-pass.fun/api/mcp"
    }
  }
}`}
        />
      </div>

      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">
          // CURSOR — .cursor/mcp.json
        </div>
        <CodeBlock
          lang="json"
          code={`{
  "mcpServers": {
    "agentpass": {
      "url": "https://agent-pass.fun/api/mcp"
    }
  }
}`}
        />
      </div>

      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">
          // TEST — curl the streamable HTTP endpoint
        </div>
        <CodeBlock
          code={`curl -X POST https://agent-pass.fun/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/list"
  }'`}
        />
      </div>
    </Section>
  );
}

/* ========== LangChain ========== */
function LangChainSection() {
  return (
    <Section
      title="LangChain callback handler"
      desc="Drop-in BaseCallbackHandler that auto-logs every tool call, LLM completion, and chain run as a reputation event. Works with langchain-python and LangGraph."
    >
      <CodeBlock lang="bash" code={`pip install langchain requests`} />
      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">
          // agentpass_langchain.py
        </div>
        <CodeBlock
          lang="python"
          code={`import os
import requests
from typing import Any, Dict, List
from langchain.callbacks.base import BaseCallbackHandler

AGENTPASS_URL = "https://agent-pass.fun/api/public/v1/event"

class AgentPassCallback(BaseCallbackHandler):
    """Auto-logs LangChain runs as AgentPass reputation events."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ["AGENTPASS_API_KEY"]

    def _log(self, event_type: str, source: str, context: str, weight: int = 1):
        try:
            requests.post(
                AGENTPASS_URL,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "type": event_type,
                    "weight": weight,
                    "source": source[:120],
                    "context": context[:500],
                },
                timeout=3,
            )
        except Exception:
            pass  # never break the agent loop

    def on_tool_end(self, output: str, **kwargs):
        name = kwargs.get("name", "tool")
        self._log("success", f"langchain:{name}", str(output)[:500])

    def on_tool_error(self, error: BaseException, **kwargs):
        name = kwargs.get("name", "tool")
        self._log("failure", f"langchain:{name}", str(error)[:500])

    def on_llm_end(self, response, **kwargs):
        self._log("success", "langchain:llm", "completion")

    def on_chain_error(self, error: BaseException, **kwargs):
        self._log("failure", "langchain:chain", str(error)[:500])


# === USAGE ===
from langchain.agents import AgentExecutor

executor = AgentExecutor(
    agent=my_agent,
    tools=my_tools,
    callbacks=[AgentPassCallback()],   # <-- one line
)`}
        />
      </div>
    </Section>
  );
}

/* ========== CrewAI ========== */
function CrewAISection() {
  return (
    <Section
      title="CrewAI step callback"
      desc="Pass the AgentPass step_callback to your Crew. Each agent action becomes a reputation event."
    >
      <CodeBlock lang="bash" code={`pip install crewai requests`} />
      <CodeBlock
        lang="python"
        code={`import os, requests
from crewai import Crew, Agent, Task

AGENTPASS_URL = "https://agent-pass.fun/api/public/v1/event"
AGENTPASS_KEY = os.environ["AGENTPASS_API_KEY"]

def agentpass_step(step):
    """CrewAI step_callback — fired after every agent step."""
    is_error = getattr(step, "error", None) is not None
    payload = {
        "type": "failure" if is_error else "success",
        "source": f"crewai:{getattr(step, 'tool', 'step')}"[:120],
        "context": str(getattr(step, "log", ""))[:500],
    }
    try:
        requests.post(
            AGENTPASS_URL,
            headers={"Authorization": f"Bearer {AGENTPASS_KEY}"},
            json=payload,
            timeout=3,
        )
    except Exception:
        pass

crew = Crew(
    agents=[my_agent],
    tasks=[my_task],
    step_callback=agentpass_step,   # <-- one line
)
crew.kickoff()`}
      />
    </Section>
  );
}

/* ========== AutoGen ========== */
function AutoGenSection() {
  return (
    <Section
      title="AutoGen message hook"
      desc="Register a reply hook on any ConversableAgent. Every assistant turn (or tool failure) is logged."
    >
      <CodeBlock lang="bash" code={`pip install pyautogen requests`} />
      <CodeBlock
        lang="python"
        code={`import os, requests
from autogen import ConversableAgent

AGENTPASS_URL = "https://agent-pass.fun/api/public/v1/event"
AGENTPASS_KEY = os.environ["AGENTPASS_API_KEY"]

def attach_agentpass(agent: ConversableAgent):
    def hook(recipient, messages, sender, config):
        last = messages[-1] if messages else {}
        is_err = "error" in str(last.get("content", "")).lower()
        try:
            requests.post(
                AGENTPASS_URL,
                headers={"Authorization": f"Bearer {AGENTPASS_KEY}"},
                json={
                    "type": "failure" if is_err else "success",
                    "source": f"autogen:{agent.name}"[:120],
                    "context": str(last.get("content", ""))[:500],
                },
                timeout=3,
            )
        except Exception:
            pass
        return False, None  # don't intercept the reply

    agent.register_reply([ConversableAgent, None], hook)
    return agent

# === USAGE ===
my_agent = attach_agentpass(my_agent)   # <-- one line`}
      />
    </Section>
  );
}

/* ========== OpenAI wrap ========== */
function OpenAISection() {
  return (
    <Section
      title="agentpass.wrap(openai)"
      desc="Drop-in proxy around the OpenAI SDK. Every chat.completions.create call auto-logs as a reputation event. Works in Node.js and the browser (server-only recommended)."
    >
      <CodeBlock lang="bash" code={`npm install openai`} />
      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">
          // agentpass.ts — copy this file into your project
        </div>
        <CodeBlock
          lang="typescript"
          code={`const AGENTPASS_URL = "https://agent-pass.fun/api/public/v1/event";

async function logEvent(
  apiKey: string,
  type: "success" | "failure",
  source: string,
  context: string,
) {
  try {
    await fetch(AGENTPASS_URL, {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        source: source.slice(0, 120),
        context: context.slice(0, 500),
      }),
    });
  } catch {
    /* never break the caller */
  }
}

export const agentpass = {
  wrap<T extends object>(
    client: T,
    opts: { apiKey?: string; source?: string } = {},
  ): T {
    const apiKey = opts.apiKey ?? process.env.AGENTPASS_API_KEY!;
    const source = opts.source ?? "openai";

    return new Proxy(client, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (value && typeof value === "object") {
          return agentpass.wrap(value, { apiKey, source: \`\${source}.\${String(prop)}\` });
        }
        if (typeof value === "function") {
          return async (...args: unknown[]) => {
            try {
              const result = await (value as Function).apply(target, args);
              const model =
                (args[0] as { model?: string })?.model ?? "unknown";
              void logEvent(apiKey, "success", source, \`model=\${model}\`);
              return result;
            } catch (err) {
              void logEvent(
                apiKey,
                "failure",
                source,
                err instanceof Error ? err.message : String(err),
              );
              throw err;
            }
          };
        }
        return value;
      },
    });
  },
};`}
        />
      </div>
      <div>
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">
          // USAGE
        </div>
        <CodeBlock
          lang="typescript"
          code={`import OpenAI from "openai";
import { agentpass } from "./agentpass";

const openai = agentpass.wrap(new OpenAI(), {
  apiKey: process.env.AGENTPASS_API_KEY,   // ap_live_...
});

// Use as normal — every call is auto-attributed
const res = await openai.chat.completions.create({
  model: "gpt-5",
  messages: [{ role: "user", content: "hi" }],
});`}
        />
      </div>
    </Section>
  );
}

/* ========== Anthropic wrap ========== */
function AnthropicSection() {
  return (
    <Section
      title="agentpass.wrap(anthropic)"
      desc="Same proxy works for the Anthropic SDK. messages.create calls are auto-logged."
    >
      <CodeBlock lang="bash" code={`npm install @anthropic-ai/sdk`} />
      <CodeBlock
        lang="typescript"
        code={`import Anthropic from "@anthropic-ai/sdk";
import { agentpass } from "./agentpass";  // same file as OpenAI tab

const claude = agentpass.wrap(new Anthropic(), {
  apiKey: process.env.AGENTPASS_API_KEY,
  source: "anthropic",
});

// Use as normal — every call is logged as a reputation event
const msg = await claude.messages.create({
  model: "claude-opus-4-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "hello" }],
});`}
      />
      <div className="border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
        <span className="text-terminal">TIP:</span> Run multiple agents from the
        same process by calling{" "}
        <code className="text-terminal">agentpass.wrap()</code> with different{" "}
        <code className="text-terminal">apiKey</code> values per agent.
      </div>
    </Section>
  );
}
