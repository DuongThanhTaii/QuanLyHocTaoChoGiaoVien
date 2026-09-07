-- Nội dung đã dạy và bài tập được giao cho từng buổi học.
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS learning_content TEXT;

CREATE TABLE IF NOT EXISTS public.class_session_exercises (
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session
  ON public.class_session_exercises(session_id);

ALTER TABLE public.class_session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage session exercises"
  ON public.class_session_exercises FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
