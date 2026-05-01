ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS homepage text,
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '{}'::jsonb;