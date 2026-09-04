'use client';

import { useRef, useState } from 'react';
import { PencilLine, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BillingMode, BillingPlan } from '@/lib/billing/types';
import { updateBillingMode, updatePlan } from './actions';

export function PlansEditor({ plans, billingMode }: { plans: BillingPlan[]; billingMode: BillingMode }) {
  return <><BillingModeEditor mode={billingMode} /><div className="grid gap-5 xl:grid-cols-2">{plans.map((plan) => <PlanEditor key={plan.id} plan={plan} />)}</div></>;
}

function BillingModeEditor({ mode }: { mode: BillingMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const cancel = () => { formRef.current?.reset(); setIsEditing(false); };
  return <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Chế độ thanh toán nền tảng</p><p className="text-sm text-muted-foreground">Chỉ thay đổi sau khi bấm Chỉnh sửa, sau đó xác nhận bằng Lưu thay đổi.</p></div><form ref={formRef} action={updateBillingMode} className="flex flex-wrap items-center gap-2"><select name="mode" defaultValue={mode} disabled={!isEditing} className="h-9 rounded-md border bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"><option value="paid">Thu phí đang bật</option><option value="free_access">Mở quyền miễn phí</option></select>{isEditing ? <><Button type="button" variant="outline" size="sm" onClick={cancel}><X className="mr-2 size-4" />Hủy</Button><Button size="sm"><Save className="mr-2 size-4" />Lưu thay đổi</Button></> : <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}><PencilLine className="mr-2 size-4" />Chỉnh sửa</Button>}</form></CardContent></Card>;
}

function PlanEditor({ plan }: { plan: BillingPlan }) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const tone = plan.code === 'free' ? 'border-emerald-300 bg-emerald-100/80 dark:border-emerald-700 dark:bg-emerald-950/60' : plan.code === 'pro' ? 'border-blue-300 bg-blue-100/80 dark:border-blue-700 dark:bg-blue-950/60' : plan.code === 'max' ? 'border-violet-300 bg-violet-100/80 dark:border-violet-700 dark:bg-violet-950/60' : 'border-amber-300 bg-amber-100/80 dark:border-amber-700 dark:bg-amber-950/60';
  const cancel = () => { formRef.current?.reset(); setIsEditing(false); };
  return <form ref={formRef} action={updatePlan}><Card className={tone}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{plan.code === 'enterprise' ? 'Doanh nghiệp' : plan.name}</CardTitle><CardDescription className="mt-1">{plan.code === 'enterprise' ? 'Dùng cho báo giá và hợp đồng riêng.' : 'Quota được kiểm tra tại database.'}</CardDescription></div><Badge variant={plan.isActive ? 'secondary' : 'outline'}>{plan.isActive ? 'Đang bán' : 'Tạm ẩn'}</Badge></div></CardHeader><CardContent className="space-y-4"><input type="hidden" name="planId" value={plan.id} /><fieldset disabled={!isEditing} className="space-y-4 disabled:opacity-75"><div className="grid gap-3 sm:grid-cols-2"><Field label="Tên gói" name="name" defaultValue={plan.name} /><Field label="Trạng thái" name="isActive" type="select" defaultValue={String(plan.isActive)} options={[["true", "Đang bán"], ["false", "Tạm ẩn"]]} /><Field label="Giá tháng (đ)" name="monthlyPrice" type="number" defaultValue={plan.monthlyPrice} /><Field label="Giá năm (đ)" name="yearlyPrice" type="number" defaultValue={plan.yearlyPrice} /><Field label="Lớp hoạt động" name="maxClasses" type="number" defaultValue={plan.entitlements.maxClasses ?? 0} /><Field label="Học sinh / lớp" name="maxStudentsPerClass" type="number" defaultValue={plan.entitlements.maxStudentsPerClass ?? 0} /><Field label="Chat hoạt động" name="maxActiveConversations" type="number" defaultValue={plan.entitlements.maxActiveConversations ?? 0} /><Field label="Lưu trữ (GB)" name="maxStorageGb" type="number" defaultValue={plan.entitlements.maxStorageGb ?? 0} /></div><label className="grid gap-1.5 text-sm font-medium">Mô tả<textarea name="description" defaultValue={plan.description ?? ''} className="min-h-16 rounded-md border bg-background px-3 py-2 text-sm font-normal" /></label></fieldset>{isEditing ? <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={cancel}><X className="mr-2 size-4" />Hủy</Button><Button className="flex-1"><Save className="mr-2 size-4" />Lưu thay đổi</Button></div> : <Button type="button" variant="outline" className="w-full" onClick={() => setIsEditing(true)}><PencilLine className="mr-2 size-4" />Chỉnh sửa</Button>}</CardContent></Card></form>;
}

function Field({ label, name, type = 'text', defaultValue, options }: { label: string; name: string; type?: 'text' | 'number' | 'select'; defaultValue: string | number; options?: [string, string][] }) {
  return <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">{label}{type === 'select' ? <select name={name} defaultValue={String(defaultValue)} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground">{options?.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : <input name={name} type={type} min={type === 'number' ? 0 : undefined} defaultValue={defaultValue} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" />}</label>;
}
