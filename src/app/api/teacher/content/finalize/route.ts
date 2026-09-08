import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const body = await req.json();
    const { title, description, type, classIds, dueDate, assignmentTargets = {}, objectKey, fileName, fileType, sizeBytes } = body;
    if (!title || !objectKey || !fileName || !Array.isArray(classIds) || !classIds.length || !String(objectKey).startsWith(`teacher-content/${user.id}/`)) {
      return NextResponse.json({ error: 'Dữ liệu học liệu không hợp lệ' }, { status: 400 });
    }
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: owned } = await admin.from('classes').select('id').in('id', classIds).eq('teacher_id', user.id);
    if ((owned || []).length !== classIds.length) return NextResponse.json({ error: 'Bạn không có quyền đăng bài cho lớp đã chọn' }, { status: 403 });
    const storagePath = `/api/teacher/content/file?key=${encodeURIComponent(objectKey)}`;
    for (const classId of classIds) {
      if (type === 'ASSIGNMENT') {
        const target = assignmentTargets[classId] || {};
        if (target.sessionId) {
          const { data: session } = await admin.from('class_sessions').select('id').eq('id', target.sessionId).eq('class_id', classId).maybeSingle();
          if (!session) return NextResponse.json({ error: 'Buổi học đã chọn không thuộc lớp' }, { status: 400 });
        }
        const { error } = await admin.from('exercises').insert({ class_id: classId, title, description: description || null, due_date: dueDate ? new Date(dueDate).toISOString() : null, max_score: 10, session_id: target.sessionId || null, schedule_slot_id: target.scheduleSlotId || null, attachments: [{ name: fileName, url: storagePath, r2_key: objectKey, size_bytes: sizeBytes || 0, mime_type: fileType }] });
        if (error) throw new Error(error.message);
      } else {
        const { data: lesson, error } = await admin.from('lessons').insert({ class_id: classId, title, content: description || null, created_by: user.id }).select('id').single();
        if (error) throw new Error(error.message);
        const { error: materialError } = await admin.from('materials').insert({ lesson_id: lesson.id, class_id: classId, name: title, storage_path: storagePath, file_type: fileType, size_bytes: sizeBytes || 0, uploaded_by: user.id });
        if (materialError) throw new Error(materialError.message);
        continue;
      }
      const { error: materialError } = await admin.from('materials').insert({ class_id: classId, name: title, storage_path: storagePath, file_type: fileType, size_bytes: sizeBytes || 0, uploaded_by: user.id });
      if (materialError) throw new Error(materialError.message);
    }
    return NextResponse.json({ success: true, assignedClassesCount: classIds.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể đăng học liệu' }, { status: 500 });
  }
}
