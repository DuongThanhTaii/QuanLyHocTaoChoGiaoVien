'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleDriveIcon } from '@/components/icons/GoogleDriveIcon';
import { HardDrive, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface StorageQuotaData {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

interface StorageResponse {
  isLinked: boolean;
  storageQuota?: StorageQuotaData | null;
  materialsCount?: number;
  totalMaterialsBytes?: number;
}

export function DriveStorageWidget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StorageResponse | null>(null);

  const fetchQuota = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/content/storage');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Lỗi nạp thông tin bộ nhớ:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  if (!data?.isLinked || !data.storageQuota) {
    return null;
  }

  const limitBytes = Number(data.storageQuota.limit || '16106127360');
  const usageBytes = Number(data.storageQuota.usage || '0');
  const percentUsed = limitBytes > 0 ? Math.min(100, Math.round((usageBytes / limitBytes) * 1000) / 10) : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getProgressColor = () => {
    if (percentUsed >= 90) return 'bg-red-500';
    if (percentUsed >= 75) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs bg-gradient-to-r from-blue-50/40 via-white to-zinc-50/50 dark:from-zinc-900/60 dark:via-zinc-900/30 dark:to-zinc-950">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-xs shrink-0">
              <GoogleDriveIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Dung lượng Google Drive
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    percentUsed >= 90
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      : percentUsed >= 75
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  }`}
                >
                  {percentUsed}% đã dùng
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Đã sử dụng <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatBytes(usageBytes)}</span> trên tổng số {formatBytes(limitBytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-center">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 justify-end">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{data.materialsCount || 0} tệp học liệu</span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Chiếm {formatBytes(data.totalMaterialsBytes || 0)}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuota}
              disabled={loading}
              className="h-8 text-xs text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-white"
              title="Làm mới dung lượng"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Storage Progress Bar */}
        <div className="mt-3.5 space-y-1">
          <div className="w-full h-2 bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-500 rounded-full`}
              style={{ width: `${Math.max(1, percentUsed)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 pt-0.5">
            <span>Còn trống: {formatBytes(Math.max(0, limitBytes - usageBytes))}</span>
            <span>Xóa tài liệu sẽ tự động giải phóng dung lượng trên Drive</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
