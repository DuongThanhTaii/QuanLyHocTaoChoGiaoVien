'use client'

import { useState } from 'react';
import { createLessonAction, attachMaterialAction } from './actions';

export function CreateLessonForm({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('classId', classId);
    
    const res = await createLessonAction(formData);
    setLoading(false);
    
    if (res.error) {
      alert('Lỗi: ' + res.error);
    } else {
      alert('Tạo bài giảng thành công!');
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border mb-8">
      <h2 className="text-lg font-semibold mb-4">Tạo Bài giảng mới</h2>
      <div className="flex flex-col gap-4">
        <input 
          type="text" 
          name="title" 
          placeholder="Tiêu đề bài giảng" 
          required
          className="border p-2 rounded bg-white"
        />
        <textarea 
          name="content" 
          placeholder="Nội dung (tuỳ chọn)" 
          className="border p-2 rounded bg-white h-24"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50 self-start"
        >
          {loading ? 'Đang tạo...' : 'Tạo Bài giảng'}
        </button>
      </div>
    </form>
  );
}

export function UploadMaterialForm({ classId, lessonId }: { classId: string, lessonId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const res = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          classId: classId
        })
      });

      const { signedUrl, path } = await res.json();
      if (!signedUrl) throw new Error("Could not get signed URL");

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const formData = new FormData();
      formData.append('classId', classId);
      formData.append('lessonId', lessonId);
      formData.append('materialName', file.name);
      formData.append('materialPath', path);
      formData.append('fileType', file.type);
      formData.append('sizeBytes', file.size.toString());

      const attachRes = await attachMaterialAction(formData);
      if (attachRes.error) {
        throw new Error(attachRes.error);
      }
      
      alert('Upload thành công!');
      setFile(null);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="flex gap-4 items-center mt-4 p-4 border border-dashed rounded bg-gray-50">
      <input 
        type="file" 
        onChange={e => setFile(e.target.files?.[0] || null)}
        className="border p-2 rounded flex-1 bg-white text-sm"
      />
      <button 
        type="submit" 
        disabled={!file || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        {uploading ? 'Đang upload...' : 'Thêm tài liệu'}
      </button>
    </form>
  );
}
