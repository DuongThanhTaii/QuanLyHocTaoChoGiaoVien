'use client';

import React, { useState } from 'react';
import { Users, Phone, Mail, Check, Copy } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface GuardianInfo {
  id?: string;
  userId?: string | null;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  relationship?: string;
}

interface ParentContactPopoverProps {
  studentName: string;
  guardians: GuardianInfo[];
}

const relationshipLabels: Record<string, string> = {
  FATHER: 'Bố',
  MOTHER: 'Mẹ',
  GUARDIAN: 'Phụ huynh',
  OTHER: 'Người giám hộ',
  'Phụ huynh': 'Phụ huynh',
  'Bố': 'Bố',
  'Mẹ': 'Mẹ',
  'Người giám hộ': 'Người giám hộ'
};

export function ParentContactPopover({ studentName, guardians }: ParentContactPopoverProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const hasGuardians = guardians && guardians.length > 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(text);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`h-8 w-8 transition-colors ${
              hasGuardians
                ? 'text-purple-600 border-purple-200 bg-purple-50/60 hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300'
                : 'text-zinc-400 border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 hover:text-zinc-600'
            }`}
            title="Thông tin phụ huynh"
          />
        }
      >
        <Users className="h-4 w-4" />
      </HoverCardTrigger>
      <HoverCardContent align="end" side="top" className="w-80 p-0 overflow-hidden shadow-xl border-zinc-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-purple-100">
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 leading-tight">Thông tin phụ huynh</h4>
            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">HS: {studentName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 bg-white">
          {!hasGuardians ? (
            <div className="py-3 text-center space-y-1.5">
              <p className="text-sm font-medium text-zinc-700">Chưa liên kết phụ huynh</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Học sinh này chưa có thông tin liên hệ phụ huynh trong hệ thống.
              </p>
            </div>
          ) : (
            guardians.map((guardian, index) => {
              const relLabel = relationshipLabels[guardian.relationship || ''] || guardian.relationship || 'Phụ huynh';
              return (
                <div
                  key={guardian.id || index}
                  className={`space-y-2.5 ${index > 0 ? 'pt-3 border-t border-zinc-100' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 text-sm truncate">
                      {guardian.fullName || 'Chưa cập nhật tên'}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {relLabel}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600">
                    {guardian.phone ? (
                      <div className="flex items-center justify-between group/phone bg-zinc-50 hover:bg-zinc-100/80 p-2 rounded-md border border-zinc-200/70 transition-colors">
                        <a
                          href={`tel:${guardian.phone}`}
                          className="flex items-center gap-2 text-zinc-800 hover:text-purple-700 font-medium"
                          title="Gọi điện"
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{guardian.phone}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(guardian.phone!, 'số điện thoại')}
                          className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-colors"
                          title="Sao chép số điện thoại"
                        >
                          {copiedField === guardian.phone ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400 p-1">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>Chưa có số điện thoại</span>
                      </div>
                    )}

                    {guardian.email ? (
                      <div className="flex items-center justify-between group/email bg-zinc-50 hover:bg-zinc-100/80 p-2 rounded-md border border-zinc-200/70 transition-colors">
                        <a
                          href={`mailto:${guardian.email}`}
                          className="flex items-center gap-2 text-zinc-800 hover:text-purple-700 font-medium truncate max-w-[210px]"
                          title="Gửi email"
                        >
                          <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">{guardian.email}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(guardian.email!, 'email')}
                          className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-colors"
                          title="Sao chép email"
                        >
                          {copiedField === guardian.email ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400 p-1">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>Chưa có email</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
