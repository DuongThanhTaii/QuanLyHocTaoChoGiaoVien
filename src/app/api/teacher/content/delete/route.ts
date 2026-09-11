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

    // Fetch the Mari links to remove. Source files are intentionally left on Drive.
    const { data: materials } = await admin
      .from('materials')
      .select('id, storage_path, lesson_id, class_id')
      .in('id', ids);

    for (const mat of (materials || [])) {
      // An assignment and its library material share the Drive URL. Deleting
      // the material must also remove the assignment that students received.
      const { data: classExercises } = await admin
        .from('exercises')
        .select('id, attachments')
        .eq('class_id', mat.class_id);
      const exerciseIds = (classExercises || []).filter((exercise: any) =>
        Array.isArray(exercise.attachments) && exercise.attachments.some((attachment: any) => attachment?.url === mat.storage_path)
      ).map((exercise: any) => exercise.id);
      if (exerciseIds.length) await admin.from('exercises').delete().in('id', exerciseIds);
      // Extract Google Drive file ID from storage_path (e.g., https://drive.google.com/file/d/FILE_ID/view)
      // Never delete the teacher's source Drive file. Mari only removes its lesson/material link.

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
