-- 1. Xóa trigger cũ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Tạo lại hàm xử lý với search_path an toàn và bắt lỗi ép kiểu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    COALESCE(CAST(NULLIF(new.raw_user_meta_data->>'role', '') AS public.USER_ROLE), 'student'::public.USER_ROLE),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Gắn lại trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
