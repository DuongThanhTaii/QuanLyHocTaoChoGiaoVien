import { SupabaseClient } from '@supabase/supabase-js';
import { Invoice } from '../../../../domains/payment/entities/invoice';
import { Money } from '../../../../domains/shared/value-objects';
import { IInvoiceRepository } from '../../../../application/ports/invoice.repository';

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): Invoice {
    const invoice = Object.create(Invoice.prototype);
    
    // Convert subtotal/unit_price back to lineItems for MVP
    const unitPrice = new Money(Number(row.unit_price) || 0);
    const amount = new Money(Number(row.subtotal) || 0);
    const quantity = row.subtotal && row.unit_price ? Number(row.subtotal) / Number(row.unit_price) : 1;
    
    const lineItems = row.notes && row.notes.startsWith('[') ? JSON.parse(row.notes) : [{
      description: 'Tuition Fee',
      quantity,
      unitPrice,
      amount
    }];

    Object.assign(invoice, {
      _id: row.id,
      _invoiceNumber: row.invoice_number,
      _teacherId: row.teacher_id,
      _studentId: row.student_id,
      _classId: row.class_id,
      _periodStart: new Date(row.period_start),
      _periodEnd: new Date(row.period_end),
      _sessionsCount: row.sessions_count,
      _lineItems: lineItems.map((item: any) => ({
        ...item,
        unitPrice: new Money(Number(item.unitPrice?.amount ?? item.unitPrice ?? 0)),
        amount: new Money(Number(item.amount?.amount ?? item.amount ?? 0))
      })),
      _taxRate: row.tax_rate,
      _totalAmount: new Money(Number(row.total_amount)),
      _status: row.status,
      _dueDate: new Date(row.due_date),
      _paidAt: row.paid_at ? new Date(row.paid_at) : null,
      _paidAmount: row.paid_amount != null ? new Money(Number(row.paid_amount)) : null,
    });
    return invoice;
  }

  async findById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find invoice: ${error.message}`);
    }
    
    return this.toDomain(data);
  }

  async findByTeacherId(teacherId: string): Promise<Invoice[]> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find invoices: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findByTeacherAndDateRange(teacherId: string, startDate: Date, endDate: Date): Promise<Invoice[]> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start', { ascending: true });

    if (error) {
      throw new Error(`Failed to find invoices by date range: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async save(invoice: Invoice): Promise<void> {
    const anyInvoice = invoice as any;
    const lineItems = anyInvoice.lineItems || anyInvoice._lineItems || [];
    
    // For MVP, map lineItems[0] to unit_price and subtotal
    const firstItem = lineItems[0];
    const unitPrice = firstItem?.unitPrice?.amount || 0;
    const subtotal = firstItem?.amount?.amount || 0;
    
    const { error } = await this.client
      .from('invoices')
      .upsert({
        id: anyInvoice.id || anyInvoice._id,
        invoice_number: anyInvoice.invoiceNumber || anyInvoice._invoiceNumber,
        teacher_id: anyInvoice.teacherId || anyInvoice._teacherId,
        student_id: anyInvoice.studentId || anyInvoice._studentId,
        class_id: anyInvoice.classId || anyInvoice._classId,
        period_start: (anyInvoice.periodStart || anyInvoice._periodStart).toISOString(),
        period_end: (anyInvoice.periodEnd || anyInvoice._periodEnd).toISOString(),
        sessions_count: anyInvoice.sessionsCount || anyInvoice._sessionsCount,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount: 0, // Not explicitly in domain but in DB
        tax_rate: anyInvoice.taxRate || anyInvoice._taxRate,
        tax_amount: (subtotal * (anyInvoice.taxRate || anyInvoice._taxRate)) / 100, // Derived
        total_amount: (anyInvoice.totalAmount || anyInvoice._totalAmount).amount,
        status: anyInvoice.status || anyInvoice._status,
        due_date: (anyInvoice.dueDate || anyInvoice._dueDate).toISOString(),
        paid_at: (anyInvoice.paidAt || anyInvoice._paidAt) ? new Date(anyInvoice.paidAt || anyInvoice._paidAt).toISOString() : null,
        paid_amount: (anyInvoice.paidAmount || anyInvoice._paidAmount) ? (anyInvoice.paidAmount || anyInvoice._paidAmount).amount : null,
        notes: JSON.stringify(lineItems), // Store full line items in notes
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to save invoice: ${error.message}`);
    }
  }

  async saveMany(invoices: Invoice[]): Promise<void> {
    if (invoices.length === 0) return;

    const rows = invoices.map(invoice => {
      const anyInvoice = invoice as any;
      const lineItems = anyInvoice.lineItems || anyInvoice._lineItems || [];
      const firstItem = lineItems[0];
      const unitPrice = firstItem?.unitPrice?.amount || 0;
      const subtotal = firstItem?.amount?.amount || 0;

      return {
        id: anyInvoice.id || anyInvoice._id,
        invoice_number: anyInvoice.invoiceNumber || anyInvoice._invoiceNumber,
        teacher_id: anyInvoice.teacherId || anyInvoice._teacherId,
        student_id: anyInvoice.studentId || anyInvoice._studentId,
        class_id: anyInvoice.classId || anyInvoice._classId,
        period_start: (anyInvoice.periodStart || anyInvoice._periodStart).toISOString(),
        period_end: (anyInvoice.periodEnd || anyInvoice._periodEnd).toISOString(),
        sessions_count: anyInvoice.sessionsCount || anyInvoice._sessionsCount,
        unit_price: unitPrice,
        subtotal: subtotal,
        discount: 0,
        tax_rate: anyInvoice.taxRate || anyInvoice._taxRate,
        tax_amount: (subtotal * (anyInvoice.taxRate || anyInvoice._taxRate)) / 100,
        total_amount: (anyInvoice.totalAmount || anyInvoice._totalAmount).amount,
        status: anyInvoice.status || anyInvoice._status,
        due_date: (anyInvoice.dueDate || anyInvoice._dueDate).toISOString(),
        paid_at: (anyInvoice.paidAt || anyInvoice._paidAt) ? new Date(anyInvoice.paidAt || anyInvoice._paidAt).toISOString() : null,
        paid_amount: (anyInvoice.paidAmount || anyInvoice._paidAmount) ? (anyInvoice.paidAmount || anyInvoice._paidAmount).amount : null,
        notes: JSON.stringify(lineItems),
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await this.client
      .from('invoices')
      .upsert(rows);

    if (error) {
      throw new Error(`Failed to save many invoices: ${error.message}`);
    }
  }
}
