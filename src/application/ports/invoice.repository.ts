import { Invoice } from '../../domains/payment/entities/invoice';

export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByTeacherId(teacherId: string): Promise<Invoice[]>;
  findByTeacherAndDateRange(teacherId: string, startDate: Date, endDate: Date): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<void>;
  saveMany(invoices: Invoice[]): Promise<void>;
}
