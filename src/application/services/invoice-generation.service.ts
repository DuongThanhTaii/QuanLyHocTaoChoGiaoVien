import { IInvoiceRepository } from '../ports/invoice.repository';
import { IAttendanceRepository } from '../ports/attendance.repository';
import { IEnrollmentRepository } from '../ports/enrollment.repository';
import { Result } from '../../domains/shared/result';
import { Invoice } from '../../domains/payment/entities/invoice';

import { Money } from '../../domains/shared/value-objects';

export class AutoGenerateInvoiceUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private attendanceRepo: IAttendanceRepository,
    private enrollmentRepo: IEnrollmentRepository,
    // notificationService, taxCalculator
  ) {}

  async execute(teacherId: string, classId: string, month: number, year: number): Promise<Result<Invoice[]>> {
    const enrollments = await this.enrollmentRepo.findActiveByClass(classId);
    const invoices: Invoice[] = [];

    // Simple auto-generate logic based on rule
    for (const enrollment of enrollments) {
      const attendance = await this.attendanceRepo.findByStudentAndMonth(
        enrollment.studentId, classId, month, year
      );
      
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      
      const effectiveSessions = presentCount + (lateCount * 0.5);
      
      // Default to 150000 per session if no custom fee
      const unitPrice = enrollment.customFee ? enrollment.customFee.amount : 150000;
      const subtotal = effectiveSessions * unitPrice;
      
      if (effectiveSessions > 0) {
        const invoiceResult = Invoice.create({
          teacherId,
          studentId: enrollment.studentId,
          classId,
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month, 0),
          sessionsCount: effectiveSessions,
          lineItems: [{
            description: `Học phí tháng ${month}/${year}`,
            quantity: effectiveSessions,
            unitPrice: new Money(unitPrice),
            amount: new Money(subtotal)
          }],
          taxRate: 5, // 5% VAT or similar
          dueDate: new Date(year, month, 5) // Due on the 5th of next month
        });

        if (invoiceResult.isSuccess()) {
          invoices.push(invoiceResult.getValue());
        }
      }
    }
    
    await this.invoiceRepo.saveMany(invoices);
    
    // Notifications would be sent here
    
    return Result.ok(invoices);
  }
}
