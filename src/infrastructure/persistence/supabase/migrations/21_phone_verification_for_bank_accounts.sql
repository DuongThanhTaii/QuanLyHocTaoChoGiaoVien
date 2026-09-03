-- A verified phone is required before a teacher can add a payout bank account.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS profiles_phone_verified_at_idx ON public.profiles(phone_verified_at) WHERE phone_verified_at IS NOT NULL;
NOTIFY pgrst, 'reload schema';
