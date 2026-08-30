CREATE TYPE LINK_REQUEST_STATUS AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE public.guardian_student_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status LINK_REQUEST_STATUS DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_email)
);

ALTER TABLE public.guardian_student_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their sent requests" ON public.guardian_student_requests FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can send requests" ON public.guardian_student_requests FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Students can view requests sent to them" ON public.guardian_student_requests FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update requests sent to them" ON public.guardian_student_requests FOR UPDATE USING (auth.uid() = student_id);

CREATE INDEX idx_link_requests_student ON public.guardian_student_requests(student_id) WHERE status = 'PENDING';
