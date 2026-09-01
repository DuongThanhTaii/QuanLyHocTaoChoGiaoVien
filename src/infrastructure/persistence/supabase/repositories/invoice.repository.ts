import { SupabaseClient } from '@supabase/supabase-js';
import { Invoice, InvoiceLineItem, InvoiceStatus, PaymentMethod } from '../../../../domains/payment/entities/invoice';
import { Money } from '../../../../domains/shared/value-objects';
import { IInvoiceRepository } from '../../../../application/ports/invoice.repository';

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): Invoice {
    const invoice = Object.create(Invoice.prototype);

    let lineItems: InvoiceLineItem[] = [];
    let customNotes: string | null = null;
    let templateSnapshot: any = null;
    let paymentToken: string = row.payment_token || row.id.replace(/-/g, '');
    let extraFeeAmount = Number(row.extra_fee) || 0;

    if (row.notes) {
      try {
        if (row.notes.startsWith('{')) {
          const parsed = JSON.parse(row.notes);
          lineItems = parsed.line_items || [];
          customNotes = parsed.custom_notes || parsed.notes || null;
          templateSnapshot = parsed.template_snapshot || parsed.template || null;
          if (parsed.payment_token) paymentToken = parsed.payment_token;
          if (parsed.extra_fee) extraFeeAmount = Number(parsed.extra_fee);
        } else if (row.notes.startsWith('[')) {
          lineItems = JSON.parse(row.notes);
        } else {
          customNotes = row.notes;
        }
      } catch (e) {
        customNotes = row.notes;
      }
    }

    if (!lineItems || lineItems.length === 0) {
      const unitPrice = new Money(Number(row.unit_price) || 0);
      const amount = new Money(Number(row.subtotal) || 0);
      const quantity = row.sessions_count || 1;
      lineItems = [{
        description: 'Học phí',
        quantity,
        unitPrice,
        amount
      }];
    }

    const subtotal = new Money(Number(row.subtotal) || 0);
    const discount = new Money(Number(row.discount) || 0);
    const extraFee = new Money(extraFeeAmount);
    const totalAmount = new Money(Number(row.total_amount) || 0);

    Object.assign(invoice, {
      _id: row.id,
      _invoiceNumber: row.invoice_number,
      _teacherId: row.teacher_id,
      _studentId: row.student_id,
      _classId: row.class_id,
      _periodStart: new Date(row.period_start),
      _periodEnd: new Date(row.period_end),
      _sessionsCount: Number(row.sessions_count) || 0,
      _lineItems: lineItems.map((item: any) => ({
        id: item.id,
        description: item.description || 'Học phí',
        quantity: Number(item.quantity) || 1,
        unitPrice: new Money(Number(item.unitPrice?.amount ?? item.unitPrice ?? 0)),
        amount: new Money(Number(item.amount?.amount ?? item.amount ?? 0))
      })),
      _subtotal: subtotal,
      _discount: discount,
      _extraFee: extraFee,
      _taxRate: Number(row.tax_rate) || 0,
      _totalAmount: totalAmount,
      _status: row.status as InvoiceStatus,
      _dueDate: new Date(row.due_date),
      _paymentToken: paymentToken,
      _paidAt: row.paid_at ? new Date(row.paid_at) : null,
      _paidAmount: row.paid_amount != null ? new Money(Number(row.paid_amount)) : null,
      _paymentMethod: row.payment_method as PaymentMethod | null,
      _paymentReference: row.payment_reference || null,
      _notes: customNotes,
      _templateSnapshot: templateSnapshot
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

  async findByPaymentToken(token: string): Promise<Invoice | null> {
    // Look up by id or notes match
    const { data, error } = await this.client
      .from('invoices')
      .select('*')
      .or(`id.eq.${token},notes.ilike.%${token}%`)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return this.toDomain(data[0]);
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

    return (data || []).map(row => this.toDomain(row));
  }

  async findByStudentId(studentId: string): Promise<Invoice[]> {
    const { data, error } = await this.client
      .from('invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find invoices for student: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
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

    return (data || []).map(row => this.toDomain(row));
  }

  private serializeInvoice(invoice: Invoice): any {
    const anyInv = invoice as any;
    const lineItems = (anyInv.lineItems || anyInv._lineItems || []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice?.amount ?? item.unitPrice ?? 0,
      amount: item.amount?.amount ?? item.amount ?? 0
    }));

    const firstItem = lineItems[0];
    const unitPrice = firstItem?.unitPrice || 0;
    const subtotal = (anyInv.subtotal || anyInv._subtotal)?.amount ?? (firstItem?.amount || 0);
    const discount = (anyInv.discount || anyInv._discount)?.amount ?? 0;
    const extraFee = (anyInv.extraFee || anyInv._extraFee)?.amount ?? 0;
    const totalAmount = (anyInv.totalAmount || anyInv._totalAmount)?.amount ?? (subtotal - discount + extraFee);
    const paymentToken = anyInv.paymentToken || anyInv._paymentToken || anyInv.id || anyInv._id;

    const notesPayload = JSON.stringify({
      line_items: lineItems,
      discount,
      extra_fee: extraFee,
      payment_token: paymentToken,
      custom_notes: anyInv.notes || anyInv._notes || null,
      template_snapshot: anyInv.templateSnapshot || anyInv._templateSnapshot || null
    });

    return {
      id: anyInv.id || anyInv._id,
      invoice_number: anyInv.invoiceNumber || anyInv._invoiceNumber,
      teacher_id: anyInv.teacherId || anyInv._teacherId,
      student_id: anyInv.studentId || anyInv._studentId,
      class_id: anyInv.classId || anyInv._classId,
      period_start: (anyInv.periodStart || anyInv._periodStart).toISOString(),
      period_end: (anyInv.periodEnd || anyInv._periodEnd).toISOString(),
      sessions_count: anyInv.sessionsCount || anyInv._sessionsCount || 0,
      unit_price: unitPrice,
      subtotal: subtotal,
      discount: discount,
      tax_rate: anyInv.taxRate || anyInv._taxRate || 0,
      total_amount: totalAmount,
      status: anyInv.status || anyInv._status,
      due_date: (anyInv.dueDate || anyInv._dueDate).toISOString(),
      paid_at: (anyInv.paidAt || anyInv._paidAt) ? new Date(anyInv.paidAt || anyInv._paidAt).toISOString() : null,
      paid_amount: (anyInv.paidAmount || anyInv._paidAmount) ? (anyInv.paidAmount || anyInv._paidAmount).amount : null,
      payment_method: anyInv.paymentMethod || anyInv._paymentMethod || null,
      payment_reference: anyInv.paymentReference || anyInv._paymentReference || null,
      notes: notesPayload,
      updated_at: new Date().toISOString()
    };
  }

  async save(invoice: Invoice): Promise<void> {
    const row = this.serializeInvoice(invoice);
    const { error } = await this.client
      .from('invoices')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save invoice: ${error.message}`);
    }
  }

  async saveMany(invoices: Invoice[]): Promise<void> {
    if (invoices.length === 0) return;
    const rows = invoices.map(inv => this.serializeInvoice(inv));

    const { error } = await this.client
      .from('invoices')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save many invoices: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }
}
