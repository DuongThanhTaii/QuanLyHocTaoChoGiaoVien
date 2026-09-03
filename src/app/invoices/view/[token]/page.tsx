import { createClient } from '@/infrastructure/auth/supabase/server';
import { notFound } from 'next/navigation';
import { generateVietQrUrl } from '@/lib/vietqr';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, Calendar, User, BookOpen, QrCode, Phone, Mail, Sparkles } from 'lucide-react';
import { PublicInvoiceClientActions } from './client-actions';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicInvoiceViewPage({ params }: Props) {
  const { token } = await params;
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Kiểm tra token có phải UUID hợp lệ không
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  
  let query = supabaseAdmin
    .from('invoices')
    .select(`
      *,
      students:student_id (
        id,
        full_name,
        phone,
        email
      ),
      classes:class_id (
        id,
        name,
        subject
      ),
      profiles:teacher_id (
        id,
        full_name,
        phone,
        email,
        avatar_url
      )
    `);

  if (isUuid) {
    query = query.or(`id.eq.${token},payment_token.eq.${token},notes.ilike.%${token}%`);
  } else {
    query = query.or(`payment_token.eq.${token},notes.ilike.%${token}%`);
  }

  const { data: invoiceData, error } = await query.single();

  if (error || !invoiceData) {
    notFound();
  }

  const invoice = invoiceData;
  const teacher = Array.isArray(invoice.profiles) ? invoice.profiles[0] : invoice.profiles;
  const student = Array.isArray(invoice.students) ? invoice.students[0] : invoice.students;
  const classroom = Array.isArray(invoice.classes) ? invoice.classes[0] : invoice.classes;

  // 2. Lấy tài khoản ngân hàng của giáo viên
  const { data: bankAccount } = await supabaseAdmin
    .from('bank_accounts')
    .select('*')
    .eq('user_id', invoice.teacher_id)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Parse notes nếu có metadata
  let lineItems: any[] = [];
  let customNotes: string | null = null;
  let templateSnapshot: any = null;

  if (invoice.notes) {
    try {
      if (invoice.notes.startsWith('{')) {
        const parsed = JSON.parse(invoice.notes);
        lineItems = parsed.line_items || [];
        customNotes = parsed.custom_notes || null;
        templateSnapshot = parsed.template_snapshot || null;
      } else if (invoice.notes.startsWith('[')) {
        lineItems = JSON.parse(invoice.notes);
      } else {
        customNotes = invoice.notes;
      }
    } catch (e) {
      customNotes = invoice.notes;
    }
  }

  if (lineItems.length === 0) {
    lineItems = [{
      description: 'Học phí khóa học',
      quantity: invoice.sessions_count || 1,
      unitPrice: Number(invoice.unit_price) || Number(invoice.subtotal) || 0,
      amount: Number(invoice.subtotal) || Number(invoice.total_amount) || 0
    }];
  }

  const brandName = templateSnapshot?.brandName || teacher?.full_name || 'Mari Education';
  const logoUrl = templateSnapshot?.logoUrl || null;
  const contactPhone = templateSnapshot?.contactPhone || teacher?.phone || '';
  const contactEmail = templateSnapshot?.contactEmail || teacher?.email || '';
  const noteMessage = templateSnapshot?.noteMessage || 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!';
  const themeColor = templateSnapshot?.themeColor || '#3B82F6';
  const showAttendance = templateSnapshot?.showAttendanceLog !== false;

  const isPaid = invoice.status === 'paid';

  // Tạo URL VietQR
  const vietQrUrl = bankAccount ? generateVietQrUrl({
    bankName: bankAccount.bank_name,
    accountNumber: bankAccount.account_number,
    accountName: bankAccount.account_name,
    amount: Number(invoice.total_amount),
    memo: `${invoice.invoice_number}`
  }) : null;

  // Lấy danh sách điểm danh chi tiết nếu bật hiển thị
  let attendanceList: any[] = [];
  if (showAttendance) {
    const { data: attData } = await supabaseAdmin
      .from('attendance_records')
      .select('session_id, status, note, class_sessions(session_date, title)')
      .eq('student_id', invoice.student_id)
      .eq('class_id', invoice.class_id)
      .gte('marked_at', invoice.period_start)
      .lte('marked_at', invoice.period_end + 'T23:59:59');

    attendanceList = attData || [];
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Banner trạng thái */}
        {isPaid && (
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Hóa đơn đã được thanh toán</h3>
              <p className="text-emerald-50 text-sm">
                Vào lúc {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString('vi-VN') : 'Đã ghi nhận'}
              </p>
            </div>
          </div>
        )}


        {/* Thẻ Phiếu Thu Chính */}
        <Card className="border-0 shadow-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {/* Header Thương hiệu Giáo viên */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-12 h-12 object-contain mix-blend-multiply dark:mix-blend-normal"
                  />
                )}
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{brandName}</h2>
                  {contactPhone && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-zinc-400" /> {contactPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">
                  {invoice.invoice_number}
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  Ngày tạo: {new Date(invoice.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Thông tin Học sinh & Lớp học */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" /> Học sinh:
                </span>
                <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {student?.full_name || 'Học sinh'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-zinc-400" /> Lớp học:
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {classroom?.name || 'Lớp học'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" /> Kỳ tính phí:
                </span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {new Date(invoice.period_start).toLocaleDateString('vi-VN')} – {new Date(invoice.period_end).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" /> Hạn thanh toán:
                </span>
                <span className="font-bold text-amber-600">
                  {new Date(invoice.due_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Bảng kê chi phí */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-zinc-100 dark:bg-zinc-800/80">
                  <TableRow>
                    <TableHead className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nội dung khoản thu</TableHead>
                    <TableHead className="text-center text-sm font-bold text-zinc-700 dark:text-zinc-300 w-16">SL</TableHead>
                    <TableHead className="text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">Đơn giá</TableHead>
                    <TableHead className="text-right text-sm font-bold text-zinc-700 dark:text-zinc-300">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={idx} className="text-sm">
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center text-zinc-600">{item.quantity}</TableCell>
                      <TableCell className="text-right text-zinc-600">
                        {Number(item.unitPrice?.amount ?? item.unitPrice ?? 0).toLocaleString('vi-VN')} đ
                      </TableCell>
                      <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100 text-base">
                        {Number(item.amount?.amount ?? item.amount ?? 0).toLocaleString('vi-VN')} đ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Chi tiết Tổng tiền */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-3 text-sm shadow-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Tạm tính:</span>
                <span className="font-semibold text-base text-zinc-900">{Number(invoice.subtotal).toLocaleString('vi-VN')} đ</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Giảm trừ / Học bổng:</span>
                  <span className="font-bold text-base">-{Number(invoice.discount).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              {Number(invoice.extra_fee) > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Phụ thu khác:</span>
                  <span className="font-bold text-base">+{Number(invoice.extra_fee).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-2 flex justify-between items-center">
                <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">Tổng tiền thanh toán:</span>
                <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                  {Number(invoice.total_amount).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Khu vực Thanh toán QR Code */}
            {!isPaid && bankAccount && vietQrUrl && (
              <div className="bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/60 rounded-3xl p-6 text-center space-y-4 shadow-sm">

                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-zinc-100 inline-block">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Thanh toán học phí"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                    />
                  </div>
                </div>



                {/* Các nút copy thông tin chuyển khoản */}
                <PublicInvoiceClientActions
                  bankName={bankAccount.bank_name}
                  accountNumber={bankAccount.account_number}
                  accountName={bankAccount.account_name}
                  amount={Number(invoice.total_amount)}
                  memo={invoice.invoice_number}
                />
              </div>
            )}

            {/* Ghi chú & Lời cảm ơn */}
            {customNotes && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/50 text-xs text-amber-900 dark:text-amber-200">
                <b>Ghi chú từ thầy/cô:</b> {customNotes}
              </div>
            )}

            <div className="text-center pt-2 text-xs text-zinc-400 italic">
              "{noteMessage}"
            </div>

          </CardContent>
        </Card>

        <div className="text-center text-xs text-zinc-400">
          Nền tảng Quản lý Lớp học & Học phí Thông minh • Mari
        </div>

      </div>
    </div>
  );
}
