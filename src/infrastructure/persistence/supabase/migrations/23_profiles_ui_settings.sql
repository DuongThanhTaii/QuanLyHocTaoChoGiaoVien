-- Store per-user theme, accent color, and tour state.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_settings JSONB;

UPDATE public.profiles
SET ui_settings = '{}'::jsonb
WHERE ui_settings IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN ui_settings SET DEFAULT '{}'::jsonb,
  ALTER COLUMN ui_settings SET NOT NULL;
