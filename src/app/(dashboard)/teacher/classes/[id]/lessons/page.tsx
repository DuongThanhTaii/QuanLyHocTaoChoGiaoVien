import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { CreateLessonForm, UploadMaterialForm } from './client-components';

export default async function TeacherLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = await getRepositories();
  const lessons = await repos.content.findLessonsByClass(id);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Bài giảng & Tài liệu</h1>
      
      <CreateLessonForm classId={id} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Danh sách bài giảng</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-500 italic">Chưa có bài giảng nào.</p>
        ) : (
          <div className="space-y-6">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">{lesson.title}</h3>
                {lesson.content && (
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{lesson.content}</p>
                )}
                
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Tài liệu đính kèm:</h4>
                  {(!lesson.materials || lesson.materials.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">Chưa có tài liệu.</p>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {lesson.materials.map((m) => (
                        <li key={m.id} className="text-sm">
                          <a href={`/api/materials/${m.id}`} className="text-blue-600 hover:underline">
                            {m.name}
                          </a>
                          <span className="text-gray-500 text-xs ml-2">
                            ({Math.round(m.sizeBytes / 1024)} KB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <UploadMaterialForm classId={id} lessonId={lesson.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
