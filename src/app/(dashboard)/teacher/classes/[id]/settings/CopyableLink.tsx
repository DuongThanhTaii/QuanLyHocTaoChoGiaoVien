'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function CopyableLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Đã sao chép liên kết');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Không thể sao chép');
    }
  };

  return (
    <div 
      onClick={handleCopy}
      className="group flex items-center justify-center gap-2 mt-4 cursor-pointer p-2 hover:bg-zinc-100 rounded-md transition-colors w-full max-w-[280px]"
      title="Nhấn để sao chép"
    >
      <p className="break-all text-xs text-zinc-500 text-center">{url}</p>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
}
