import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/server';
import { deleteSubmissionObject } from '@/lib/r2/server';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get('authorization') === `Bearer ${secret}`;
}

// The lifecycle rule is a safety net. This job also removes the actual object so
// expiry does not depend on the asynchronous lifecycle worker.
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const expiresBefore = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const admin = getServiceClient();
  const { data: assets, error: lookupError } = await admin
    .from('submission_assets')
    .select('id, object_key')
    .eq('kind', 'image')
    .lt('created_at', expiresBefore);
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!assets?.length) return NextResponse.json({ deleted: 0 });
  const deletedIds: string[] = [];
  for (const asset of assets) {
    try {
      if (asset.object_key) await deleteSubmissionObject(asset.object_key);
      deletedIds.push(asset.id);
    } catch (error) {
      console.error(`Could not delete expired R2 object for submission asset ${asset.id}`, error);
    }
  }
  if (!deletedIds.length) return NextResponse.json({ deleted: 0, failed: assets.length }, { status: 502 });
  const { error: deleteError } = await admin.from('submission_assets').delete().in('id', deletedIds);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ deleted: deletedIds.length, failed: assets.length - deletedIds.length });
}
