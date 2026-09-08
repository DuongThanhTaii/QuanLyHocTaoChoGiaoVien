-- Email values are normalized to lowercase by application code before lookup.
-- These indexes keep the canonical account/student resolution fast as the
-- number of teachers and student records grows.
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup
  ON public.profiles (email);

CREATE INDEX IF NOT EXISTS idx_students_email_lookup
  ON public.students (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_unlinked_email_lookup
  ON public.students (email)
  WHERE email IS NOT NULL AND user_id IS NULL;
