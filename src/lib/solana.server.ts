// Server-only: Solana mainnet helpers, custodial wallet encryption, Metaplex Core soulbound mint
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
  publicKey as umiPublicKey,
  sol,
} from "@metaplex-foundation/umi";
import {
  mplCore,
  create as createAsset,
  createCollection,
  fetchAsset,
  fetchCollection,
} from "@metaplex-foundation/mpl-core";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGO = "aes-256-gcm";

function getMasterKey(): Buffer {
  const hex = process.env.WALLET_ENCRYPTION_KEY;
  if (!hex) throw new Error("WALLET_ENCRYPTION_KEY not configured");
  // Accept either 64-char hex (32 bytes) or any string (we'll sha256 it for forgiveness)
  if (/^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  return createHash("sha256").update(hex).digest();
}

export function encryptSecret(secret: Uint8Array): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getMasterKey(), iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(secret)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSecret(ciphertext: string, iv: string, tag: string): Uint8Array {
  const decipher = createDecipheriv(ALGO, getMasterKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
  return new Uint8Array(pt);
}

export function generateAgentWallet(): {
  publicKey: string;
  secretKey: Uint8Array;
} {
  const kp = Keypair.generate();
  return {
    publicKey: kp.publicKey.toBase58(),
    secretKey: kp.secretKey,
  };
}

function getRelayerKeypair(): Keypair {
  const raw = process.env.RELAYER_PRIVATE_KEY;
  if (!raw) throw new Error("RELAYER_PRIVATE_KEY not configured");
  // Accept base58 (Phantom export) or JSON array
  let bytes: Uint8Array;
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    bytes = Uint8Array.from(JSON.parse(trimmed));
  } else {
    bytes = bs58.decode(trimmed);
  }
  if (bytes.length !== 64) {
    throw new Error(`Invalid RELAYER_PRIVATE_KEY length: ${bytes.length} (expected 64)`);
  }
  return Keypair.fromSecretKey(bytes);
}

export function getUmi() {
  const rpc = process.env.SOLANA_RPC_URL;
  if (!rpc) throw new Error("SOLANA_RPC_URL not configured");
  const umi = createUmi(rpc).use(mplCore());
  const relayer = getRelayerKeypair();
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(relayer.secretKey);
  umi.use(keypairIdentity(umiKeypair));
  return umi;
}

export async function getRelayerBalanceSol(): Promise<number> {
  const umi = getUmi();
  const balance = await umi.rpc.getBalance(umi.identity.publicKey);
  return Number(balance.basisPoints) / 1_000_000_000;
}

export interface MintPassportInput {
  agentHandle: string;
  agentDisplayName: string;
  ownerPublicKey: string;
  metadataUri: string;
  collectionAddress?: string;
}

export interface MintResult {
  assetAddress: string;
  txSignature: string;
  network: string;
}

/**
 * Mint a soulbound (non-transferable) NFT via Metaplex Core.
 * The PermanentFreezeDelegate plugin frozen=true makes it non-transferable forever.
 */
export async function mintSoulboundPassport(input: MintPassportInput): Promise<MintResult> {
  const umi = getUmi();
  const asset = generateSigner(umi);

  // mpl-core's create() reads collection.oracles & collection.lifecycleHooks (calls .slice on them).
  // Passing only { publicKey } throws "Cannot read properties of undefined (reading 'slice')".
  // Fetch the full CollectionV1 account so those arrays are populated.
  let collectionAccount: Awaited<ReturnType<typeof fetchCollection>> | undefined;
  if (input.collectionAddress) {
    const fetched = await fetchCollection(umi, umiPublicKey(input.collectionAddress));
    collectionAccount = {
      ...fetched,
      oracles: fetched.oracles ?? [],
      lifecycleHooks: fetched.lifecycleHooks ?? [],
      appDatas: fetched.appDatas ?? [],
      dataSections: fetched.dataSections ?? [],
      linkedAppDatas: fetched.linkedAppDatas ?? [],
      agentIdentities: fetched.agentIdentities ?? [],
    };
  }

  const builder = createAsset(umi, {
    asset,
    name: `AGENT/PASS · ${input.agentHandle}`,
    uri: input.metadataUri,
    owner: umiPublicKey(input.ownerPublicKey),
    ...(collectionAccount ? { collection: collectionAccount } : {}),
    plugins: [
      {
        type: "PermanentFreezeDelegate",
        frozen: true,
      },
    ],
  });

  const { signature } = await builder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  const txSig = Buffer.from(signature).toString("base64");
  const network = process.env.SOLANA_RPC_URL?.includes("devnet") ? "devnet" : "mainnet-beta";

  return {
    assetAddress: asset.publicKey.toString(),
    txSignature: txSig,
    network,
  };
}

export async function bootstrapCollection(): Promise<{ address: string; txSignature: string }> {
  const umi = getUmi();
  const collection = generateSigner(umi);

  const { signature } = await createCollection(umi, {
    collection,
    name: "AGENT/PASS — Identity Passports",
    uri: "https://agent-pass.lovable.app/.well-known/agent-passport-collection.json",
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  return {
    address: collection.publicKey.toString(),
    txSignature: Buffer.from(signature).toString("base64"),
  };
}

export { fetchAsset };
