// Mock file for Schedule UI
export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Thời khóa biểu</h1>
      <p className="text-gray-600 mb-6">Quản lý lịch học lặp lại hàng tuần cho lớp {resolvedParams.id}</p>
      
      <div className="grid grid-cols-7 gap-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
          <div key={day} className="border rounded p-2 min-h-24 bg-gray-50">
            <div className="font-bold text-center border-b pb-1 mb-2 text-gray-700">{day}</div>
            {/* Render slots here */}
            {idx === 0 && ( // Example slot on Monday
              <div className="bg-blue-100 text-blue-800 text-xs p-1 rounded mb-1 text-center">
                18:00 - 19:30
              </div>
            )}
            <button className="text-xs text-gray-500 hover:text-blue-600 w-full text-center mt-2">
              + Thêm
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
