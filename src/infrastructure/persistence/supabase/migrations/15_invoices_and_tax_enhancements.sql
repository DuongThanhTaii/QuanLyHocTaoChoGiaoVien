-- Migration 15: Invoices and Tax Enhancements

-- 1. Cập nhật bảng invoices
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS payment_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS extra_fee DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_items JSONB,
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Đảm bảo các hóa đơn cũ có payment_token
UPDATE public.invoices 
SET payment_token = encode(gen_random_bytes(16), 'hex') 
WHERE payment_token IS NULL;

-- 2. Bảng tùy biến mẫu hóa đơn của giáo viên (invoice_templates)
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  note_message TEXT DEFAULT 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!',
  theme_color TEXT DEFAULT '#3B82F6',
  show_attendance_log BOOLEAN DEFAULT true,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id)
);

-- 3. Cập nhật thông tin thuế cho profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tax_code TEXT,
  ADD COLUMN IF NOT EXISTS tax_authority TEXT,
  ADD COLUMN IF NOT EXISTS tax_business_type TEXT DEFAULT 'personal';

-- 4. Cập nhật bảng payment_transactions
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS proof_image_url TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id);

-- 5. Bật RLS và thêm Policies
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own invoice template"
  ON public.invoice_templates FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own invoice template"
  ON public.invoice_templates FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own invoice template"
  ON public.invoice_templates FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own invoice template"
  ON public.invoice_templates FOR DELETE
  USING (auth.uid() = teacher_id);

-- Cho phép xem hóa đơn công khai khi có payment_token chính xác (dành cho phụ huynh quét QR/xem qua link)
CREATE POLICY "Public view invoice via payment token"
  ON public.invoices FOR SELECT
  USING (payment_token IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_payment_token ON public.invoices(payment_token);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_teacher ON public.invoice_templates(teacher_id);
