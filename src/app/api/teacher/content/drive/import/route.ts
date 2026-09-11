import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';
import { getGoogleAccessToken } from '@/lib/google-drive/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const { fileIds } = await request.json() as { fileIds?: string[] };
  if (!Array.isArray(fileIds) || !fileIds.length || fileIds.length > 20) return NextResponse.json({ error: 'Hãy chọn từ 1 đến 20 tệp.' }, { status: 400 });
  try {
    const token = await getGoogleAccessToken(getServiceClient(), user.id);
    const files = await Promise.all(fileIds.map(async (id) => {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,webViewLink,capabilities(canShare)`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const file = await response.json() as any; if (!response.ok || !file.id) throw new Error(file?.error?.message || 'Không thể đọc tệp Drive.');
      const url = file.webViewLink || `https://drive.google.com/open?id=${file.id}`;
      if (file.capabilities?.canShare) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/permissions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }) });
      }
      return { id: file.id, name: file.name, storage_path: url, file_type: file.mimeType, size_bytes: Number(file.size ?? 0), canShare: !!file.capabilities?.canShare };
    }));
    return NextResponse.json({ files });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể nhập tệp Drive.' }, { status: 400 }); }
}
