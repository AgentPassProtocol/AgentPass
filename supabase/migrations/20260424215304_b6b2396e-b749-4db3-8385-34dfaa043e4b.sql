
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten reputation_events insert: must be authenticated
DROP POLICY IF EXISTS "Anyone can submit reputation events" ON public.reputation_events;
CREATE POLICY "Authenticated users can submit reputation events"
  ON public.reputation_events FOR INSERT
  TO authenticated
  WITH CHECK (true);
