export default async function StudentLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.id;
  // In a real app, you would fetch the materials and generate Signed Download URLs for them.
  const materials = [
    { id: '1', name: 'Chuong_1_Toan_Hoc_co_ban.pdf', size: '2MB' },
    { id: '2', name: 'Bai_tap_ve_nha_tuan_1.docx', size: '1MB' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tài liệu học tập</h1>
        <p className="text-zinc-500">Xem và tải tài liệu môn học</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      
      <div className="space-y-4">
        {materials.map(m => (
          <div key={m.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-semibold text-gray-800">{m.name}</p>
                <p className="text-sm text-gray-500">{m.size}</p>
              </div>
            </div>
            <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-medium hover:bg-blue-200">
              Tải xuống
            </button>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
