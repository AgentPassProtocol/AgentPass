
-- Agent passport: identity + reputation infra
-- Table: agents (the passport itself, owned by an auth user "operator")
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  handle TEXT NOT NULL UNIQUE, -- public agent handle, e.g. "scout-7f3a"
  display_name TEXT NOT NULL,
  model TEXT, -- e.g. "gpt-5", "claude-opus", "custom"
  purpose TEXT, -- short self-description
  public_key TEXT, -- optional ed25519 / verification key
  api_key_hash TEXT NOT NULL UNIQUE, -- hashed API key for agent auth
  api_key_prefix TEXT NOT NULL, -- e.g. "ap_live_abcd" for display
  reputation_score INTEGER NOT NULL DEFAULT 500, -- 0-1000, starts at 500
  trust_tier TEXT NOT NULL DEFAULT 'unverified', -- unverified|bronze|silver|gold|platinum
  total_actions INTEGER NOT NULL DEFAULT 0,
  successful_actions INTEGER NOT NULL DEFAULT 0,
  flagged_actions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reputation events: any third party can log a signed event about an agent
CREATE TABLE public.reputation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- success | failure | abuse | endorsement | task_completed
  weight INTEGER NOT NULL DEFAULT 1, -- impact magnitude
  source TEXT, -- domain or service that issued the event
  context TEXT, -- short description
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verifications: external proofs (domain, github, capability badges)
CREATE TABLE public.verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL, -- domain | github | capability | identity
  value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | revoked
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX agents_operator_idx ON public.agents(operator_id);
CREATE INDEX agents_handle_idx ON public.agents(handle);
CREATE INDEX rep_events_agent_idx ON public.reputation_events(agent_id);
CREATE INDEX verif_agent_idx ON public.verifications(agent_id);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Public can read agent passports (it's a public registry)
CREATE POLICY "Agents are publicly viewable"
  ON public.agents FOR SELECT
  USING (true);

CREATE POLICY "Operators can insert their own agents"
  ON public.agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update their own agents"
  ON public.agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = operator_id);

CREATE POLICY "Operators can delete their own agents"
  ON public.agents FOR DELETE
  TO authenticated
  USING (auth.uid() = operator_id);

-- Reputation events: public read, anyone authenticated can write (will be sanitized server-side later)
CREATE POLICY "Reputation events publicly viewable"
  ON public.reputation_events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit reputation events"
  ON public.reputation_events FOR INSERT
  WITH CHECK (true);

-- Verifications: public read, only operator can write
CREATE POLICY "Verifications publicly viewable"
  ON public.verifications FOR SELECT
  USING (true);

CREATE POLICY "Operators can manage verifications for own agents"
  ON public.verifications FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_id AND a.operator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_id AND a.operator_id = auth.uid()));

-- Trigger to bump updated_at on agents
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
