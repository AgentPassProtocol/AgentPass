import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  generateAgentWallet,
  encryptSecret,
  mintSoulboundPassport,
  bootstrapCollection,
  getRelayerBalanceSol,
} from "./solana.server";

/**
 * Mint a soulbound passport NFT for an agent.
 * - Creates a custodial Solana wallet for the agent if one doesn't exist (encrypted at rest)
 * - Bootstraps the system collection on first ever mint
 * - Mints a Metaplex Core asset with PermanentFreezeDelegate (non-transferable)
 * - Records the mint in nft_mints
 */
export const mintAgentPassport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { agentId: string }) =>
    z.object({ agentId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // 1. Verify ownership
    const { data: agent, error: agentErr } = await supabaseAdmin
      .from("agents")
      .select("id, handle, display_name, operator_id")
      .eq("id", data.agentId)
      .single();
    if (agentErr || !agent) throw new Error("Agent not found");
    if (agent.operator_id !== userId) throw new Error("Not your agent");

    // 2. Already minted?
    const { data: existing } = await supabaseAdmin
      .from("nft_mints")
      .select("asset_address, tx_signature, network, owner_address")
      .eq("agent_id", data.agentId)
      .maybeSingle();
    if (existing) {
      return {
        already: true,
        assetAddress: existing.asset_address,
        txSignature: existing.tx_signature,
        network: existing.network,
        owner: existing.owner_address,
      };
    }

    // 3. Get or create the agent's custodial wallet
    let { data: wallet } = await supabaseAdmin
      .from("agent_wallets")
      .select("public_key")
      .eq("agent_id", data.agentId)
      .maybeSingle();

    let ownerPublicKey: string;
    if (wallet) {
      ownerPublicKey = wallet.public_key;
    } else {
      const kp = generateAgentWallet();
      const enc = encryptSecret(kp.secretKey);
      const { error: walErr } = await supabaseAdmin.from("agent_wallets").insert({
        agent_id: data.agentId,
        public_key: kp.publicKey,
        encrypted_secret_key: enc.ciphertext,
        encryption_iv: enc.iv,
        encryption_tag: enc.tag,
      });
      if (walErr) throw new Error(`Wallet creation failed: ${walErr.message}`);
      ownerPublicKey = kp.publicKey;
    }

    // 4. Get or bootstrap the collection
    const { data: cfg } = await supabaseAdmin
      .from("system_config")
      .select("value")
      .eq("key", "passport_collection_address")
      .maybeSingle();

    let collectionAddress = cfg?.value;
    if (!collectionAddress) {
      const col = await bootstrapCollection();
      collectionAddress = col.address;
      await supabaseAdmin.from("system_config").insert({
        key: "passport_collection_address",
        value: collectionAddress,
      });
    }

    // 5. Mint the soulbound NFT
    const origin = process.env.SITE_ORIGIN ?? "https://agent-pass.lovable.app";
    const metadataUri = `${origin}/api/public/v1/passport-metadata/${agent.handle}`;

    const result = await mintSoulboundPassport({
      agentHandle: agent.handle,
      agentDisplayName: agent.display_name,
      ownerPublicKey,
      metadataUri,
      collectionAddress,
    });

    // 6. Record
    await supabaseAdmin.from("nft_mints").insert({
      agent_id: data.agentId,
      asset_address: result.assetAddress,
      collection_address: collectionAddress,
      owner_address: ownerPublicKey,
      tx_signature: result.txSignature,
      network: result.network,
      metadata_uri: metadataUri,
      status: "confirmed",
    });

    return {
      already: false,
      assetAddress: result.assetAddress,
      txSignature: result.txSignature,
      network: result.network,
      owner: ownerPublicKey,
    };
  });

export const getRelayerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      const balance = await getRelayerBalanceSol();
      return { ok: true, balanceSol: balance };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "unknown" };
    }
  });
