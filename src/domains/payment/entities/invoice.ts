import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { Money } from '../../shared/value-objects';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../../shared/domain-event';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'vietqr' | 'momo' | 'vnpay' | 'zalopay';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  amount: Money;
}

/** Snapshot of the sessions used to calculate a per-session tuition invoice. */
export interface InvoiceAttendanceSession {
  date: string;
  title?: string;
  status: 'present' | 'late' | 'not_marked';
}

export interface InvoiceTemplateSnapshot {
  brandName?: string;
  logoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  noteMessage?: string;
  themeColor?: string;
  showAttendanceLog?: boolean;
}

export class InvoicePaidEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'INVOICE_PAID';
  constructor(
    public readonly invoiceId: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly amount: number,
    public readonly paymentRef?: string
  ) {}
}

export class Invoice extends AggregateRoot {
  private constructor(
    id: string,
    private _invoiceNumber: string,
    private _teacherId: string,
    private _studentId: string,
    private _classId: string,
    private _periodStart: Date,
    private _periodEnd: Date,
    private _sessionsCount: number,
    private _lineItems: InvoiceLineItem[],
    private _subtotal: Money,
    private _discount: Money,
    private _extraFee: Money,
    private _taxRate: number,
    private _totalAmount: Money,
    private _status: InvoiceStatus,
    private _dueDate: Date,
    private _paymentToken: string,
    private _paidAt: Date | null = null,
    private _paidAmount: Money | null = null,
    private _paymentMethod: PaymentMethod | null = null,
    private _paymentReference: string | null = null,
    private _notes: string | null = null,
    private _templateSnapshot: InvoiceTemplateSnapshot | null = null,
    private _attendanceLog: InvoiceAttendanceSession[] = []
  ) {
    super(id);
  }

  static create(props: {
    teacherId: string;
    studentId: string;
    classId: string;
    periodStart: Date;
    periodEnd: Date;
    sessionsCount: number;
    lineItems: InvoiceLineItem[];
    discount?: Money;
    extraFee?: Money;
    taxRate?: number;
    dueDate?: Date;
    notes?: string;
    templateSnapshot?: InvoiceTemplateSnapshot;
    attendanceLog?: InvoiceAttendanceSession[];
  }): Result<Invoice> {
    if (props.lineItems.length === 0) {
      return Result.fail(new DomainError("Hóa đơn phải có ít nhất một mục chi phí"));
    }

    const subtotalNum = props.lineItems.reduce((acc, item) => acc + item.amount.amount, 0);
    const discountNum = props.discount ? props.discount.amount : 0;
    const extraFeeNum = props.extraFee ? props.extraFee.amount : 0;
    const taxRate = props.taxRate ?? 0;

    const baseAmount = Math.max(0, subtotalNum - discountNum + extraFeeNum);
    const taxAmount = baseAmount * (taxRate / 100);
    const totalAmount = new Money(baseAmount + taxAmount);

    const now = new Date();
    const invoiceNumber = `HD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentToken = `${uuidv4().replace(/-/g, '')}${Math.random().toString(36).substring(2, 8)}`;

    const defaultDueDate = props.dueDate || new Date(now.getFullYear(), now.getMonth() + 1, 10);

    const invoice = new Invoice(
      uuidv4(),
      invoiceNumber,
      props.teacherId,
      props.studentId,
      props.classId,
      props.periodStart,
      props.periodEnd,
      props.sessionsCount,
      props.lineItems,
      new Money(subtotalNum),
      new Money(discountNum),
      new Money(extraFeeNum),
      taxRate,
      totalAmount,
      'draft',
      defaultDueDate,
      paymentToken,
      null,
      null,
      null,
      null,
      props.notes || null,
      props.templateSnapshot || null,
      props.attendanceLog || []
    );

    return Result.ok(invoice);
  }

  markAsPaid(amount: Money, method: PaymentMethod, paymentRef?: string): Result<void> {
    if (this._status === 'paid') {
      return Result.fail(new DomainError("Hóa đơn này đã được thanh toán trước đó"));
    }

    this._status = 'paid';
    this._paidAt = new Date();
    this._paidAmount = amount;
    this._paymentMethod = method;
    this._paymentReference = paymentRef || null;

    this.addDomainEvent(new InvoicePaidEvent(this.id, method, amount.amount, paymentRef));
    return Result.ok(undefined);
  }

  markAsSent(): void {
    if (this._status === 'draft') {
      this._status = 'sent';
    }
  }

  cancel(reason?: string): Result<void> {
    if (this._status === 'paid') {
      return Result.fail(new DomainError("Không thể hủy hóa đơn đã thanh toán"));
    }
    this._status = 'cancelled';
    if (reason) {
      this._notes = this._notes ? `${this._notes} | Lý do hủy: ${reason}` : `Lý do hủy: ${reason}`;
    }
    return Result.ok(undefined);
  }

  isOverdue(): boolean {
    return this._status === 'sent' && new Date() > this._dueDate;
  }

  get invoiceNumber() { return this._invoiceNumber; }
  get teacherId() { return this._teacherId; }
  get studentId() { return this._studentId; }
  get classId() { return this._classId; }
  get periodStart() { return this._periodStart; }
  get periodEnd() { return this._periodEnd; }
  get sessionsCount() { return this._sessionsCount; }
  get lineItems() { return this._lineItems; }
  get subtotal() { return this._subtotal; }
  get discount() { return this._discount; }
  get extraFee() { return this._extraFee; }
  get taxRate() { return this._taxRate; }
  get totalAmount() { return this._totalAmount; }
  get status() { return this._status; }
  get dueDate() { return this._dueDate; }
  get paymentToken() { return this._paymentToken; }
  get paidAt() { return this._paidAt; }
  get paidAmount() { return this._paidAmount; }
  get paymentMethod() { return this._paymentMethod; }
  get paymentReference() { return this._paymentReference; }
  get notes() { return this._notes; }
  get templateSnapshot() { return this._templateSnapshot; }
  get attendanceLog() { return this._attendanceLog; }
}
