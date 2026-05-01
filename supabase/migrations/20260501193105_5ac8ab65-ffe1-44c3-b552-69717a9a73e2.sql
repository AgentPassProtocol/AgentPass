-- Restore INSERT for authenticated users on reputation_events
GRANT INSERT ON public.reputation_events TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can insert reputation events" ON public.reputation_events;
CREATE POLICY "Authenticated users can insert reputation events"
ON public.reputation_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow authenticated users to update agent aggregate counters
-- (the UI updates reputation_score/total_actions after inserting an event)
GRANT UPDATE (reputation_score, total_actions, successful_actions, flagged_actions, updated_at) ON public.agents TO authenticated;