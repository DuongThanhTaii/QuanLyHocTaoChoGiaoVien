-- 09_auth_rls_policies.sql

-- Bật RLS cho các bảng mới
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Policies cho user_roles
-- User có thể xem roles của chính mình
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- User có thể insert role cho chính mình
CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User có thể update role của chính mình
CREATE POLICY "Users can update their own roles" ON public.user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Policies cho teacher_profiles
CREATE POLICY "Users can view their own teacher profile" ON public.teacher_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own teacher profile" ON public.teacher_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teacher profile" ON public.teacher_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Policies cho student_profiles
CREATE POLICY "Users can view their own student profile" ON public.student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student profile" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Policies cho guardian_profiles
CREATE POLICY "Users can view their own guardian profile" ON public.guardian_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guardian profile" ON public.guardian_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guardian profile" ON public.guardian_profiles
  FOR UPDATE USING (auth.uid() = user_id);
