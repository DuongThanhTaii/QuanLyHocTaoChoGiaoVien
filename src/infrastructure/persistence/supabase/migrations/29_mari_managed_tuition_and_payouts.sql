-- Mari-managed tuition collection and daily teacher payout ledger.
BEGIN;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS collection_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (collection_mode IN ('manual', 'mari_auto')),
  ADD COLUMN IF NOT EXISTS collection_account_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS mari_collected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mari_casso_transaction_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.platform_collection_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_platform_collection_account
  ON public.platform_collection_accounts ((is_active)) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.platform_casso_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_account_id UUID NOT NULL REFERENCES public.platform_collection_accounts(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  webhook_secret_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_platform_casso_connection
  ON public.platform_casso_connections ((status)) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.platform_casso_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casso_transaction_id TEXT NOT NULL UNIQUE,
  connection_id UUID REFERENCES public.platform_casso_connections(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_tuition_collection_settings (
  teacher_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  collection_mode TEXT NOT NULL DEFAULT 'manual' CHECK (collection_mode IN ('manual', 'mari_auto')),
  payout_bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE RESTRICT,
  gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
  fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  net_amount NUMERIC(12,2) NOT NULL CHECK (net_amount > 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'batched', 'paid', 'adjustment_required')),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teacher_payables_queue_idx ON public.teacher_payables(status, available_at, teacher_id);

CREATE TABLE IF NOT EXISTS public.payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE NOT NULL,
  cutoff_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'exported', 'processing', 'completed', 'partially_failed', 'cancelled')),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_date)
);

CREATE TABLE IF NOT EXISTS public.payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  bank_name_snapshot TEXT NOT NULL,
  account_number_snapshot TEXT NOT NULL,
  account_name_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'adjustment_required')),
  bank_transaction_reference TEXT,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(batch_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.payout_item_payables (
  payout_item_id UUID NOT NULL REFERENCES public.payout_items(id) ON DELETE CASCADE,
  payable_id UUID NOT NULL UNIQUE REFERENCES public.teacher_payables(id) ON DELETE RESTRICT,
  PRIMARY KEY (payout_item_id, payable_id)
);

CREATE TABLE IF NOT EXISTS public.payout_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  payout_item_id UUID REFERENCES public.payout_items(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('export_file', 'bank_receipt', 'bank_statement')),
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

ALTER TABLE public.teacher_tuition_collection_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_collection_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_casso_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_casso_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_item_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers view own tuition collection setting" ON public.teacher_tuition_collection_settings FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers update own tuition collection setting" ON public.teacher_tuition_collection_settings FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers insert own tuition collection setting" ON public.teacher_tuition_collection_settings FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers view own payables" ON public.teacher_payables FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers view own payout items" ON public.payout_items FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers view own payout links" ON public.payout_item_payables FOR SELECT TO authenticated USING (payout_item_id IN (SELECT id FROM public.payout_items WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers view own payout evidence" ON public.payout_evidence FOR SELECT TO authenticated USING (payout_item_id IN (SELECT id FROM public.payout_items WHERE teacher_id = auth.uid()));

COMMIT;
NOTIFY pgrst, 'reload schema';
