-- Enum types
CREATE TYPE USER_ROLE AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE FEE_TYPE AS ENUM ('per_session', 'per_month', 'per_course');
CREATE TYPE ATTENDANCE_STATUS AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE INVOICE_STATUS AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE PAYMENT_METHOD AS ENUM ('cash', 'bank_transfer', 'momo', 'vnpay', 'zalopay');
CREATE TYPE PLAN_INTERVAL AS ENUM ('monthly', 'yearly');
CREATE TYPE SUBSCRIPTION_STATUS AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- Identity & Access Management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role USER_ROLE NOT NULL DEFAULT 'teacher',
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  relationship TEXT,
  can_pay BOOLEAN DEFAULT true,
  can_view_grades BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Classroom & Schedule
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  fee_per_session DECIMAL(12,2),
  fee_type FEE_TYPE DEFAULT 'per_session',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  custom_fee DECIMAL(12,2),
  UNIQUE(class_id, student_id)
);

CREATE TABLE public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.schedule_slots(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  status ATTENDANCE_STATUS NOT NULL,
  note TEXT,
  marked_by UUID NOT NULL REFERENCES public.profiles(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slot_id, student_id)
);

-- Content Management
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.schedule_slots(id),
  title TEXT NOT NULL,
  content JSONB,
  week_number INT,
  date DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_score DECIMAL(5,2),
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  size_bytes INT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment & Invoice
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sessions_count INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
  total_amount DECIMAL(12,2) NOT NULL,
  status INVOICE_STATUS DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),
  payment_method PAYMENT_METHOD,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  amount DECIMAL(12,2) NOT NULL,
  method PAYMENT_METHOD NOT NULL,
  status TEXT DEFAULT 'pending',
  gateway_response JSONB,
  paid_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription (Admin billing)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(12,2) NOT NULL,
  price_yearly DECIMAL(12,2) NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status SUBSCRIPTION_STATUS DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_method_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat System
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct',
  title TEXT,
  class_id UUID REFERENCES public.classes(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  metadata JSONB,
  reply_to UUID REFERENCES public.messages(id),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax & Analytics
CREATE TABLE public.tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  year INT NOT NULL,
  quarter INT CHECK (quarter BETWEEN 1 AND 4),
  month INT CHECK (month BETWEEN 1 AND 12),
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_taxable DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_invoices INT DEFAULT 0,
  total_paid INT DEFAULT 0,
  total_overdue INT DEFAULT 0,
  report_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ
);

-- RLS Enablement
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
-- More RLS policies will be added as we go.

-- Indexes
CREATE INDEX idx_invoices_teacher_status ON public.invoices(teacher_id, status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date) WHERE status = 'sent';
CREATE INDEX idx_attendance_slot ON public.attendance_records(slot_id, student_id);
CREATE INDEX idx_schedule_class_day ON public.schedule_slots(class_id, day_of_week);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id) WHERE left_at IS NULL;
