import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { Money } from '../../shared/value-objects';
import { v4 as uuidv4 } from 'uuid';

export class TaxReport extends AggregateRoot {
  private constructor(
    id: string,
    private _teacherId: string,
    private _year: number,
    private _month: number | null, // null means yearly report
    private _totalRevenue: Money,
    private _totalTaxableAmount: Money,
    private _taxLiability: Money,
    private _status: 'draft' | 'finalized'
  ) {
    super(id);
  }

  static calculate(
    teacherId: string, 
    year: number, 
    month: number | null, 
    invoicesData: { amount: number, isTaxable: boolean }[]
  ): Result<TaxReport> {
    const totalRev = invoicesData.reduce((acc, curr) => acc + curr.amount, 0);
    const taxableRev = invoicesData.filter(i => i.isTaxable).reduce((acc, curr) => acc + curr.amount, 0);
    
    // Simplistic tax rule for example: 5% flat rate on taxable revenue over some threshold
    const taxRate = 0.05;
    const liability = taxableRev * taxRate;

    return Result.ok(new TaxReport(
      uuidv4(),
      teacherId,
      year,
      month,
      new Money(totalRev),
      new Money(taxableRev),
      new Money(liability),
      'draft'
    ));
  }

  finalize(): void {
    this._status = 'finalized';
  }

  get totalRevenue() { return this._totalRevenue; }
  get taxLiability() { return this._taxLiability; }
  get status() { return this._status; }
}
