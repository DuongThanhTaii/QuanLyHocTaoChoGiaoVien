-- Link an assignment to an optional concrete session or recurring timetable slot.
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.class_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS schedule_slot_id uuid REFERENCES public.schedule_slots(id) ON DELETE SET NULL;

ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_single_schedule_target;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_single_schedule_target
  CHECK (NOT (session_id IS NOT NULL AND schedule_slot_id IS NOT NULL));

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  note text,
  is_late boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score numeric(4,2),
  teacher_feedback text,
  graded_at timestamptz,
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignment_submissions_unique_student UNIQUE (exercise_id, student_id),
  CONSTRAINT assignment_submissions_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 10))
);

CREATE TABLE IF NOT EXISTS public.submission_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('file', 'image', 'link')),
  name text NOT NULL,
  object_key text,
  external_url text,
  content_type text,
  size_bytes bigint,
  thumbnail_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submission_assets_location CHECK (
    (kind = 'link' AND external_url IS NOT NULL) OR
    (kind IN ('file', 'image') AND object_key IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_exercises_session ON public.exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_exercises_schedule_slot ON public.exercises(schedule_slot_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_exercise ON public.assignment_submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_submission_assets_submission ON public.submission_assets(submission_id);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage their own assignment submissions" ON public.assignment_submissions;
CREATE POLICY "Students manage their own assignment submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers view assignment submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers view assignment submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exercises e JOIN public.classes c ON c.id = e.class_id
    WHERE e.id = assignment_submissions.exercise_id AND c.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Teachers grade assignment submissions" ON public.assignment_submissions;
CREATE POLICY "Teachers grade assignment submissions" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exercises e JOIN public.classes c ON c.id = e.class_id
    WHERE e.id = assignment_submissions.exercise_id AND c.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Participants view submission assets" ON public.submission_assets;
CREATE POLICY "Participants view submission assets" ON public.submission_assets
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.assignment_submissions s
    LEFT JOIN public.students st ON st.id = s.student_id
    LEFT JOIN public.exercises e ON e.id = s.exercise_id
    LEFT JOIN public.classes c ON c.id = e.class_id
    WHERE s.id = submission_assets.submission_id
      AND (st.user_id = auth.uid() OR c.teacher_id = auth.uid())
 ));

DROP POLICY IF EXISTS "Students manage their submission assets" ON public.submission_assets;
CREATE POLICY "Students manage their submission assets" ON public.submission_assets
  FOR ALL TO authenticated USING (EXISTS (
    SELECT 1 FROM public.assignment_submissions s JOIN public.students st ON st.id = s.student_id
    WHERE s.id = submission_assets.submission_id AND st.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignment_submissions s JOIN public.students st ON st.id = s.student_id
    WHERE s.id = submission_assets.submission_id AND st.user_id = auth.uid()
  ));
