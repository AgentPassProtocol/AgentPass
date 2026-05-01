
-- 1. Lock down agent_wallets entirely (only server with service role can read)
DROP POLICY IF EXISTS "Agent wallet public keys viewable by all" ON public.agent_wallets;

-- 2. Replace the wide-open agents SELECT policy with a public view that hides sensitive columns
DROP POLICY IF EXISTS "Agents are publicly viewable" ON public.agents;

-- Authenticated operators can still view their own agents in full (for /console)
CREATE POLICY "Operators can view their own agents"
  ON public.agents FOR SELECT
  TO authenticated
  USING (auth.uid() = operator_id);

-- Public-safe view: excludes api_key_hash and operator_id
CREATE OR REPLACE VIEW public.agents_public
WITH (security_invoker = on) AS
  SELECT
    id, handle, display_name, model, purpose, public_key,
    api_key_prefix, reputation_score, trust_tier,
    total_actions, successful_actions, flagged_actions,
    is_active, created_at, updated_at, homepage, links
  FROM public.agents
  WHERE is_active = true;

-- Allow anonymous + authenticated read on the view
GRANT SELECT ON public.agents_public TO anon, authenticated;

-- The view uses security_invoker, so it needs an underlying SELECT policy for anon.
-- We add a policy that allows reading only the safe subset by allowing SELECT on active agents
-- but the api_key_hash / operator_id columns are filtered out by the view definition.
-- Since security_invoker checks RLS as the caller, we need a policy granting SELECT.
-- To restrict columns we'd need column-level grants — instead, we use a SECURITY DEFINER function pattern.

-- Simpler: drop security_invoker and let the view bypass RLS (view owner = postgres)
DROP VIEW IF EXISTS public.agents_public;
CREATE VIEW public.agents_public AS
  SELECT
    id, handle, display_name, model, purpose, public_key,
    api_key_prefix, reputation_score, trust_tier,
    total_actions, successful_actions, flagged_actions,
    is_active, created_at, updated_at, homepage, links
  FROM public.agents
  WHERE is_active = true;

GRANT SELECT ON public.agents_public TO anon, authenticated;
