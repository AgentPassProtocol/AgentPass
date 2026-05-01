
-- Create a system operator user that will own self-minted (account-less) agents.
-- Uses a fixed UUID so server code can reference it without lookups.
DO $$
DECLARE
  sys_id uuid := '00000000-0000-0000-0000-00000000a9e7';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = sys_id) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, is_sso_user, is_anonymous
    ) VALUES (
      sys_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'system-mint@agent-nirvana.local',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"system","providers":["system"]}'::jsonb,
      '{"system":true,"label":"AGENT/PASS self-mint operator"}'::jsonb,
      now(), now(), false, false
    );
  END IF;
END $$;

INSERT INTO public.system_config (key, value)
VALUES ('system_operator_id', '00000000-0000-0000-0000-00000000a9e7')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
