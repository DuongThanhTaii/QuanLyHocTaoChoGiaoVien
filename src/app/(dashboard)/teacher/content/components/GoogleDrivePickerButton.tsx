'use client';

import { useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

declare global { interface Window { gapi?: any; google?: any; } }
type DriveFile = { id: string; name: string; storage_path: string; file_type?: string | null; size_bytes?: number | null; canShare?: boolean };

function loadPicker() { return new Promise<void>((resolve, reject) => { if (window.google?.picker) return resolve(); const script = document.createElement('script'); script.src = 'https://apis.google.com/js/api.js'; script.onload = () => window.gapi.load('picker', { callback: resolve, onerror: reject }); script.onerror = reject; document.head.appendChild(script); }); }

export function GoogleDrivePickerButton({ onImported }: { onImported: (file: DriveFile) => void }) {
  const [loading, setLoading] = useState(false);
  const open = async () => {
    const developerKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
    if (!developerKey || !appId) return toast.error('Thiếu NEXT_PUBLIC_GOOGLE_API_KEY hoặc NEXT_PUBLIC_GOOGLE_APP_ID để mở Google Picker.');
    setLoading(true);
    try {
      const tokenResponse = await fetch('/api/teacher/content/drive/access-token', { cache: 'no-store' }); const tokenData = await tokenResponse.json(); if (!tokenResponse.ok) throw new Error(tokenData.error);
      await loadPicker();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(false);
      const picker = new window.google.picker.PickerBuilder().setDeveloperKey(developerKey).setAppId(appId).setOAuthToken(tokenData.accessToken).addView(view).setTitle('Chọn tệp từ Google Drive').setCallback(async (data: any) => {
        if (data.action !== window.google.picker.Action.PICKED) return;
        try { const response = await fetch('/api/teacher/content/drive/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileIds: data.docs.map((doc: any) => doc.id) }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); onImported(result.files[0]); }
        catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể lấy tệp Drive.'); }
      }).build(); picker.setVisible(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể mở Google Drive.'); } finally { setLoading(false); }
  };
  return <Button type="button" variant="outline" onClick={open} disabled={loading}><>{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FolderOpen className="mr-2 size-4" />}Chọn từ Drive</></Button>;
}
