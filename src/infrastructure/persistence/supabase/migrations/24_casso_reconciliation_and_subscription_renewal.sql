-- Casso-based tuition reconciliation and platform subscription renewal controls.
-- Run this migration in Supabase SQL Editor before enabling the corresponding app routes.
BEGIN;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS next_renewal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (renewal_status IN ('not_configured', 'ready', 'processing', 'paid', 'retrying', 'failed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS renewal_attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_renewal_attempt_at TIMESTAMPTZ;

UPDATE public.subscriptions
SET next_renewal_at = current_period_end
WHERE next_renewal_at IS NULL AND current_period_end IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.casso_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  casso_user_id TEXT,
  casso_bank_account_id TEXT,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  webhook_secret_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'active', 'expired', 'revoked', 'error')),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS casso_connections_bank_account_idx ON public.casso_connections(bank_account_id);

CREATE TABLE IF NOT EXISTS public.casso_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casso_transaction_id TEXT NOT NULL UNIQUE,
  connection_id UUID REFERENCES public.casso_connections(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casso_reconciliation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.casso_connections(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  casso_transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  transfer_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'ignored')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS casso_reconciliation_queue_teacher_lookup
  ON public.casso_reconciliation_queue(connection_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.subscription_renewal_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  platform_order_id UUID REFERENCES public.platform_orders(id) ON DELETE SET NULL,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('skipped', 'requires_action', 'processing', 'paid', 'failed')),
  provider_reference TEXT,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS public.platform_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'payos',
  provider_token_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_payment_methods_user_idx ON public.platform_payment_methods(user_id, status);

ALTER TABLE public.casso_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casso_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casso_reconciliation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_renewal_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_payment_methods ENABLE ROW LEVEL SECURITY;

-- Credentials and raw bank events are service-role only. Teachers only receive safe server-rendered status.
CREATE POLICY "Teachers can view their reconciliation queue" ON public.casso_reconciliation_queue
  FOR SELECT TO authenticated
  USING (connection_id IN (SELECT id FROM public.casso_connections WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can view own renewal attempts" ON public.subscription_renewal_attempts
  FOR SELECT TO authenticated
  USING (subscription_id IN (SELECT id FROM public.subscriptions WHERE teacher_id = auth.uid()));
CREATE POLICY "Users can view own platform payment methods" ON public.platform_payment_methods
  FOR SELECT TO authenticated USING (user_id = auth.uid());

COMMIT;
NOTIFY pgrst, 'reload schema';
