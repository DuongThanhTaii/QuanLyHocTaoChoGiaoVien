-- Teaching content is displayed by the actual lesson date, not its upload time.
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.class_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_session ON public.lessons(session_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class_session ON public.lessons(class_id, session_id);

-- Existing content remains available in the "Chưa phân buổi" archive until a teacher assigns it.
