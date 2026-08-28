-- Permissions for the class, student and invitation flow introduced in migration 07.
-- These policies let a teacher manage only students and invitations in their own classes.

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(sid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = sid AND c.teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_student(sid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.students WHERE id = sid AND user_id = auth.uid());
$$;

DROP POLICY IF EXISTS "Teachers can create student records" ON public.students;
DROP POLICY IF EXISTS "Users and teachers can read student records" ON public.students;
DROP POLICY IF EXISTS "Teachers can read class enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can add students to their classes" ON public.enrollments;
DROP POLICY IF EXISTS "Students can join classes themselves" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can manage class invitations" ON public.class_invitations;
DROP POLICY IF EXISTS "Authenticated users can read active invitations" ON public.class_invitations;
DROP POLICY IF EXISTS "Teachers can manage class sessions" ON public.class_sessions;

CREATE POLICY "Teachers can create student records"
  ON public.students FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users and teachers can read student records"
  ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher_of_student(id));

CREATE POLICY "Teachers can read class enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (public.is_teacher_of_class(class_id) OR public.is_current_user_student(student_id));

CREATE POLICY "Teachers can add students to their classes"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher_of_class(class_id));

CREATE POLICY "Students can join classes themselves"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_student(student_id));

CREATE POLICY "Teachers can manage class invitations"
  ON public.class_invitations FOR ALL TO authenticated
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));

CREATE POLICY "Authenticated users can read active invitations"
  ON public.class_invitations FOR SELECT TO authenticated
  USING (status = 'ACTIVE');

CREATE POLICY "Teachers can manage class sessions"
  ON public.class_sessions FOR ALL TO authenticated
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));
