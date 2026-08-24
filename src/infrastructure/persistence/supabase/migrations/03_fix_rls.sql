
-- 1. Helper Functions (SECURITY DEFINER bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS \$\$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'); \$\$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_class(cid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS \$\$ SELECT EXISTS (SELECT 1 FROM classes WHERE id = cid AND teacher_id = auth.uid()); \$\$;

CREATE OR REPLACE FUNCTION public.is_student_in_class(cid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS \$\$ SELECT EXISTS (SELECT 1 FROM enrollments WHERE class_id = cid AND student_id = auth.uid()); \$\$;

CREATE OR REPLACE FUNCTION public.is_parent_of(sid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS \$\$ SELECT EXISTS (SELECT 1 FROM parent_students WHERE parent_id = auth.uid() AND student_id = sid); \$\$;

CREATE OR REPLACE FUNCTION public.is_parent_of_student_in_class(cid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS \$\$ SELECT EXISTS (SELECT 1 FROM parent_students ps JOIN enrollments e ON e.student_id = ps.student_id WHERE ps.parent_id = auth.uid() AND e.class_id = cid); \$\$;

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "Teachers can read profiles of students enrolled in their classes" ON public.profiles;
DROP POLICY IF EXISTS "Parents can read profiles of their linked children" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can read all parent_students" ON public.parent_students;

DROP POLICY IF EXISTS "Students can read classes they are enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Parents can read classes their children are enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Admins can read all classes" ON public.classes;

DROP POLICY IF EXISTS "Teachers can CRUD enrollments for their own classes" ON public.enrollments;
DROP POLICY IF EXISTS "Parents can read enrollments of their children" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can read all enrollments" ON public.enrollments;

DROP POLICY IF EXISTS "Teachers can CRUD slots for their own classes" ON public.schedule_slots;
DROP POLICY IF EXISTS "Students can read slots for classes they're enrolled in" ON public.schedule_slots;
DROP POLICY IF EXISTS "Parents can read slots for classes their children are enrolled in" ON public.schedule_slots;

DROP POLICY IF EXISTS "Teachers can CRUD attendance for their own classes" ON public.attendance_records;
DROP POLICY IF EXISTS "Parents can read attendance of their children" ON public.attendance_records;

DROP POLICY IF EXISTS "Teachers can CRUD lessons for their own classes" ON public.lessons;
DROP POLICY IF EXISTS "Students can read lessons for classes they're enrolled in" ON public.lessons;
DROP POLICY IF EXISTS "Parents can read lessons for classes their children are enrolled in" ON public.lessons;

DROP POLICY IF EXISTS "Teachers can CRUD exercises for their own classes" ON public.exercises;
DROP POLICY IF EXISTS "Students can read exercises for classes they're enrolled in" ON public.exercises;

DROP POLICY IF EXISTS "Teachers can CRUD materials for their own classes" ON public.materials;
DROP POLICY IF EXISTS "Students can read materials for classes they're enrolled in" ON public.materials;

DROP POLICY IF EXISTS "Parents can read invoices of their children" ON public.invoices;
DROP POLICY IF EXISTS "Admins can read all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can read all payment_transactions" ON public.payment_transactions;

DROP POLICY IF EXISTS "Admins can CRUD plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can CRUD all subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Admins can read all tax reports" ON public.tax_reports;

-- 3. Recreate policies using Helper Functions (No more Infinite Recursion)

CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can read all parent_students" ON public.parent_students FOR SELECT USING (public.is_admin());

CREATE POLICY "Students can read classes they are enrolled in" ON public.classes FOR SELECT USING (public.is_student_in_class(id));
CREATE POLICY "Parents can read classes their children are enrolled in" ON public.classes FOR SELECT USING (public.is_parent_of_student_in_class(id));
CREATE POLICY "Admins can read all classes" ON public.classes FOR SELECT USING (public.is_admin());

CREATE POLICY "Teachers can CRUD enrollments for their own classes" ON public.enrollments FOR ALL USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Parents can read enrollments of their children" ON public.enrollments FOR SELECT USING (public.is_parent_of(student_id));
CREATE POLICY "Admins can read all enrollments" ON public.enrollments FOR SELECT USING (public.is_admin());

CREATE POLICY "Teachers can CRUD slots for their own classes" ON public.schedule_slots FOR ALL USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Students can read slots for classes they're enrolled in" ON public.schedule_slots FOR SELECT USING (public.is_student_in_class(class_id));
CREATE POLICY "Parents can read slots for classes their children are enrolled in" ON public.schedule_slots FOR SELECT USING (public.is_parent_of_student_in_class(class_id));

CREATE POLICY "Teachers can CRUD attendance for their own classes" ON public.attendance_records FOR ALL USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Parents can read attendance of their children" ON public.attendance_records FOR SELECT USING (public.is_parent_of(student_id));

CREATE POLICY "Teachers can CRUD lessons for their own classes" ON public.lessons FOR ALL USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Students can read lessons for classes they're enrolled in" ON public.lessons FOR SELECT USING (public.is_student_in_class(class_id));
CREATE POLICY "Parents can read lessons for classes their children are enrolled in" ON public.lessons FOR SELECT USING (public.is_parent_of_student_in_class(class_id));

CREATE POLICY "Teachers can CRUD exercises for their own classes" ON public.exercises FOR ALL USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Students can read exercises for classes they're enrolled in" ON public.exercises FOR SELECT USING (public.is_student_in_class(class_id));

CREATE POLICY "Teachers can CRUD materials for their own classes" ON public.materials FOR ALL USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Students can read materials for classes they're enrolled in" ON public.materials FOR SELECT USING (public.is_student_in_class(class_id));

CREATE POLICY "Parents can read invoices of their children" ON public.invoices FOR SELECT USING (public.is_parent_of(student_id));
CREATE POLICY "Admins can read all invoices" ON public.invoices FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can read all payment_transactions" ON public.payment_transactions FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can CRUD plans" ON public.plans FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can CRUD all subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can read all tax reports" ON public.tax_reports FOR SELECT USING (public.is_admin());

