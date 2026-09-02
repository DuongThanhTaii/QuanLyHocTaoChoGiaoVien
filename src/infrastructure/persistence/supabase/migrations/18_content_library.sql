-- Create enum for material types
CREATE TYPE public.material_type AS ENUM ('LECTURE', 'ASSIGNMENT');
CREATE TYPE public.submission_status AS ENUM ('SUBMITTED', 'GRADED', 'LATE');

-- 1. materials (Kho tài liệu gốc của giáo viên)
CREATE TABLE public.materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type material_type NOT NULL,
    drive_file_id text NOT NULL,
    drive_view_link text,
    file_size_bytes bigint,
    mime_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. class_lectures (Gắn bài giảng vào lớp)
CREATE TABLE public.class_lectures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(class_id, material_id)
);

-- 3. class_assignments (Giao bài tập cho lớp)
CREATE TABLE public.class_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    due_date timestamp with time zone,
    max_score numeric(5,2) DEFAULT 10.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(class_id, material_id)
);

-- 4. submissions (Bài nộp của học sinh)
CREATE TABLE public.submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    drive_file_id text NOT NULL,
    drive_view_link text,
    status submission_status DEFAULT 'SUBMITTED',
    score numeric(5,2),
    teacher_feedback text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(assignment_id, student_id)
);

-- RLS Policies
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ... RLS will be configured later, defaulting to closed ...
