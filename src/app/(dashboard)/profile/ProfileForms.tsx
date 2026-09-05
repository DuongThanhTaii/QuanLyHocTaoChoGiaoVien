'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateProfile, updatePayOS, addBankAccount, deleteBankAccount, setDefaultBankAccount, changePassword, activateCassoReconciliation, activateCassoForBankAccount, disconnectCasso, getCassoAccounts, getCassoReconciliationQueue, resolveCassoReconciliation } from './actions';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2, Eye, EyeOff, CheckCircle2, XCircle, Copy, Link2, ShieldCheck, Unplug, Loader2, Check, X, BadgeCheck } from 'lucide-react';
import { VIETNAM_BANKS } from '@/lib/banks';
import { UserAvatar } from '@/components/ui/UserAvatar';

type FormActionState = { error: string; success: boolean; message: string; startCassoConnection?: boolean; bankAccountId?: string };
const initialState: FormActionState = { error: '', success: false, message: '' };
const PAYOS_WEBHOOK_URL = 'https://mari.io.vn/api/webhooks/payos';

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
      <form id="profile-form" action={formAction}>
        <CardContent className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Email đăng nhập (Không thể thay đổi)</Label>
          <Input disabled value={profile?.email || ''} className="bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ''} required disabled={!isEditing} className={!isEditing ? 'bg-muted text-muted-foreground' : ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" name="phone" defaultValue={profile?.phone || ''} disabled={!isEditing} className={!isEditing ? 'bg-muted text-muted-foreground' : ''} />
          </div>
        </CardContent>
      </form>
      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button form="profile-form" type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>Hủy</Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
          )}
        </div>
        
        <ChangePasswordModal />
      </CardFooter>
    </Card>
  );
}

