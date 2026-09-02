'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateProfile, updatePayOS, addBankAccount, deleteBankAccount, setDefaultBankAccount } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2 } from 'lucide-react';
import { VIETNAM_BANKS } from '@/lib/banks';
import { UserAvatar } from '@/components/ui/UserAvatar';

const initialState = { error: '', success: false, message: '' };

export function BasicProfileForm({ profile }: { profile: any }) {
  const [state, formAction, isPending] = useActionState(updateProfile as any, initialState);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (state?.success && state?.message) {
      toast.success(state.message);
      setIsEditing(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <UserAvatar name={profile?.full_name} email={profile?.email} size="xl" className="shadow-xs" />
          <div>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật họ tên và số điện thoại liên lạc.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Email đăng nhập (Không thể thay đổi)</Label>
            <Input disabled value={profile?.email || ''} className="bg-zinc-100" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ''} required disabled={!isEditing} className={!isEditing ? 'bg-zinc-50 text-zinc-600' : ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" name="phone" defaultValue={profile?.phone || ''} disabled={!isEditing} className={!isEditing ? 'bg-zinc-50 text-zinc-600' : ''} />
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t border-zinc-100">
          {isEditing ? <div className="flex gap-2"><Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Button><Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>Hủy</Button></div> : <Button type="button" onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>}
        </CardFooter>
      </form>
    </Card>
  );
}

export function BankAccountsList({ accounts }: { accounts: any[] }) {
  const handleSetDefault = async (id: string) => {
    const res = await setDefaultBankAccount(id);
    if (res.error) toast.error(res.error);
    else toast.success('Đã thay đổi tài khoản mặc định');
  };

  const handleDelete = async (id: string) => {
    const res = await deleteBankAccount(id);
    if (res.error) toast.error(res.error);
    else toast.success('Đã xóa tài khoản');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài khoản nhận tiền</CardTitle>
        <CardDescription>
          Thêm số tài khoản ngân hàng để hệ thống tự động sinh mã VietQR cho học sinh thanh toán.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngân hàng</TableHead>
              <TableHead>Số tài khoản</TableHead>
              <TableHead>Tên chủ TK</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500 py-6">
                  Chưa có tài khoản nào được thêm.
                </TableCell>
              </TableRow>
            )}
            {accounts.map(acc => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.bank_name}</TableCell>
                <TableCell>{acc.account_number}</TableCell>
                <TableCell>{acc.account_name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    {acc.is_default ? (
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                    ) : (
                      <button 
                        onClick={() => handleSetDefault(acc.id)}
                        className="text-zinc-400 hover:text-yellow-500 transition-colors shrink-0 flex items-center justify-center"
                        title="Đặt làm mặc định"
                      >
                        <Star className="w-5 h-5" />
                      </button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger className="text-zinc-400 hover:text-red-500 transition-colors shrink-0 flex items-center justify-center" title="Xóa tài khoản">
                        <Trash2 className="w-5 h-5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tài khoản {acc.bank_name} - {acc.account_number}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(acc.id)}>Đồng ý xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AddBankAccountForm() {
  const [state, formAction, isPending] = useActionState(addBankAccount as any, initialState);
  const [key, setKey] = useState(Date.now()); // to reset form
  const [selectedBank, setSelectedBank] = useState<string>('');

  useEffect(() => {
    if (state?.success && state?.message) {
      toast.success(state.message);
      setKey(Date.now()); // reset form
      setSelectedBank('');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const bankInfo = VIETNAM_BANKS.find(b => b.shortName === selectedBank);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm tài khoản mới</CardTitle>
        <CardDescription>Nhập chính xác thông tin ngân hàng của bạn.</CardDescription>
      </CardHeader>
      <form action={formAction} key={key}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Ngân hàng</Label>
            <Select name="bankName" required value={selectedBank} onValueChange={(val) => setSelectedBank(val || '')}>
              <SelectTrigger className="w-full h-12">
                {bankInfo ? (
                  <div className="flex items-center gap-2">
                    <img src={bankInfo.logo} alt={bankInfo.shortName} className="w-8 h-8 object-contain rounded-sm bg-white" />
                    <span className="font-medium text-zinc-900">{bankInfo.shortName}</span>
                  </div>
                ) : (
                  <span className="text-zinc-500">Chọn ngân hàng...</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {VIETNAM_BANKS.map((bank) => (
                  <SelectItem key={bank.bin} value={bank.shortName}>
                    <div className="flex items-center gap-3">
                      <img src={bank.logo} alt={bank.shortName} className="w-8 h-8 object-contain rounded-sm bg-white" />
                      <span className="font-medium">{bank.shortName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Số tài khoản</Label>
            <Input id="accountNumber" name="accountNumber" className="h-12 text-lg" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Tên chủ tài khoản (In hoa không dấu)</Label>
            <Input id="accountName" name="accountName" className="h-12 text-lg uppercase" placeholder="NGUYEN VAN A" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full h-12 text-md">
            {isPending ? 'Đang thêm...' : 'Thêm tài khoản'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function PayOSConfigForm({ profile }: { profile: any }) {
  const [state, formAction, isPending] = useActionState(updatePayOS as any, initialState);
  const [isExpanded, setIsExpanded] = useState(!!profile?.payos_client_id);

  useEffect(() => {
    if (state?.success && state?.message) {
      toast.success(state.message);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="border-zinc-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Tự động hóa Webhook (Dành cho Pro)</CardTitle>
            <CardDescription>Liên kết API Key từ PayOS.vn để hệ thống tự động gạch nợ hóa đơn.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Đóng' : 'Cấu hình'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <form action={formAction}>
          <CardContent className="space-y-6 pt-2 border-t border-zinc-100">
            {/* Hướng dẫn cài đặt */}
            <div className="space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Hướng dẫn cài đặt PayOS</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                
                {/* Step 1 */}
                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 ring-4 ring-white dark:ring-zinc-950 z-10">1</div>
                  <div className="flex-1 space-y-2 pt-1">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Tạo dự án trên PayOS</h4>
                    <p className="text-sm text-zinc-500">Đăng nhập vào <a href="https://payos.vn" target="_blank" className="text-blue-600 hover:underline">payos.vn</a>, tạo một Kênh thanh toán (Dự án) mới.</p>
                    <div className="bg-zinc-100 dark:bg-zinc-800 h-40 rounded-lg flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
                      <span className="text-zinc-400 text-sm italic">Chèn hình ảnh minh họa bước 1 vào đây</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 ring-4 ring-white dark:ring-zinc-950 z-10">2</div>
                  <div className="flex-1 space-y-2 pt-1">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Lấy API Keys</h4>
                    <p className="text-sm text-zinc-500">Vào phần <strong>Cài đặt</strong> của kênh thanh toán vừa tạo. Sao chép 3 thông số: <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-xs text-rose-600">Client ID</span>, <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-xs text-rose-600">API Key</span>, và <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-xs text-rose-600">Checksum Key</span> điền vào Form bên dưới.</p>
                    <div className="bg-zinc-100 dark:bg-zinc-800 h-40 rounded-lg flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
                      <span className="text-zinc-400 text-sm italic">Chèn hình ảnh minh họa bước 2 vào đây</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 ring-4 ring-white dark:ring-zinc-950 z-10">3</div>
                  <div className="flex-1 space-y-2 pt-1">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Thiết lập Webhook</h4>
                    <p className="text-sm text-zinc-500">Cũng tại trang Cài đặt của PayOS, tìm mục <strong>Cấu hình Webhook</strong>, dán đường dẫn dưới đây vào và bấm <strong>Xác nhận</strong>:</p>
                    <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-md">
                      <code className="text-xs text-blue-600 font-mono break-all">https://giasupro.taidt.id.vn/api/webhooks/payos</code>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 h-40 rounded-lg flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
                      <span className="text-zinc-400 text-sm italic">Chèn hình ảnh minh họa bước 3 vào đây</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Điền thông tin API Key</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input id="clientId" name="clientId" defaultValue={profile?.payos_client_id || ''} placeholder="Nhập Client ID..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" name="apiKey" type="password" defaultValue={profile?.payos_api_key || ''} placeholder="Nhập API Key..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checksumKey">Checksum Key</Label>
                  <Input id="checksumKey" name="checksumKey" type="password" defaultValue={profile?.payos_checksum_key || ''} placeholder="Nhập Checksum Key..." />
                </div>
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 py-4 mt-4">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Đang lưu...' : 'Lưu Cấu Hình PayOS'}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
