import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function StudentLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: lessons } = await admin.from('lessons').select('id, title, content, created_at, materials(id, name, file_type, size_bytes)').eq('class_id', id).order('created_at', { ascending: false });

  return <div className="space-y-6"><div><h2 className="text-2xl font-bold tracking-tight text-zinc-900">Bài giảng & Tài liệu</h2><p className="text-zinc-500">Danh sách bài giảng và tài liệu do giáo viên đăng.</p></div><Card><CardHeader><CardTitle>Danh sách bài giảng</CardTitle></CardHeader><CardContent className="space-y-4">{!lessons?.length ? <p className="text-zinc-500">Chưa có bài giảng nào.</p> : lessons.map((lesson: any) => <article key={lesson.id} className="rounded-lg border border-zinc-200 p-5"><h3 className="font-semibold text-zinc-900">{lesson.title}</h3>{lesson.content && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{lesson.content}</p>}<div className="mt-4"><p className="text-sm font-medium text-zinc-700">Tài liệu đính kèm</p>{lesson.materials?.length ? <ul className="mt-2 space-y-1 text-sm text-zinc-600">{lesson.materials.map((material: any) => <li key={material.id}>📄 {material.name}{material.size_bytes ? ` (${Math.ceil(material.size_bytes / 1024)} KB)` : ''}</li>)}</ul> : <p className="mt-1 text-sm text-zinc-500">Chưa có tài liệu đính kèm.</p>}</div></article>)}</CardContent></Card></div>;
}
