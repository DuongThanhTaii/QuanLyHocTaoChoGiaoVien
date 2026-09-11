-- Store Drive refresh credentials encrypted and remove Mari-plan storage enforcement for Drive-backed materials.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_refresh_token_encrypted TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_drive_connected_at TIMESTAMPTZ;
DROP TRIGGER IF EXISTS materials_enforce_storage_quota ON public.materials;
COMMIT;
NOTIFY pgrst, 'reload schema';
