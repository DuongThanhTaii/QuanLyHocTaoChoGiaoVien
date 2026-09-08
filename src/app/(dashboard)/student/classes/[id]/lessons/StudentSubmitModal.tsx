'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, FileUp, Link2, Loader2, Plus, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type LocalAsset = { id: string; file?: File; url?: string; name: string; kind: 'file' | 'image' | 'link'; progress: number };

export function StudentSubmitModal({ isOpen, onClose, exercise, previousSubmission, onSuccess }: any) {
  const router = useRouter(); const fileRef = useRef<HTMLInputElement>(null); const cameraRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(''); const [link, setLink] = useState(''); const [assets, setAssets] = useState<LocalAsset[]>([]); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (isOpen) { setNote(previousSubmission?.note || ''); setLink(''); setAssets([]); } }, [isOpen, previousSubmission]);
  if (!exercise) return null;
  const addFiles = (files: FileList | null) => files && setAssets((current) => [...current, ...Array.from(files).slice(0, 10 - current.length).map((file): LocalAsset => ({ id: crypto.randomUUID(), file, name: file.name, kind: file.type.startsWith('image/') ? 'image' : 'file', progress: 0 }))]);
  const addLink = () => { try { const url = new URL(link); setAssets((current) => [...current, { id: crypto.randomUUID(), url: url.toString(), name: url.hostname, kind: 'link', progress: 100 }]); setLink(''); } catch { toast.error('Link không hợp lệ'); } };
  const upload = async (asset: LocalAsset) => {
    if (asset.kind === 'link') return { kind: 'link', url: asset.url, name: asset.name };
    const file = asset.file!;
    const response = await fetch('/api/student/assignments/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId: exercise.id, name: file.name, contentType: file.type || 'application/octet-stream', size: file.size }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Không thể chuẩn bị tải tệp');
    await new Promise<void>((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open('PUT', data.uploadUrl); xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream'); xhr.upload.onprogress = (event) => { if (event.lengthComputable) setAssets((all) => all.map((item) => item.id === asset.id ? { ...item, progress: Math.round(event.loaded / event.total * 100) } : item)); }; xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`R2 từ chối tải tệp (HTTP ${xhr.status})`)); xhr.onerror = () => reject(new Error('R2 đang chặn upload từ mari.io. Quản trị viên cần áp dụng cấu hình CORS cho bucket bài nộp.')); xhr.send(file); });
    return { kind: asset.kind, objectKey: data.objectKey, name: file.name, contentType: file.type, size: file.size };
  };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!assets.length) return toast.error('Hãy thêm file, ảnh hoặc link bài làm'); setSubmitting(true); try { const uploaded = await Promise.all(assets.map(upload)); const response = await fetch('/api/student/assignments/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId: exercise.id, note, assets: uploaded }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Nộp bài thất bại'); toast.success(data.message); onClose(); onSuccess?.(); router.refresh(); } catch (error: any) { toast.error(error.message || 'Nộp bài thất bại'); } finally { setSubmitting(false); } };
  return <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{previousSubmission ? 'Cập nhật bài nộp' : 'Nộp bài tập'} · {exercise.title}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={submitting} onClick={() => fileRef.current?.click()}><FileUp className="mr-2 h-4 w-4" />Chọn file/ảnh</Button><Button type="button" variant="outline" disabled={submitting} onClick={() => cameraRef.current?.click()}><Camera className="mr-2 h-4 w-4" />Chụp ảnh</Button><input ref={fileRef} className="hidden" type="file" multiple onChange={(e) => addFiles(e.target.files)} /><input ref={cameraRef} className="hidden" type="file" accept="image/*" capture="environment" multiple onChange={(e) => addFiles(e.target.files)} /></div><div className="flex gap-2"><Input type="url" value={link} disabled={submitting} onChange={(e) => setLink(e.target.value)} placeholder="Dán link Google Drive, Docs, Canva…" /><Button type="button" variant="outline" onClick={addLink} disabled={submitting || !link}><Plus className="h-4 w-4" /></Button></div>{assets.length > 0 && <div className="space-y-2 rounded-lg border p-2">{assets.map((asset) => <div key={asset.id} className="flex items-center gap-2 text-xs"><span className="min-w-0 flex-1 truncate">{asset.kind === 'link' ? <Link2 className="mr-1 inline h-3 w-3" /> : null}{asset.name}</span>{submitting && asset.kind !== 'link' && <span>{asset.progress}%</span>}<button type="button" disabled={submitting} onClick={() => setAssets((all) => all.filter((item) => item.id !== asset.id))}><X className="h-4 w-4" /></button></div>)}</div>}<p className="text-[11px] text-zinc-500">Ảnh được giữ nguyên chất lượng và định dạng gốc. Tối đa 10 mục, 25 MB mỗi tệp.</p><div><Label>Nội dung/Lời nhắn cho giáo viên</Label><Textarea value={note} disabled={submitting} onChange={(e) => setNote(e.target.value)} className="mt-1" rows={3} /></div><DialogFooter><Button type="button" variant="outline" disabled={submitting} onClick={onClose}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang nộp…</> : <><Send className="mr-2 h-4 w-4" />Gửi bài nộp</>}</Button></DialogFooter></form></DialogContent></Dialog>;
}
