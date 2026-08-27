-- Bảng students (Hồ sơ học sinh độc lập, có thể chưa có tài khoản User)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id), -- Nullable nếu chưa có tk
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  school TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng guardians (Phụ huynh/Người giám hộ)
CREATE TABLE public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id), -- Nullable nếu chưa có tk
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng trung gian liên kết Phụ huynh - Học sinh
CREATE TABLE public.student_guardians (
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'OTHER', -- FATHER, MOTHER, GUARDIAN, OTHER
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, guardian_id)
);

-- Cập nhật bảng enrollments
-- Do bảng này đang tham chiếu tới profiles(id) cho student_id, chúng ta cần thay đổi nó.
-- TRONG THỰC TẾ, CẦN MIGRATION DATA NHƯNG DO APP MỚI, CHÚNG TA CÓ THỂ DROP VÀ TẠO LẠI (Hoặc alter)
-- Xóa bảng cũ và tạo lại để chuẩn hóa
DROP TABLE IF EXISTS public.enrollments CASCADE;

CREATE TYPE ENROLLMENT_STATUS AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'LEFT', 'BLOCKED');

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status ENROLLMENT_STATUS DEFAULT 'ACTIVE',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  tuition_plan_id UUID, -- Sẽ link với bảng TuitionPlans sau này
  custom_fee DECIMAL(12,2),
  UNIQUE(class_id, student_id)
);

-- Bảng class_sessions (Phiên học cụ thể)
CREATE TYPE SESSION_STATUS AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

CREATE TABLE public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  schedule_slot_id UUID REFERENCES public.schedule_slots(id), -- Nullable nếu là buổi học ngoại lệ
  title TEXT, -- VD: Buổi 1, Buổi học bù...
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  status SESSION_STATUS DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cập nhật bảng attendance_records
DROP TABLE IF EXISTS public.attendance_records CASCADE;

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status ATTENDANCE_STATUS NOT NULL,
  note TEXT,
  marked_by UUID NOT NULL REFERENCES public.profiles(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Bảng class_invitations (Mã mời, mã lớp)
CREATE TYPE INVITATION_STATUS AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

CREATE TABLE public.class_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, -- Dùng cho link/QR code
  join_code TEXT UNIQUE, -- Mã 6 ký tự dễ nhớ VD: ML7K2P
  type TEXT DEFAULT 'GENERAL',
  expires_at TIMESTAMPTZ,
  max_uses INT,
  used_count INT DEFAULT 0,
  status INVITATION_STATUS DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_students_user ON public.students(user_id);
CREATE INDEX idx_guardians_user ON public.guardians(user_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(class_id, status);
CREATE INDEX idx_sessions_class_date ON public.class_sessions(class_id, session_date);
CREATE INDEX idx_invitations_code ON public.class_invitations(join_code) WHERE status = 'ACTIVE';

-- Cập nhật bảng invoices (Đổi student_id từ profiles sang students)
-- Nếu có FK từ profiles, ta drop và add lại
ALTER TABLE public.invoices DROP CONSTRAINT invoices_student_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Drop bảng parent_students cũ vì đã thay thế bằng student_guardians
DROP TABLE IF EXISTS public.parent_students CASCADE;
