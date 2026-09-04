import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getUserQuotaSnapshot } from '@/lib/billing/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from('profiles').select('google_refresh_token').eq('id', user.id).single();
    if (profileError || !profile?.google_refresh_token) return NextResponse.json({ success: true, isLinked: false });

    const quota = await getUserQuotaSnapshot(user.id);
    return NextResponse.json({ success: true, isLinked: true, storage: quota.storage });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tải hạn mức dung lượng.' }, { status: 500 });
  }
}
