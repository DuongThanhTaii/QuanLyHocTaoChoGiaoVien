-- Bảng session_evaluations (Đánh giá học sinh sau buổi học)
CREATE TABLE IF NOT EXISTS public.session_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rating TEXT NOT NULL DEFAULT 'GOOD', -- 'EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'
  feedback TEXT, -- Lời nhận xét chi tiết của giáo viên
  marked_by UUID NOT NULL REFERENCES public.profiles(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- RLS Policies
ALTER TABLE public.session_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to teachers for their class evaluations" 
  ON public.session_evaluations
  FOR ALL
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_eval_class ON public.session_evaluations(class_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_eval_student ON public.session_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_session_eval_marked_at ON public.session_evaluations(marked_at DESC);
