-- 1. Thêm các cột cấu hình PayOS vào bảng profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS payos_client_id TEXT,
ADD COLUMN IF NOT EXISTS payos_api_key TEXT,
ADD COLUMN IF NOT EXISTS payos_checksum_key TEXT;

-- 2. Tạo bảng bank_accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Bật RLS cho bảng bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Policies cho bank_accounts
-- Người dùng có thể xem STK của chính mình
CREATE POLICY "Users can view own bank accounts" 
    ON public.bank_accounts FOR SELECT 
    USING (auth.uid() = user_id);

-- Người dùng có thể tạo STK của chính mình
CREATE POLICY "Users can insert own bank accounts" 
    ON public.bank_accounts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Người dùng có thể cập nhật STK của chính mình
CREATE POLICY "Users can update own bank accounts" 
    ON public.bank_accounts FOR UPDATE 
    USING (auth.uid() = user_id);

-- Người dùng có thể xóa STK của chính mình
CREATE POLICY "Users can delete own bank accounts" 
    ON public.bank_accounts FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Trigger tự động set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
