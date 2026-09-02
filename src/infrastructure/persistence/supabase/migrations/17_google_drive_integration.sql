-- Add google_refresh_token to profiles
ALTER TABLE public.profiles ADD COLUMN google_refresh_token text;
