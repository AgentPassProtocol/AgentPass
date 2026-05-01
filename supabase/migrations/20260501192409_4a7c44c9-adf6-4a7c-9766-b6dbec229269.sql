
-- Drop the view we created (column-level grants are cleaner)
DROP VIEW IF EXISTS public.agents_public;

-- Re-add public SELECT policy so the existing client code keeps working
CREATE POLICY "Agents are publicly viewable"
  ON public.agents FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoke ALL on the table from anon/authenticated, then grant only safe columns
REVOKE SELECT ON public.agents FROM anon, authenticated;

GRANT SELECT (
  id, handle, display_name, model, purpose, public_key,
  api_key_prefix, reputation_score, trust_tier,
  total_actions, successful_actions, flagged_actions,
  is_active, created_at, updated_at, homepage, links
) ON public.agents TO anon, authenticated;

-- Operators still need full access to their own rows (including operator_id) for the console
-- The "Operators can view their own agents" policy already exists; grant the missing columns
-- via a separate role pattern is overkill — instead allow authenticated to also read operator_id
-- since each authenticated user can already determine their own auth.uid().
GRANT SELECT (operator_id) ON public.agents TO authenticated;
