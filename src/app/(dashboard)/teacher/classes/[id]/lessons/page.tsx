'use client'

import { useState } from 'react';

export default function TeacherLessonsPage({ params }: { params: { id: string } }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get signed URL
      const res = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          classId: params.id
        })
      });

      const { signedUrl, path } = await res.json();
      if (!signedUrl) throw new Error("Could not get signed URL");

      // 2. Upload file directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // 3. Call Server Action to save Material DB record
      // await saveMaterialRecord({ path, name: file.name, ... })
      
      alert('Upload thành công!');
      setFile(null);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Bài giảng & Tài liệu</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg border mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Tài liệu mới</h2>
        <form onSubmit={handleUpload} className="flex gap-4 items-center">
          <input 
            type="file" 
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded flex-1 bg-white"
          />
          <button 
            type="submit" 
            disabled={!file || uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {uploading ? 'Đang upload...' : 'Upload'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Danh sách tài liệu</h2>
        {/* Render list of lessons/materials here */}
        <p className="text-gray-500 italic">Chưa có tài liệu nào.</p>
      </div>
    </div>
  );
}