export function ChangePasswordModal() {
  const [state, formAction, isPending] = useActionState(changePassword as any, initialState);
  const [isOpen, setIsOpen] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  useEffect(() => {
    if (state?.success && state?.message) {
      toast.success(state.message);
      handleOpenChange(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const hasTypedBoth = newPassword.length > 0 && confirmPassword.length > 0;
  const isMatch = hasTypedBoth && newPassword === confirmPassword;
  const isMismatch = hasTypedBoth && newPassword !== confirmPassword;
  const isTooShort = newPassword.length > 0 && newPassword.length < 6;

  const canSubmit = !isPending && oldPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" type="button" />}>
        Đổi mật khẩu
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="space-y-4 pt-2">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input 
                  id="oldPassword" 
                  name="oldPassword" 
                  type={showOldPassword ? "text" : "password"} 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  tabIndex={-1}
                  title={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  name="newPassword" 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  tabIndex={-1}
                  title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isTooShort && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Mật khẩu mới phải có ít nhất 6 ký tự
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required 
                  className={`pr-10 transition-colors ${
                    isMatch ? 'border-emerald-500 focus-visible:ring-emerald-500/20' : 
                    isMismatch ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  tabIndex={-1}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isMatch && (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in-0 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mật khẩu đã khớp
                </p>
              )}
              {isMismatch && (
                <p className="text-xs font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in-0 duration-200">
                  <XCircle className="w-3.5 h-3.5" />
                  Mật khẩu xác nhận không khớp
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>Hủy</Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? 'Đang đổi...' : 'Xác nhận đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export function BankAccountsList({ accounts, cassoConnection }: { accounts: any[]; cassoConnection: CassoConnection }) {
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

  const handleActivateReconciliation = async (id: string) => {
    if (!cassoConnection || cassoConnection.status === 'revoked') {
      window.location.assign(`/api/casso/connect?bankAccountId=${encodeURIComponent(id)}`);
      return;
    }
    try {
      await activateCassoForBankAccount(id);
      toast.success('Đã chuyển đối soát sang tài khoản này.');
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể bật đối soát.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài khoản nhận tiền</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngân hàng</TableHead>
              <TableHead>Số tài khoản</TableHead>
              <TableHead>Tên chủ TK</TableHead>
              <TableHead>Đối soát</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  Chưa có tài khoản nào được thêm.
                </TableCell>
              </TableRow>
            )}
            {accounts.map(acc => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium">{acc.bank_name}</TableCell>
                <TableCell>{acc.account_number}</TableCell>
                <TableCell>{acc.account_name}</TableCell>
                <TableCell>
                  {cassoConnection?.status === 'active' && cassoConnection.bank_account_id === acc.id ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-emerald-600 dark:text-emerald-400"><BadgeCheck className="size-4" />Đang đối soát</span>
                  ) : (
                    <button type="button" onClick={() => handleActivateReconciliation(acc.id)} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline"><Link2 className="size-3.5" />Dùng để đối soát</button>
                  )}
                </TableCell>
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

export function AddBankAccountForm({ isTeacher }: { isTeacher: boolean }) {
  const [state, formAction, isPending] = useActionState(addBankAccount as any, initialState);
  const [key, setKey] = useState(Date.now()); // to reset form
  const [selectedBank, setSelectedBank] = useState<string>('');

  useEffect(() => {
    if (state?.success && state?.message) {
      toast.success(state.message);
      if (state.startCassoConnection && state.bankAccountId) {
        window.location.assign(`/api/casso/connect?bankAccountId=${encodeURIComponent(state.bankAccountId)}`);
        return;
      }
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
        <CardDescription>{isTeacher ? 'STK đầu tiên sẽ được kết nối Casso để bật tự động đối soát.' : 'Nhập chính xác thông tin ngân hàng của bạn.'}</CardDescription>
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
          <Button type="submit" disabled={isPending} className="h-12 w-full text-md">{isPending ? 'Đang thêm...' : isTeacher ? 'Thêm & bật đối soát' : 'Thêm tài khoản'}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

type CassoConnection = { status?: string; bank_account_id?: string | null; last_synced_at?: string | null; last_error?: string | null } | null;
type CassoAccount = { id: string; accountNumber: string; accountName: string; bankName: string; connected: boolean };

export function CassoConnectionCard({ connection, bankAccounts }: { connection: CassoConnection; bankAccounts: any[] }) {
  const [accounts, setAccounts] = useState<CassoAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankAccountId, setBankAccountId] = useState(connection?.bank_account_id || '');
  const [cassoAccountId, setCassoAccountId] = useState('');
  const [queue, setQueue] = useState<Array<any>>([]);
  const active = connection?.status === 'active';

  useEffect(() => {
    if (!connection || connection.status === 'revoked') return;
    setLoading(true);
    getCassoAccounts().then(setAccounts).catch((error) => toast.error(error instanceof Error ? error.message : 'Không thể tải tài khoản Casso.')).finally(() => setLoading(false));
  }, [connection?.status]);

  const refreshQueue = () => getCassoReconciliationQueue().then(setQueue).catch(() => setQueue([]));
  useEffect(() => { if (active) refreshQueue(); }, [active]);

  const enable = async () => {
    if (!bankAccountId || !cassoAccountId) return toast.error('Hãy chọn STK nhận học phí và tài khoản tương ứng trên Casso.');
    setSaving(true);
    try {
      await activateCassoReconciliation(bankAccountId, cassoAccountId);
      toast.success('Đã bật tự động đối soát học phí.');
      window.location.reload();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể bật đối soát.'); }
    finally { setSaving(false); }
  };

  const disconnect = async () => {
    setSaving(true);
    try { await disconnectCasso(); toast.success('Đã ngắt kết nối Casso.'); window.location.reload(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể ngắt kết nối.'); }
    finally { setSaving(false); }
  };

  const resolveQueue = async (id: string, accept: boolean) => {
    setSaving(true);
    try { await resolveCassoReconciliation(id, accept); toast.success(accept ? 'Đã xác nhận gạch nợ.' : 'Đã bỏ qua giao dịch.'); await refreshQueue(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể xử lý giao dịch.'); }
    finally { setSaving(false); }
  };

  return (
    <Card className="overflow-hidden border-primary/25">
      <CardHeader className="border-b border-primary/10 bg-primary/[0.035]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Link2 className="size-5" /></span>
            <div><CardTitle className="text-lg">Tự động đối soát học phí</CardTitle><CardDescription className="mt-1">Kết nối Casso một lần để Mari tự gạch nợ khi phụ huynh chuyển khoản đúng nội dung.</CardDescription></div>
          </div>
          {active && <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><ShieldCheck className="size-3.5" />Đang bật</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {!connection || connection.status === 'revoked' ? (
          <div className="space-y-3"><p className="text-sm text-muted-foreground">Mari không cần API key PayOS của bạn. Bạn sẽ xác nhận quyền đọc biến động giao dịch trực tiếp với Casso/Cas ID.</p><a href="/api/casso/connect" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><Link2 className="mr-2 size-4" />Kết nối Casso</a></div>
        ) : (
          <>
            {connection.last_error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{connection.last_error}</p>}
            <p className="text-sm text-muted-foreground">{active ? 'Mari chỉ đối soát giao dịch tiền vào của tài khoản đã chọn; tiền vẫn chuyển thẳng vào STK của bạn.' : 'Chọn đúng tài khoản bạn đã liên kết trên Casso để hoàn tất thiết lập.'}</p>
            {!active && <div className="grid gap-3"><div className="space-y-1.5"><Label>STK nhận học phí trong Mari</Label><Select value={bankAccountId} onValueChange={(value) => setBankAccountId(value || '')}><SelectTrigger><SelectValue placeholder="Chọn STK đã thêm" /></SelectTrigger><SelectContent>{bankAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.bank_name} · {account.account_number}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Tài khoản đã liên kết trên Casso</Label><Select value={cassoAccountId} onValueChange={(value) => setCassoAccountId(value || '')} disabled={loading}><SelectTrigger><SelectValue placeholder={loading ? 'Đang tải từ Casso…' : 'Chọn tài khoản Casso'} /></SelectTrigger><SelectContent>{accounts.filter((account) => account.connected).map((account) => <SelectItem key={account.id} value={account.id}>{account.bankName} · {account.accountNumber}</SelectItem>)}</SelectContent></Select></div>{!bankAccounts.length && <p className="text-xs text-amber-700 dark:text-amber-400">Hãy thêm STK nhận tiền trước khi bật đối soát.</p>}</div>}
          </>
        )}
      </CardContent>
      {active && queue.length > 0 && <div className="border-t border-border px-6 py-4"><p className="mb-3 text-sm font-semibold">Giao dịch cần xác nhận</p><div className="space-y-2">{queue.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-amber-300/60 bg-amber-50/60 p-3 text-sm dark:bg-amber-950/20 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-medium">{Number(item.amount).toLocaleString('vi-VN')} đ {item.invoice?.invoice_number ? `· ${item.invoice.invoice_number}` : ''}</p><p className="truncate text-xs text-muted-foreground">{item.transfer_content || item.reason}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={saving} onClick={() => resolveQueue(item.id, false)}><X className="mr-1 size-3.5" />Bỏ qua</Button>{item.invoice && <Button size="sm" disabled={saving} onClick={() => resolveQueue(item.id, true)}><Check className="mr-1 size-3.5" />Xác nhận</Button>}</div></div>)}</div></div>}
      {connection && connection.status !== 'revoked' && <CardFooter className="justify-between border-t border-border bg-muted/30"><span className="text-xs text-muted-foreground">{active && connection.last_synced_at ? `Đã kích hoạt ${new Date(connection.last_synced_at).toLocaleDateString('vi-VN')}` : 'Quyền truy cập có thể thu hồi bất cứ lúc nào.'}</span>{active ? <Button type="button" variant="outline" size="sm" disabled={saving} onClick={disconnect}><Unplug className="mr-2 size-3.5" />Ngắt kết nối</Button> : <Button type="button" size="sm" disabled={saving || loading || !bankAccounts.length} onClick={enable}>{saving && <Loader2 className="mr-2 size-3.5 animate-spin" />}Bật tự động đối soát</Button>}</CardFooter>}
    </Card>
  );
}

export function PayOSConfigForm({ profile }: { profile: any }) {
  const [state, formAction, isPending] = useActionState(updatePayOS as any, initialState);
  const [isExpanded, setIsExpanded] = useState(!!profile?.payos_client_id);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(PAYOS_WEBHOOK_URL);
      toast.success('Đã sao chép URL webhook PayOS.');
    } catch {
      toast.error('Không thể sao chép URL. Vui lòng sao chép thủ công.');
    }
  };

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
        <form action={formAction} autoComplete="off">
          {/* Decoy fields to trap browser credential autofill heuristics */}
          <div aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}>
            <input type="text" name="fake_username_remember" tabIndex={-1} autoComplete="username" />
            <input type="password" name="fake_password_remember" tabIndex={-1} autoComplete="current-password" />
          </div>

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
                      <code className="min-w-0 flex-1 text-xs text-blue-600 font-mono break-all">{PAYOS_WEBHOOK_URL}</code>
                      <Button type="button" variant="outline" size="sm" onClick={copyWebhookUrl} className="shrink-0">
                        <Copy className="mr-1.5 size-3.5" />Sao chép
                      </Button>
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
                  <Label htmlFor="payos_client_id">Client ID</Label>
                  <Input 
                    id="payos_client_id" 
                    name="clientId" 
                    defaultValue={profile?.payos_client_id || ''} 
                    placeholder="Nhập Client ID..." 
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payos_api_key">API Key</Label>
                  <div className="relative">
                    <Input 
                      id="payos_api_key" 
                      name="apiKey" 
                      type={showApiKey ? "text" : "password"} 
                      defaultValue={profile?.payos_api_key || ''} 
                      placeholder="Nhập API Key..." 
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      title={showApiKey ? "Ẩn API Key" : "Hiện API Key"}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payos_checksum_key">Checksum Key</Label>
                  <div className="relative">
                    <Input 
                      id="payos_checksum_key" 
                      name="checksumKey" 
                      type={showChecksum ? "text" : "password"} 
                      defaultValue={profile?.payos_checksum_key || ''} 
                      placeholder="Nhập Checksum Key..." 
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChecksum(!showChecksum)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      title={showChecksum ? "Ẩn Checksum Key" : "Hiện Checksum Key"}
                    >
                      {showChecksum ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
