import { CircleDollarSign, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionsPage() {
  return <div className="space-y-6"><div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Subscription</h1><p className="mt-1 text-sm text-muted-foreground">Theo dõi trial, gia hạn, trạng thái thanh toán và ngoại lệ hỗ trợ.</p></div><Button disabled variant="outline"><RefreshCw className="mr-2 size-4" />Đồng bộ</Button></div><Card><CardHeader><CardTitle>Danh sách subscription</CardTitle><CardDescription>Dữ liệu thật sẽ lấy từ `subscriptions`, `plans` và giao dịch thanh toán.</CardDescription></CardHeader><CardContent><div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center"><CircleDollarSign className="size-8 text-muted-foreground" /><p className="font-medium">Chưa có dữ liệu subscription</p><Badge variant="outline">Đợi kết nối Supabase</Badge></div></CardContent></Card></div>;
}
