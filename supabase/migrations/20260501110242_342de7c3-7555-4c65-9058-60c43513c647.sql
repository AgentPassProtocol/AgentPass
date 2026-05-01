-- Custodial agent wallets (encrypted private keys) and NFT mint records

CREATE TABLE public.agent_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  public_key text NOT NULL UNIQUE,
  encrypted_secret_key text NOT NULL,
  encryption_iv text NOT NULL,
  encryption_tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;

-- Public can read the public key (it's public by definition).
-- Encrypted secret material is in the same row but useless without WALLET_ENCRYPTION_KEY.
CREATE POLICY "Agent wallet public keys viewable by all"
  ON public.agent_wallets FOR SELECT
  USING (true);

-- No client-side writes. All inserts go through server functions using service role.

CREATE TABLE public.nft_mints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  asset_address text NOT NULL UNIQUE,
  collection_address text,
  owner_address text NOT NULL,
  tx_signature text NOT NULL,
  network text NOT NULL DEFAULT 'mainnet-beta',
  metadata_uri text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  minted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nft_mints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NFT mints publicly viewable"
  ON public.nft_mints FOR SELECT
  USING (true);

-- Singleton table to remember the collection address once bootstrapped.
CREATE TABLE public.system_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System config publicly readable"
  ON public.system_config FOR SELECT
  USING (true);

CREATE INDEX idx_nft_mints_agent_id ON public.nft_mints(agent_id);
CREATE INDEX idx_agent_wallets_agent_id ON public.agent_wallets(agent_id);