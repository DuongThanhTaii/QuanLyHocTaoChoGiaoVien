export default function StudentLessonsPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the materials and generate Signed Download URLs for them.
  const materials = [
    { id: '1', name: 'Chuong_1_Toan_Hoc_co_ban.pdf', size: '2MB' },
    { id: '2', name: 'Bai_tap_ve_nha_tuan_1.docx', size: '1MB' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Tài liệu học tập</h1>
      
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
  );
}
