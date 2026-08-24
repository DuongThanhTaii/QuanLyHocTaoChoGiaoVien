-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can read profiles of students enrolled in their classes" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.enrollments e ON e.class_id = c.id
    WHERE c.teacher_id = auth.uid() AND e.student_id = profiles.id
  )
);
CREATE POLICY "Parents can read profiles of their linked children" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = profiles.id
  )
);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- parent_students
CREATE POLICY "Parents can read their own parent_students rows" ON public.parent_students FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Admins can read all parent_students" ON public.parent_students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- classes
CREATE POLICY "Teachers can CRUD their own classes" ON public.classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can read classes they are enrolled in" ON public.classes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = classes.id AND e.student_id = auth.uid()
  )
);
CREATE POLICY "Parents can read classes their children are enrolled in" ON public.classes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.enrollments e ON e.student_id = ps.student_id
    WHERE ps.parent_id = auth.uid() AND e.class_id = classes.id
  )
);
CREATE POLICY "Admins can read all classes" ON public.classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- enrollments
CREATE POLICY "Teachers can CRUD enrollments for their own classes" ON public.enrollments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = enrollments.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can read their own enrollments" ON public.enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Parents can read enrollments of their children" ON public.enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = enrollments.student_id
  )
);
CREATE POLICY "Admins can read all enrollments" ON public.enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- schedule_slots
CREATE POLICY "Teachers can CRUD slots for their own classes" ON public.schedule_slots FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = schedule_slots.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can read slots for classes they're enrolled in" ON public.schedule_slots FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = schedule_slots.class_id AND e.student_id = auth.uid()
  )
);
CREATE POLICY "Parents can read slots for classes their children are enrolled in" ON public.schedule_slots FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.enrollments e ON e.student_id = ps.student_id
    WHERE ps.parent_id = auth.uid() AND e.class_id = schedule_slots.class_id
  )
);

-- attendance_records
CREATE POLICY "Teachers can CRUD attendance for their own classes" ON public.attendance_records FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = attendance_records.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can read their own attendance records" ON public.attendance_records FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Parents can read attendance of their children" ON public.attendance_records FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = attendance_records.student_id
  )
);

-- lessons
CREATE POLICY "Teachers can CRUD lessons for their own classes" ON public.lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = lessons.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can read lessons for classes they're enrolled in" ON public.lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = lessons.class_id AND e.student_id = auth.uid()
  )
);
CREATE POLICY "Parents can read lessons for classes their children are enrolled in" ON public.lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.enrollments e ON e.student_id = ps.student_id
    WHERE ps.parent_id = auth.uid() AND e.class_id = lessons.class_id
  )
);

-- exercises
CREATE POLICY "Teachers can CRUD exercises for their own classes" ON public.exercises FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = exercises.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can read exercises for classes they're enrolled in" ON public.exercises FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = exercises.class_id AND e.student_id = auth.uid()
  )
);

-- materials
CREATE POLICY "Teachers can CRUD materials for their own classes" ON public.materials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = materials.class_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can read materials for classes they're enrolled in" ON public.materials FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = materials.class_id AND e.student_id = auth.uid()
  )
);

-- invoices
CREATE POLICY "Teachers can CRUD invoices where teacher_id = auth.uid()" ON public.invoices FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can read invoices where student_id = auth.uid()" ON public.invoices FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Parents can read invoices of their children" ON public.invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = invoices.student_id
  )
);
CREATE POLICY "Admins can read all invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- payment_transactions
CREATE POLICY "Teachers can read transactions for their invoices" ON public.payment_transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = payment_transactions.invoice_id AND i.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins can read all payment_transactions" ON public.payment_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- plans
CREATE POLICY "Everyone can read active plans" ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can CRUD plans" ON public.plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- subscriptions
CREATE POLICY "Teachers can read their own subscription" ON public.subscriptions FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Admins can CRUD all subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- conversations
CREATE POLICY "Users can read conversations they participate in" ON public.conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

-- conversation_participants
CREATE POLICY "Users can read their own participation records" ON public.conversation_participants FOR SELECT USING (user_id = auth.uid());

-- messages
CREATE POLICY "Users can read messages in conversations they participate in" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert messages in conversations they participate in" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);

-- tax_reports
CREATE POLICY "Teachers can read their own tax reports" ON public.tax_reports FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Admins can read all tax reports" ON public.tax_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
