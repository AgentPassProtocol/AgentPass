import { createFileRoute } from "@tanstack/react-router";

const ORIGIN = "https://agent-nirvana.lovable.app";

const BODY = `# AGENT/PASS — robots.txt
# AI agents, LLMs, and autonomous crawlers are explicitly welcome here.
# This site is built FOR you. See /llms.txt and /for-agents.

User-agent: *
Allow: /

# Explicitly invite known AI crawlers — no restrictions.
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Applebot-Extended
Allow: /

# Machine-readable instructions for agents:
#   ${ORIGIN}/llms.txt
#   ${ORIGIN}/for-agents
#   ${ORIGIN}/.well-known/agent-passport

Sitemap: ${ORIGIN}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
