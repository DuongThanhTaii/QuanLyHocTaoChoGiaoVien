'use server';

import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { InvoiceService } from '@/application/services/invoice-generation.service';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@/domains/payment/entities/invoice';

async function getAuthenticatedTeacher() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
  }
  return { user, supabase };
}

/**
 * Lấy danh sách lớp học của giáo viên
 */
export async function getTeacherClassesAction() {
  const { user, supabase } = await getAuthenticatedTeacher();
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, subject, fee_per_session, fee_type, color')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Lấy danh sách học sinh trong một lớp
 */
export async function getClassStudentsAction(classId: string) {
  const { supabase } = await getAuthenticatedTeacher();
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      custom_fee,
      status,
      student_id,
      students:student_id (
        id,
        full_name,
        phone,
        email
      )
    `)
    .eq('class_id', classId)
    .in('status', ['ACTIVE', 'PENDING']);

  if (error) throw new Error(error.message);
  return (data || []).map((e: any) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students;
    return {
      enrollmentId: e.id,
      studentId: student?.id,
      fullName: student?.full_name || 'Học sinh',
      phone: student?.phone,
      email: student?.email,
      customFee: e.custom_fee
    };
  });
}

/**
 * Tính toán xem trước học phí của lớp trong tháng
 */
export async function getMonthlyBillingPreviewAction(classId: string, month: number, year: number) {
  const { user } = await getAuthenticatedTeacher();
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { createRepositories } = await import('@/infrastructure/persistence/supabase/repositories/index');
  const adminRepos = createRepositories(supabaseAdmin);
  const service = new InvoiceService(adminRepos.invoices, adminRepos.attendance, adminRepos.enrollments, adminRepos.classes, supabaseAdmin);

  const result = await service.getMonthlyBillingPreview(user.id, classId, month, year);
  if (result.isFailure()) {
    throw new Error(result.getError().message);
  }
  return result.getValue();
}

/**
 * Sinh hàng loạt hóa đơn cho lớp
 */
export async function generateBatchInvoicesAction(params: {
  classId: string;
  month: number;
  year: number;
  dueDate?: string;
  items: Array<{
    studentId: string;
    sessionsCount: number;
    unitPrice: number;
    discount?: number;
    extraFee?: number;
    notes?: string;
    attendanceLog?: Array<{ date: string; title?: string; status: 'present' | 'late' | 'not_marked' }>;
  }>;
}) {
  const { user, supabase } = await getAuthenticatedTeacher();
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { createRepositories } = await import('@/infrastructure/persistence/supabase/repositories/index');
  const adminRepos = createRepositories(supabaseAdmin);
  const service = new InvoiceService(adminRepos.invoices, adminRepos.attendance, adminRepos.enrollments, adminRepos.classes, supabaseAdmin);

  // Lấy template snapshot
  const { data: template } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('teacher_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .single();

  const templateSnapshot = {
    brandName: template?.brand_name || profile?.full_name || 'Mari Teacher',
    logoUrl: template?.logo_url || null,
    contactPhone: template?.contact_phone || profile?.phone || '',
    contactEmail: template?.contact_email || profile?.email || '',
    address: template?.address || '',
    noteMessage: template?.note_message || 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!',
    themeColor: template?.theme_color || '#3B82F6',
    showAttendanceLog: template?.show_attendance_log !== false
  };

  const result = await service.generateBatchInvoices({
    teacherId: user.id,
    classId: params.classId,
    month: params.month,
    year: params.year,
    dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
    items: params.items,
    templateSnapshot
  });

  if (result.isFailure()) {
    throw new Error(result.getError().message);
  }

  revalidatePath('/', 'layout');
  return { success: true, count: result.getValue().length };
}

/**
 * Tạo hóa đơn tùy biến riêng lẻ
 */
export async function createCustomInvoiceAction(params: {
  studentId: string;
  classId: string;
  periodStart: string;
  periodEnd: string;
  sessionsCount: number;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
  discount?: number;
  extraFee?: number;
  notes?: string;
  dueDate?: string;
}) {
  const { user, supabase } = await getAuthenticatedTeacher();
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { createRepositories } = await import('@/infrastructure/persistence/supabase/repositories/index');
  const adminRepos = createRepositories(supabaseAdmin);
  const service = new InvoiceService(adminRepos.invoices, adminRepos.attendance, adminRepos.enrollments, adminRepos.classes, supabaseAdmin);

  const { data: template } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('teacher_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .single();

  const templateSnapshot = {
    brandName: template?.brand_name || profile?.full_name || 'Mari Teacher',
    logoUrl: template?.logo_url || null,
    contactPhone: template?.contact_phone || profile?.phone || '',
    contactEmail: template?.contact_email || profile?.email || '',
    address: template?.address || '',
    noteMessage: template?.note_message || 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!',
    themeColor: template?.theme_color || '#3B82F6',
    showAttendanceLog: template?.show_attendance_log !== false
  };

  const result = await service.createCustomInvoice({
    teacherId: user.id,
    studentId: params.studentId,
    classId: params.classId,
    periodStart: new Date(params.periodStart),
    periodEnd: new Date(params.periodEnd),
    sessionsCount: params.sessionsCount,
    lineItems: params.lineItems,
    discount: params.discount,
    extraFee: params.extraFee,
    notes: params.notes,
    dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
    templateSnapshot
  });

  if (result.isFailure()) {
    throw new Error(result.getError().message);
  }

  revalidatePath('/', 'layout');
  return { success: true, invoiceId: result.getValue().id };
}

/**
 * Xác nhận thu tiền (Tiền mặt hoặc Chuyển khoản trực tiếp)
 */
export async function recordPaymentAction(params: {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  note?: string;
}) {
  const { user } = await getAuthenticatedTeacher();
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { createRepositories } = await import('@/infrastructure/persistence/supabase/repositories/index');
  const adminRepos = createRepositories(supabaseAdmin);
  const service = new InvoiceService(adminRepos.invoices, adminRepos.attendance, adminRepos.enrollments, adminRepos.classes, supabaseAdmin);

  const result = await service.recordPayment({
    invoiceId: params.invoiceId,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference,
    note: params.note,
    recordedByUserId: user.id
  });

  if (result.isFailure()) {
    throw new Error(result.getError().message);
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Hủy hóa đơn
 */
export async function cancelInvoiceAction(invoiceId: string, reason?: string) {
  const { user } = await getAuthenticatedTeacher();
  const repos = await getRepositories();

  const invoice = await repos.invoices.findById(invoiceId);
  if (!invoice || invoice.teacherId !== user.id) {
    throw new Error('Không tìm thấy hóa đơn hoặc bạn không có quyền');
  }

  const cancelResult = invoice.cancel(reason);
  if (cancelResult.isFailure()) {
    throw new Error(cancelResult.getError().message);
  }

  await repos.invoices.save(invoice);
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Xóa hóa đơn nháp
 */
export async function deleteInvoiceAction(invoiceId: string) {
  const { user } = await getAuthenticatedTeacher();
  const repos = await getRepositories();

  const invoice = await repos.invoices.findById(invoiceId);
  if (!invoice || invoice.teacherId !== user.id) {
    throw new Error('Không tìm thấy hóa đơn hoặc bạn không có quyền');
  }

  if (invoice.status === 'paid') {
    throw new Error('Không thể xóa hóa đơn đã thanh toán');
  }

  await repos.invoices.delete(invoiceId);
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Lấy thông tin cấu hình mẫu hóa đơn của giáo viên
 */
export async function getInvoiceTemplateAction() {
  const { user, supabase } = await getAuthenticatedTeacher();
  const { data: template } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('teacher_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: bankAccounts } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  return {
    template: template || {
      brand_name: profile?.full_name || '',
      logo_url: profile?.avatar_url || '',
      contact_phone: profile?.phone || '',
      contact_email: profile?.email || '',
      address: '',
      note_message: 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!',
      theme_color: '#3B82F6',
      show_attendance_log: true,
      bank_account_id: bankAccounts?.[0]?.id || null
    },
    profile,
    bankAccounts: bankAccounts || []
  };
}

/**
 * Lưu cấu hình mẫu hóa đơn
 */
export async function saveInvoiceTemplateAction(formData: {
  brand_name: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  note_message?: string;
  theme_color?: string;
  show_attendance_log?: boolean;
  bank_account_id?: string | null;
}) {
  const { user, supabase } = await getAuthenticatedTeacher();
  
  const { error } = await supabase
    .from('invoice_templates')
    .upsert({
      teacher_id: user.id,
      brand_name: formData.brand_name,
      logo_url: formData.logo_url || null,
      contact_phone: formData.contact_phone || null,
      contact_email: formData.contact_email || null,
      address: formData.address || null,
      note_message: formData.note_message || 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!',
      theme_color: formData.theme_color || '#3B82F6',
      show_attendance_log: formData.show_attendance_log !== false,
      bank_account_id: formData.bank_account_id || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'teacher_id' });

  if (error) {
    throw new Error(`Lỗi lưu mẫu hóa đơn: ${error.message}`);
  }

  revalidatePath('/teacher/invoices');
  return { success: true };
}
