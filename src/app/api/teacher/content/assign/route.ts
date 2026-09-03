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

    const {
      title,
      description,
      type,
      storagePath,
      driveFileId,
      fileType,
      sizeBytes,
      classIds,
      dueDate,
    } = await req.json();

    if (!title || !storagePath || !Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin tài liệu hoặc chưa chọn lớp học' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const classId of classIds) {
      if (type === 'LECTURE') {
        const { data: newLesson } = await admin
          .from('lessons')
          .insert({
            class_id: classId,
            title: title,
            content: description || null,
            created_by: user.id,
          })
          .select()
          .single();

        await admin.from('materials').insert({
          lesson_id: newLesson?.id || null,
          class_id: classId,
          name: title,
          storage_path: storagePath,
          file_type: fileType || 'application/octet-stream',
          size_bytes: sizeBytes || null,
          uploaded_by: user.id,
        });
      } else {
        await admin.from('exercises').insert({
          class_id: classId,
          title: title,
          description: description || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          max_score: 10,
          attachments: [
            {
              name: title,
              url: storagePath,
              drive_file_id: driveFileId || null,
              size_bytes: sizeBytes || null,
              mime_type: fileType || null,
            },
          ],
        });

        await admin.from('materials').insert({
          class_id: classId,
          name: title,
          storage_path: storagePath,
          file_type: fileType || 'application/octet-stream',
          size_bytes: sizeBytes || null,
          uploaded_by: user.id,
        });
      }
    }

    return NextResponse.json({ success: true, count: classIds.length });
  } catch (error: any) {
    console.error('Lỗi khi gán tài liệu vào lớp:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi gán bài vào lớp' }, { status: 500 });
  }
}
