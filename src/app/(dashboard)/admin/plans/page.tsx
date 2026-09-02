import { CalendarClock, PencilLine, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
  ['Miễn phí', '0 đ', '0 đ', '5 học sinh · 2 lớp'],
  ['Pro', '99.000 đ', '950.000 đ', '50 học sinh · 10 lớp'],
  ['Premium', '199.000 đ', '1.900.000 đ', '200 học sinh · Không giới hạn lớp'],
];

export default function PlansPage() {
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight">Gói & giá cước</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý plan, hạn mức và giá áp dụng cho các chu kỳ mới.</p></div><div className="grid gap-4 lg:grid-cols-3">{plans.map(([name, monthly, yearly, features]) => <Card key={name}><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{name}</CardTitle><CardDescription className="mt-1">Dữ liệu mẫu</CardDescription></div><Tags className="size-5 text-muted-foreground" /></div></CardHeader><CardContent className="space-y-4"><div><p className="text-2xl font-bold">{monthly}<span className="text-sm font-normal text-muted-foreground"> / tháng</span></p><p className="mt-1 text-sm text-muted-foreground">{yearly} / năm</p></div><p className="rounded-md bg-muted px-3 py-2 text-sm">{features}</p><Button disabled variant="outline" className="w-full"><PencilLine className="mr-2 size-4" />Điều chỉnh giá</Button></CardContent></Card>)}</div><Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="size-5" />Quy tắc áp dụng giá</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Mỗi lần đổi giá sẽ tạo một phiên bản mới có ngày hiệu lực. Subscription hiện tại giữ nguyên giá đến hết chu kỳ; hóa đơn luôn lưu snapshot giá lúc phát sinh.</CardContent></Card></div>;
}
