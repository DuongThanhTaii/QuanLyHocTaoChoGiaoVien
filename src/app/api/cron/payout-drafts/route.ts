import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/server';
import { createDailyPayoutDraft } from '@/lib/payouts/server';

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const batch = await createDailyPayoutDraft(getServiceClient(), null);
  return NextResponse.json({ ok: true, batchId: batch.id });
}
