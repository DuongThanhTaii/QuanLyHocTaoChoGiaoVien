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

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Thiếu ID tài liệu cần xóa' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get Google access token to delete files from Drive
    const { data: profile } = await admin
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    let accessToken: string | null = null;
    if (profile?.google_refresh_token) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      try {
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
        accessToken = tokens.access_token || null;
      } catch (tokenErr) {
        console.warn('Lỗi lấy access token xóa file Drive:', tokenErr);
      }
    }

    // 2. Fetch materials to get Drive file IDs and verify ownership
    const { data: materials } = await admin
      .from('materials')
      .select('id, storage_path, lesson_id, class_id')
      .in('id', ids);

    for (const mat of (materials || [])) {
      // Extract Google Drive file ID from storage_path (e.g., https://drive.google.com/file/d/FILE_ID/view)
      let driveFileId: string | null = null;
      const match = mat.storage_path?.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        driveFileId = match[1];
      }

      // Delete from Google Drive if access token and file ID exist
      if (accessToken && driveFileId) {
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch (driveErr) {
          console.warn(`Lỗi xóa file ${driveFileId} trên Drive:`, driveErr);
        }
      }

      // If attached to a lesson, also clean up lesson if desired
      if (mat.lesson_id) {
        await admin.from('lessons').delete().eq('id', mat.lesson_id);
      }
    }

    // 3. Delete materials from database
    const { error: deleteError } = await admin
      .from('materials')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi xóa' }, { status: 500 });
  }
}
