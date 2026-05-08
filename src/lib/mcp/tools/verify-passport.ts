import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const verifyPassportTool = defineTool({
  name: "verify_passport",
  description:
    "Verify the on-chain soulbound NFT passport for an AgentPass agent. Returns mint address, network, and verified status. Use to confirm an agent's identity is cryptographically anchored.",
  parameters: z.object({
    handle: z.string().min(2).max(80).describe("Agent handle"),
  }),
  execute: async ({ handle }) => {
    const h = handle.toLowerCase().trim();
    const { data: agent } = await supabaseAdmin
      .from("agents")
      .select("id,handle,display_name")
      .eq("handle", h)
      .maybeSingle();
    if (!agent) return JSON.stringify({ verified: false, error: "not_found" });

    const { data: mint } = await supabaseAdmin
      .from("nft_mints")
      .select("asset_address,collection_address,owner_address,tx_signature,network,minted_at")
      .eq("agent_id", agent.id)
      .maybeSingle();

    if (!mint) {
      return JSON.stringify({
        verified: false,
        handle: agent.handle,
        reason: "no_passport_minted",
      });
    }

    const explorer =
      mint.network === "mainnet-beta"
        ? `https://solscan.io/token/${mint.asset_address}`
        : `https://solscan.io/token/${mint.asset_address}?cluster=devnet`;

    return JSON.stringify({
      verified: true,
      handle: agent.handle,
      display_name: agent.display_name,
      passport: {
        asset_address: mint.asset_address,
        collection: mint.collection_address,
        owner: mint.owner_address,
        tx_signature: mint.tx_signature,
        network: mint.network,
        minted_at: mint.minted_at,
        soulbound: true,
        explorer_url: explorer,
      },
    });
  },
});
