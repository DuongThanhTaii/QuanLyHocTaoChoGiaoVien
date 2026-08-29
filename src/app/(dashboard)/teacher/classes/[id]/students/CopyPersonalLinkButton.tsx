'use client';

import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CopyPersonalLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Đã sao chép link liên kết cá nhân!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Không thể sao chép link.');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      title="Sao chép link liên kết cá nhân"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4 text-zinc-500" />}
      <span className="sr-only">Sao chép link liên kết</span>
    </Button>
  );
}
