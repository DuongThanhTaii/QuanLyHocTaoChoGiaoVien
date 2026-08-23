export default function WordEditorPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center shrink-0">
        <h1 className="font-bold">Soạn thảo tài liệu (Word Embedded)</h1>
        <button className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-50">Lưu vào Supabase</button>
      </div>
      <div className="flex-1 bg-gray-100 p-4">
        {/* Placeholder for iframe / rich text editor like TinyMCE or ONLYOFFICE */}
        <div className="w-full h-full bg-white shadow-lg border rounded flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl">📝</span>
            <p className="mt-4 text-gray-500">Khu vực nhúng Text Editor (Ví dụ: TinyMCE, CKEditor, hoặc Office365 Iframe)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
