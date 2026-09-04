import { IInvoiceRepository } from '../ports/invoice.repository';
import { IAttendanceRepository } from '../ports/attendance.repository';
import { IEnrollmentRepository } from '../ports/enrollment.repository';
import { IClassRepository } from '../ports/class.repository';
import { Result } from '../../domains/shared/result';
import { Invoice, InvoiceAttendanceSession, InvoiceLineItem, InvoiceTemplateSnapshot, PaymentMethod } from '../../domains/payment/entities/invoice';
import { Money } from '../../domains/shared/value-objects';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationService } from './notification.service';

export interface StudentBillingPreview {
  studentId: string;
  studentName: string;
  phone?: string;
  email?: string;
  totalSessionsInMonth: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  effectiveSessions: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  extraFee: number;
  totalAmount: number;
  hasExistingInvoice: boolean;
  existingInvoiceId?: string;
  existingInvoiceStatus?: string;
  sessionDetails: Array<{
    date: string;
    title?: string;
    status: string;
  }>;
}

export class InvoiceService {
  private notificationService?: NotificationService;

  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly classRepo?: IClassRepository,
    private readonly supabase?: SupabaseClient
  ) {
    if (supabase) {
      this.notificationService = new NotificationService(supabase);
    }
  }

  /**
   * Tính toán trước học phí tháng cho cả lớp để giáo viên xem xét trước khi sinh hóa đơn
   */
  async getMonthlyBillingPreview(
    teacherId: string,
    classId: string,
    month: number,
    year: number
  ): Promise<Result<StudentBillingPreview[]>> {
    if (!this.supabase) {
      return Result.fail(new Error("Supabase client is required for billing preview"));
    }

    // 1. Lấy thông tin lớp
    const { data: classData, error: classError } = await this.supabase
      .from('classes')
      .select('id, name, fee_per_session, fee_type')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return Result.fail(new Error("Không tìm thấy thông tin lớp học"));
    }

    const defaultFee = Number(classData.fee_per_session) || 150000;
    const feeType = classData.fee_type || 'per_session';

    // 2. Lấy danh sách học sinh đang hoạt động trong lớp
    const { data: enrollments, error: enrollError } = await this.supabase
      .from('enrollments')
      .select(`
        id,
        custom_fee,
        status,
        joined_at,
        student_id,
        students:student_id (
          id,
          full_name,
          phone,
          email,
          user_id
        )
      `)
      .eq('class_id', classId)
      .in('status', ['ACTIVE', 'PENDING']);

    if (enrollError) {
      return Result.fail(new Error(`Lỗi tải danh sách học sinh: ${enrollError.message}`));
    }

    // 3. Lấy tất cả các buổi học trong tháng
    const startDateLocal = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateLocal = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: sessions } = await this.supabase
      .from('class_sessions')
      .select('id, session_date, title, status')
      .eq('class_id', classId)
      .gte('session_date', startDateLocal)
      .lte('session_date', endDateLocal)
      .order('session_date', { ascending: true });

    const classSessions = sessions || [];

    // 4. Lấy tất cả bản ghi điểm danh trong tháng của lớp
    const { data: attendanceData } = await this.supabase
      .from('attendance_records')
      .select('id, session_id, student_id, status, note, marked_at')
      .eq('class_id', classId);

    const attendanceRecords = attendanceData || [];

    // 5. Kiểm tra các hóa đơn đã tồn tại trong tháng này
    const { data: existingInvoices } = await this.supabase
      .from('invoices')
      .select('id, student_id, status, total_amount, period_start, period_end')
      .eq('class_id', classId)
      .gte('period_start', startDateLocal)
      .lte('period_end', endDateLocal);

    const existingMap = new Map<string, any>();
    (existingInvoices || []).forEach(inv => {
      existingMap.set(inv.student_id, inv);
    });

    const previewList: StudentBillingPreview[] = [];

    for (const enrollment of (enrollments || [])) {
      const student = Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students;
      if (!student) continue;

      const studentId = student.id;
      const studentName = student.full_name || 'Học sinh';
      const customFee = enrollment.custom_fee != null ? Number(enrollment.custom_fee) : null;
      const unitPrice = customFee !== null ? customFee : defaultFee;

      // Lọc điểm danh của học sinh
      const studentAttendance = attendanceRecords.filter(a => a.student_id === studentId);
      
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      const sessionDetails: Array<{ date: string; title?: string; status: string }> = [];

      for (const session of classSessions) {
        const att = studentAttendance.find(a => a.session_id === session.id);
        const status = att ? String(att.status).toLowerCase() : 'not_marked';
        
        if (status === 'present') presentCount++;
        else if (status === 'late') lateCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'excused') excusedCount++;

        sessionDetails.push({
          date: session.session_date,
          title: session.title || undefined,
          status: status
        });
      }

      // Tính số buổi hiệu dụng
      // Nếu có điểm danh: Đi học = 1, Đi trễ = 1 (hoặc 100%), nếu không có buổi nào được điểm danh nhưng có buổi học -> mặc định số buổi của lớp
      let effectiveSessions = presentCount + lateCount;
      if (classSessions.length > 0 && effectiveSessions === 0 && absentCount === 0 && excusedCount === 0) {
        // Chưa điểm danh buổi nào: tính theo tổng số buổi tổ chức trong tháng
        effectiveSessions = classSessions.length;
      } else if (classSessions.length === 0) {
        // Chưa tạo session trong DB: ước tính mặc định 8 buổi/tháng (2 buổi/tuần)
        effectiveSessions = 8;
      }

      let subtotal = 0;
      if (feeType === 'per_month') {
        subtotal = unitPrice;
      } else {
        subtotal = effectiveSessions * unitPrice;
      }

      const existingInv = existingMap.get(studentId);

      previewList.push({
        studentId,
        studentName,
        phone: student.phone || undefined,
        email: student.email || undefined,
        totalSessionsInMonth: classSessions.length || 8,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        effectiveSessions,
        unitPrice,
        subtotal,
        discount: 0,
        extraFee: 0,
        totalAmount: subtotal,
        hasExistingInvoice: !!existingInv,
        existingInvoiceId: existingInv?.id,
        existingInvoiceStatus: existingInv?.status,
        sessionDetails
      });
    }

    return Result.ok(previewList);
  }

  /**
   * Sinh hàng loạt hóa đơn cho lớp sau khi giáo viên đã duyệt/chỉnh sửa preview
   */
  async generateBatchInvoices(params: {
    teacherId: string;
    classId: string;
    month: number;
    year: number;
    dueDate?: Date;
    items: Array<{
      studentId: string;
      sessionsCount: number;
      unitPrice: number;
      discount?: number;
      extraFee?: number;
      notes?: string;
      lineItems?: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
      attendanceLog?: InvoiceAttendanceSession[];
    }>;
    templateSnapshot?: InvoiceTemplateSnapshot;
  }): Promise<Result<Invoice[]>> {
    const { teacherId, classId, month, year, items, templateSnapshot, dueDate } = params;
    const invoices: Invoice[] = [];

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    const resolvedDueDate = dueDate || new Date(year, month, 10);

    // Only invoices charged per session carry the attendance evidence.
    const { data: classData } = this.supabase
      ? await this.supabase.from('classes').select('fee_type').eq('id', classId).maybeSingle()
      : { data: null };
    const isPerSession = (classData?.fee_type || 'per_session') === 'per_session';

    for (const item of items) {
      const unitPrice = item.unitPrice || 0;
      const sessionsCount = item.sessionsCount || 0;
      const discountAmount = item.discount || 0;
      const extraFeeAmount = item.extraFee || 0;

      const lineItems: InvoiceLineItem[] = (item.lineItems && item.lineItems.length > 0)
        ? item.lineItems.map(li => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: new Money(li.unitPrice),
            amount: new Money(li.amount)
          }))
        : [{
            description: `Học phí tháng ${month}/${year} (${sessionsCount} buổi)`,
            quantity: sessionsCount,
            unitPrice: new Money(unitPrice),
            amount: new Money(sessionsCount * unitPrice)
          }];

      if (extraFeeAmount > 0) {
        lineItems.push({
          description: 'Phụ thu / Tài liệu học tập',
          quantity: 1,
          unitPrice: new Money(extraFeeAmount),
          amount: new Money(extraFeeAmount)
        });
      }

      const invResult = Invoice.create({
        teacherId,
        studentId: item.studentId,
        classId,
        periodStart,
        periodEnd,
        sessionsCount,
        lineItems,
        discount: new Money(discountAmount),
        extraFee: new Money(extraFeeAmount),
        taxRate: 0,
        dueDate: resolvedDueDate,
        notes: item.notes,
        templateSnapshot,
        attendanceLog: isPerSession ? item.attendanceLog : undefined
      });

      if (invResult.isSuccess()) {
        const inv = invResult.getValue();
        inv.markAsSent(); // Set trạng thái đã gửi để phụ huynh thấy
        invoices.push(inv);
      }
    }

    await this.invoiceRepo.saveMany(invoices);

    // Gửi thông báo cho từng học sinh và phụ huynh
    if (this.supabase && this.notificationService) {
      for (const inv of invoices) {
        this.notifyStudentAndGuardians(inv, 'invoice_created').catch(console.error);
      }
    }

    return Result.ok(invoices);
  }

  /**
   * Tạo hóa đơn theo yêu cầu (Tùy biến học nửa tháng, học sinh vào giữa kỳ hoặc dừng học)
   */
  async createCustomInvoice(params: {
    teacherId: string;
    studentId: string;
    classId: string;
    periodStart: Date;
    periodEnd: Date;
    sessionsCount: number;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    discount?: number;
    extraFee?: number;
    notes?: string;
    dueDate?: Date;
    templateSnapshot?: InvoiceTemplateSnapshot;
  }): Promise<Result<Invoice>> {
    const { teacherId, studentId, classId, periodStart, periodEnd, sessionsCount, lineItems, discount, extraFee, notes, dueDate, templateSnapshot } = params;

    const domainLineItems: InvoiceLineItem[] = lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: new Money(item.unitPrice),
      amount: new Money(item.amount)
    }));

    const invResult = Invoice.create({
      teacherId,
      studentId,
      classId,
      periodStart,
      periodEnd,
      sessionsCount,
      lineItems: domainLineItems,
      discount: discount ? new Money(discount) : undefined,
      extraFee: extraFee ? new Money(extraFee) : undefined,
      taxRate: 0,
      dueDate,
      notes,
      templateSnapshot
    });

    if (invResult.isFailure()) {
      return Result.fail(invResult.getError());
    }

    const invoice = invResult.getValue();
    invoice.markAsSent();

    await this.invoiceRepo.save(invoice);

    if (this.supabase && this.notificationService) {
      this.notifyStudentAndGuardians(invoice, 'invoice_created').catch(console.error);
    }

    return Result.ok(invoice);
  }

  /**
   * Xác nhận thanh toán (Tiền mặt hoặc Chuyển khoản trực tiếp)
   */
  async recordPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    note?: string;
    recordedByUserId?: string;
  }): Promise<Result<Invoice>> {
    const invoice = await this.invoiceRepo.findById(params.invoiceId);
    if (!invoice) {
      return Result.fail(new Error("Không tìm thấy hóa đơn"));
    }

    const payResult = invoice.markAsPaid(
      new Money(params.amount),
      params.paymentMethod,
      params.paymentReference
    );

    if (payResult.isFailure()) {
      return Result.fail(payResult.getError());
    }

    await this.invoiceRepo.save(invoice);

    // Lưu bản ghi giao dịch payment_transactions
    if (this.supabase) {
      await this.supabase.from('payment_transactions').insert({
        invoice_id: invoice.id,
        amount: params.amount,
        method: params.paymentMethod,
        status: 'success',
        gateway_response: {
          reference: params.paymentReference,
          note: params.note,
          recorded_by: params.recordedByUserId
        },
        paid_by: params.recordedByUserId,
        created_at: new Date().toISOString()
      });

      this.notifyStudentAndGuardians(invoice, 'payment_success').catch(console.error);
    }

    return Result.ok(invoice);
  }

  /**
   * Helper gửi thông báo cho học sinh và các phụ huynh liên kết
   */
  private async notifyStudentAndGuardians(invoice: Invoice, eventType: 'invoice_created' | 'payment_success') {
    if (!this.supabase || !this.notificationService) return;

    try {
      // 1. Tìm user_id của học sinh
      const { data: student } = await this.supabase
        .from('students')
        .select('id, full_name, user_id')
        .eq('id', invoice.studentId)
        .single();

      // 2. Tìm phụ huynh của học sinh
      const { data: links } = await this.supabase
        .from('student_guardians')
        .select('guardian_id, guardians(user_id, full_name)')
        .eq('student_id', invoice.studentId);

      const recipientUserIds = new Set<string>();
      if (student?.user_id) recipientUserIds.add(student.user_id);

      (links || []).forEach(l => {
        const g = Array.isArray(l.guardians) ? l.guardians[0] : l.guardians;
        if (g?.user_id) recipientUserIds.add(g.user_id);
      });

      const title = eventType === 'invoice_created'
        ? `🔔 Thông báo Học phí: ${invoice.invoiceNumber}`
        : `✅ Đã nhận thanh toán: ${invoice.invoiceNumber}`;

      const content = eventType === 'invoice_created'
        ? `Hóa đơn học phí của học sinh ${student?.full_name || ''} với số tiền ${invoice.totalAmount.amount.toLocaleString('vi-VN')} đ đã được tạo. Vui lòng kiểm tra và thanh toán.`
        : `Thanh toán học phí ${invoice.totalAmount.amount.toLocaleString('vi-VN')} đ cho học sinh ${student?.full_name || ''} đã được ghi nhận thành công. Cảm ơn bạn!`;

      for (const uid of recipientUserIds) {
        await this.notificationService.notifyUser(
          uid,
          null,
          title,
          content,
          'invoice',
          { invoice_id: invoice.id, invoice_number: invoice.invoiceNumber, amount: invoice.totalAmount.amount }
        );
      }
    } catch (e) {
      console.error('Lỗi khi gửi thông báo hóa đơn:', e);
    }
  }
}
