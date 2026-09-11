import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';
import { getGoogleAccessToken } from '@/lib/google-drive/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const token = await getGoogleAccessToken(getServiceClient(), user.id);
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota(limit,usage)', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const body = await response.json() as { storageQuota?: { usage?: string; limit?: string } };
    if (!response.ok || !body.storageQuota) throw new Error('Không thể đọc dung lượng Google Drive.');
    const used = Number(body.storageQuota.usage ?? 0); const limit = body.storageQuota.limit ? Number(body.storageQuota.limit) : null;
    const percent = limit && limit > 0 ? Math.round((used / limit) * 100) : null;
    return NextResponse.json({ success: true, isLinked: true, storage: { used, limit, remaining: limit === null ? null : Math.max(0, limit - used), percent, isNearLimit: percent !== null && percent >= 80, isExhausted: percent !== null && percent >= 100 } });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tải hạn mức dung lượng.' }, { status: 500 });
  }
}
