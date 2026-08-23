import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { Money } from '../../shared/value-objects';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../../shared/domain-event';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: Money;
  amount: Money;
}

export class InvoicePaidEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'INVOICE_PAID';
  constructor(
    public readonly invoiceId: string,
    public readonly paymentId: string,
    public readonly amount: number
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
    private _taxRate: number,
    private _totalAmount: Money,
    private _status: InvoiceStatus,
    private _dueDate: Date,
    private _paidAt: Date | null = null,
    private _paidAmount: Money | null = null
  ) {
    super(id);
  }

  static create(props: {
    teacherId: string,
    studentId: string,
    classId: string,
    periodStart: Date,
    periodEnd: Date,
    sessionsCount: number,
    lineItems: InvoiceLineItem[],
    taxRate: number,
    dueDate: Date
  }): Result<Invoice> {
    if (props.lineItems.length === 0) {
      return Result.fail(new DomainError("Invoice must have at least one line item"));
    }

    const subtotalAmount = props.lineItems.reduce((acc, item) => acc + item.amount.amount, 0);
    const taxAmount = subtotalAmount * (props.taxRate / 100);
    const totalAmount = new Money(subtotalAmount + taxAmount);

    const invoiceNumber = `HD-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

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
      props.taxRate,
      totalAmount,
      'draft',
      props.dueDate
    );

    return Result.ok(invoice);
  }

  markAsPaid(amount: Money, method: PaymentMethod, paymentRef?: string): Result<void> {
    if (this._status === 'paid') {
      return Result.fail(new DomainError("Invoice is already paid"));
    }

    if (amount.amount < this._totalAmount.amount) {
      return Result.fail(new DomainError("Partial payments not currently supported without special config"));
    }

    this._status = 'paid';
    this._paidAt = new Date();
    this._paidAmount = amount;

    // paymentRef could be mapped or we can use a separate Payment Entity logic as needed
    this.addDomainEvent(new InvoicePaidEvent(this.id, paymentRef || 'cash', amount.amount));
    
    return Result.ok(undefined);
  }

  markAsSent(): void {
    if (this._status === 'draft') {
      this._status = 'sent';
    }
  }

  isOverdue(): boolean {
    return this._status === 'sent' && new Date() > this._dueDate;
  }

  get invoiceNumber() { return this._invoiceNumber; }
  get teacherId() { return this._teacherId; }
  get studentId() { return this._studentId; }
  get classId() { return this._classId; }
  get status() { return this._status; }
  get totalAmount() { return this._totalAmount; }
}
