import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch teacher profile with Google refresh token
    const { data: profile } = await admin
      .from('profiles')
      .select('google_refresh_token, email')
      .eq('id', user.id)
      .single();

    if (!profile?.google_refresh_token) {
      return NextResponse.json({
        isLinked: false,
        error: 'Chưa liên kết Google Drive',
      });
    }

    // 2. Exchange refresh token for access token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: profile.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return NextResponse.json({
        isLinked: false,
        error: 'Token Google đã hết hạn hoặc bị thu hồi',
      });
    }

    // 3. Query Google Drive storageQuota & user
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const aboutData = await aboutRes.json();

    // 4. Calculate total app materials uploaded by this teacher
    const { data: teacherClasses } = await admin
      .from('classes')
      .select('id')
      .eq('teacher_id', user.id);

    const classIds = (teacherClasses || []).map((c) => c.id);
    let materialsCount = 0;
    let totalMaterialsBytes = 0;

    if (classIds.length > 0) {
      const { data: mats } = await admin
        .from('materials')
        .select('size_bytes, storage_path')
        .in('class_id', classIds);

      // Unique by storage_path
      const seen = new Set<string>();
      (mats || []).forEach((m) => {
        if (m.storage_path && !seen.has(m.storage_path)) {
          seen.add(m.storage_path);
          materialsCount += 1;
          totalMaterialsBytes += m.size_bytes || 0;
        }
      });
    }

    return NextResponse.json({
      success: true,
      isLinked: true,
      storageQuota: aboutData.storageQuota || null,
      googleUser: aboutData.user || null,
      materialsCount,
      totalMaterialsBytes,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin bộ nhớ:', error);
    return NextResponse.json({ error: error.message || 'Lỗi kiểm tra bộ nhớ' }, { status: 500 });
  }
}
