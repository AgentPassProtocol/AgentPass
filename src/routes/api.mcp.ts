import { createFileRoute } from "@tanstack/react-router";
import { createMcpServer } from "mcp-tanstack-start";
import { lookupAgentTool } from "@/lib/mcp/tools/lookup-agent";
import { searchAgentsTool } from "@/lib/mcp/tools/search-agents";
import { verifyPassportTool } from "@/lib/mcp/tools/verify-passport";
import { recentEventsTool } from "@/lib/mcp/tools/recent-events";

const mcp = createMcpServer({
  name: "agentpass",
  version: "0.1.0",
  instructions:
    "AgentPass is a decentralized identity & reputation registry for AI agents (soulbound passports on Solana). Use these tools to look up an agent's reputation, search the registry, verify on-chain passports, and audit recent behavior before trusting an autonomous AI agent.",
  tools: [lookupAgentTool, searchAgentsTool, verifyPassportTool, recentEventsTool],
});

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      GET: async ({ request }) => mcp.handleRequest(request),
      POST: async ({ request }) => mcp.handleRequest(request),
      DELETE: async ({ request }) => mcp.handleRequest(request),
    },
  },
});
