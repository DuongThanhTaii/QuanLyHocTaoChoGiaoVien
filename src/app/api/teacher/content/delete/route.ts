import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID tài liệu' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch material to verify ownership and obtain drive_file_id
    const { data: material, error: fetchError } = await admin
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !material) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 });
    }

    if (material.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa tài liệu này' }, { status: 403 });
    }

    // 2. Delete file on Google Drive (best effort)
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('google_refresh_token')
        .eq('id', user.id)
        .single();

      if (profile?.google_refresh_token && material.drive_file_id) {
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
        if (tokens.access_token) {
          await fetch(`https://www.googleapis.com/drive/v3/files/${material.drive_file_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
        }
      }
    } catch (driveErr) {
      console.warn('Lỗi xóa file trên Drive (vẫn tiếp tục xóa trong database):', driveErr);
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await admin
      .from('materials')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi xóa' }, { status: 500 });
  }
}
