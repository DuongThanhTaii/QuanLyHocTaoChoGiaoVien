'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/infrastructure/auth/supabase/server';

export async function postClassAnnouncementAction(classId: string, content: string) {
  if (!classId || !content || !content.trim()) {
    return { error: 'Nội dung thông báo không được để trống.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Vui lòng đăng nhập để thực hiện.' };
  }

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Trích xuất tiêu đề ngắn gọn
  const cleanContent = content.trim();
  const title = cleanContent.length > 60 ? cleanContent.substring(0, 60) + '...' : cleanContent;

  const { error } = await supabaseAdmin
    .from('lessons')
    .insert({
      class_id: classId,
      title: `📢 [Thông báo] ${title}`,
      content: cleanContent,
      created_by: user.id
    });

  if (error) {
    return { error: 'Lỗi khi đăng thông báo: ' + error.message };
  }

  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/teacher/classes/${classId}/lessons`);
  return { success: true };
}
