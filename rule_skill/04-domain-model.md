## 1. Shared Kernel

### Result<T> Pattern
```typescript
// src/domains/shared/result.ts
export class Result<T> {
  private constructor(
    private readonly value: T | null,
    private readonly error: DomainError | null
  ) {}
  
  static ok<T>(value: T): Result<T> { return new Result(value, null); }
  static fail<T>(error: DomainError): Result<T> { return new Result(null, error); }
  
  isSuccess(): boolean { return this.error === null; }
  getValue(): T { 
    if (!this.value) throw new Error("Cannot get value from failed result");
    return this.value; 
  }
  getError(): DomainError { 
    if (!this.error) throw new Error("Cannot get error from successful result");
    return this.error; 
  }
}

// Value Objects
export class Money {
  constructor(private readonly amount: number, private readonly currency: string = 'VND') {
    if (amount < 0) throw new DomainError("Amount cannot be negative");
  }
  add(other: Money): Money { /* ... */ }
  multiply(factor: number): Money { /* ... */ }
}

export class Email {
  constructor(private readonly value: string) {
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
      throw new DomainError("Invalid email format");
    }
  }
}
```

## 2. Domain Entities

### Invoice Aggregate Root
```typescript
// src/domains/payment/entities/invoice.ts
export class Invoice extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private _teacherId: string,
    private _studentId: string,
    private _classId: string,
    private _lineItems: InvoiceLineItem[],
    private _status: InvoiceStatus,
    private _dueDate: Date,
    private _payments: Payment[] = [],
    private _taxRate: number = 0
  ) {
    super();
  }

  static create(props: CreateInvoiceProps): Result<Invoice> {
    if (props.lineItems.length === 0) {
      return Result.fail(new DomainError("Invoice must have at least one line item"));
    }
    
    const invoice = new Invoice(/* ... */);
    invoice.addDomainEvent(new InvoiceCreatedEvent(invoice.id));
    return Result.ok(invoice);
  }

  calculateTotal(): Money {
    const subtotal = this._lineItems.reduce((sum, item) => sum.add(item.amount), Money.zero());
    const tax = subtotal.multiply(this._taxRate / 100);
    return subtotal.add(tax);
  }

  applyPayment(payment: Payment): Result<void> {
    if (this._status === 'paid') {
      return Result.fail(new DomainError("Invoice already paid"));
    }
    
    this._payments.push(payment);
    const totalPaid = this._payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid >= this.calculateTotal().amount) {
      this._status = 'paid';
      this.addDomainEvent(new InvoicePaidEvent(this._id, payment.id));
    }
    
    return Result.ok(undefined);
  }

  isOverdue(): boolean {
    return this._status === 'sent' && new Date() > this._dueDate;
  }
}
```

### Schedule & Recurring Logic
```typescript
// src/domains/schedule/entities/schedule-slot.ts
export class ScheduleSlot extends Entity {
  constructor(
    id: string,
    private classId: string,
    private dayOfWeek: DayOfWeek,
    private startTime: LocalTime,
    private endTime: LocalTime,
    private recurrenceRule: RecurrenceRule | null,
    private specificDate: Date | null
  ) {
    super(id);
  }

  getOccurrencesBetween(start: Date, end: Date): Date[] {
    if (this.specificDate) {
      return (this.specificDate >= start && this.specificDate <= end) 
        ? [this.specificDate] 
        : [];
    }
    return this.recurrenceRule?.getOccurrences(start, end) ?? [];
  }

  conflictsWith(other: ScheduleSlot): boolean {
    if (this.dayOfWeek !== other.dayOfWeek) return false;
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
}
```

### Attendance Value Object
```typescript
// src/domains/attendance/value-objects/attendance-status.ts
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused'
}

export class AttendanceRecord extends Entity {
  constructor(
    id: string,
    private slotId: string,
    private studentId: string,
    private status: AttendanceStatus,
    private markedBy: string,
    private markedAt: Date = new Date(),
    private note?: string
  ) {
    super(id);
  }

  canBeModifiedBy(userId: string): boolean {
    return this.markedBy === userId || false;
  }
}
```

## 3. Domain Services

```typescript
// src/domains/payment/services/invoice-generation.service.ts
export class InvoiceGenerationService {
  constructor(
    private attendanceRepo: IAttendanceRepository,
    private enrollmentRepo: IEnrollmentRepository
  ) {}

  async generateMonthlyInvoice(
    teacherId: string,
    classId: string,
    month: number,
    year: number
  ): Promise<Result<Invoice>> {
    const enrollments = await this.enrollmentRepo.findActiveByClass(classId);
    const sessions = await this.attendanceRepo.countSessionsInMonth(classId, month, year);
    
    const lineItems = enrollments.map(e => new InvoiceLineItem(
      e.studentId,
      e.customFee ?? class.feePerSession,
      sessions,
      e.customFee ?? class.feePerSession * sessions
    ));

    return Invoice.create({ teacherId, classId, lineItems, month, year });
  }
}
```

## 4. Domain Events

```typescript
// src/domains/shared/domain-event.ts
export interface DomainEvent {
  occurredOn: Date;
  eventType: string;
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

export class AttendanceMarkedEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'ATTENDANCE_MARKED';
  constructor(
    public readonly studentId: string,
    public readonly classId: string,
    public readonly status: AttendanceStatus
  ) {}
}

// Event Handler (Application Layer)
export class InvoicePaidNotificationHandler {
  constructor(private notificationService: INotificationService) {}
  
  async handle(event: InvoicePaidEvent): Promise<void> {
    await this.notificationService.sendToTeacher(event.invoiceId, 
      `Hoa don da duoc thanh toan: ${event.amount}d`);
  }
}
```
""")
