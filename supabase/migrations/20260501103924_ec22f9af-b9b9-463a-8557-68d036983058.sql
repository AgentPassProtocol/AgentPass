-- Fast lookup by api key hash for /api/public/v1/* auth
CREATE INDEX IF NOT EXISTS idx_agents_api_key_hash ON public.agents (api_key_hash);
CREATE INDEX IF NOT EXISTS idx_reputation_events_agent_created
  ON public.reputation_events (agent_id, created_at DESC);

-- Remove the over-permissive insert policy. All event writes now flow through
-- the SECURITY DEFINER function below, called by the server route after it
-- verifies the agent's API key.
DROP POLICY IF EXISTS "Authenticated users can submit reputation events" ON public.reputation_events;

-- Atomic: append event + update agent counters/score/tier.
-- delta is clamped, score stays in [0, 1000].
CREATE OR REPLACE FUNCTION public.apply_reputation_event(
  _agent_id uuid,
  _event_type text,
  _weight integer,
  _source text,
  _context text,
  _metadata jsonb
)
RETURNS TABLE(score integer, tier text, total integer, success integer, flagged integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _delta integer;
  _w integer := COALESCE(_weight, 1);
  _new_score integer;
  _new_tier text;
  _inc_total integer := 0;
  _inc_success integer := 0;
  _inc_flagged integer := 0;
BEGIN
  -- Validate event type and compute score delta
  IF _event_type = 'success' THEN
    _delta := LEAST(GREATEST(_w, 1), 10);
    _inc_total := 1;
    _inc_success := 1;
  ELSIF _event_type = 'failure' THEN
    _delta := -LEAST(GREATEST(_w, 1), 10);
    _inc_total := 1;
  ELSIF _event_type = 'abuse' THEN
    _delta := -LEAST(GREATEST(_w, 5), 50);
    _inc_total := 1;
    _inc_flagged := 1;
  ELSIF _event_type = 'verified' THEN
    _delta := LEAST(GREATEST(_w, 5), 25);
  ELSE
    RAISE EXCEPTION 'invalid_event_type: %', _event_type;
  END IF;

  -- Insert the immutable event record
  INSERT INTO public.reputation_events (agent_id, event_type, weight, source, context, metadata)
  VALUES (_agent_id, _event_type, _w, _source, _context, COALESCE(_metadata, '{}'::jsonb));

  -- Update the agent atomically
  UPDATE public.agents a
     SET reputation_score = LEAST(1000, GREATEST(0, a.reputation_score + _delta)),
         total_actions = a.total_actions + _inc_total,
         successful_actions = a.successful_actions + _inc_success,
         flagged_actions = a.flagged_actions + _inc_flagged,
         updated_at = now()
   WHERE a.id = _agent_id
   RETURNING a.reputation_score INTO _new_score;

  IF _new_score IS NULL THEN
    RAISE EXCEPTION 'agent_not_found';
  END IF;

  _new_tier := CASE
    WHEN _new_score >= 900 THEN 'platinum'
    WHEN _new_score >= 800 THEN 'gold'
    WHEN _new_score >= 700 THEN 'silver'
    WHEN _new_score >= 600 THEN 'bronze'
    ELSE 'unverified'
  END;

  UPDATE public.agents SET trust_tier = _new_tier WHERE id = _agent_id;

  RETURN QUERY
  SELECT a.reputation_score, a.trust_tier, a.total_actions, a.successful_actions, a.flagged_actions
    FROM public.agents a WHERE a.id = _agent_id;
END;
$$;

-- Only the service role calls this; revoke from anon/authenticated to be safe.
REVOKE ALL ON FUNCTION public.apply_reputation_event(uuid, text, integer, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_reputation_event(uuid, text, integer, text, text, jsonb) FROM anon, authenticated;