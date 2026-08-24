import { SupabaseClient } from '@supabase/supabase-js';
import { TaxReport } from '../../../../domains/analytics/entities/tax-report';
import { IAnalyticsRepository } from '../../../../application/ports/analytics.repository';
import { Money } from '../../../../domains/shared/value-objects';

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): TaxReport {
    const entity = Object.create(TaxReport.prototype);
    Object.assign(entity, {
      _id: row.id,
      _teacherId: row.teacher_id,
      _year: row.year,
      _month: row.month,
      _totalRevenue: new Money(row.total_revenue),
      _totalTaxableAmount: new Money(row.total_taxable),
      _taxLiability: new Money(row.tax_amount),
      _status: row.status || 'draft',
    });
    return entity;
  }

  async findTaxReport(teacherId: string, year: number, month: number | null): Promise<TaxReport | null> {
    let query = this.client
      .from('tax_reports')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('year', year);
      
    if (month !== null) {
      query = query.eq('month', month);
    } else {
      query = query.is('month', null);
    }

    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find tax report: ${error.message}`);
    }

    return this.toDomain(data);
  }

  async saveTaxReport(report: TaxReport): Promise<void> {
    const reportAny = report as any;
    const data = {
      id: reportAny._id,
      teacher_id: reportAny._teacherId,
      year: reportAny._year,
      month: reportAny._month,
      total_revenue: reportAny._totalRevenue.amount,
      total_taxable: reportAny._totalTaxableAmount.amount,
      tax_amount: reportAny._taxLiability.amount,
      status: reportAny._status,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.client
      .from('tax_reports')
      .upsert(data);
      
    if (error) {
      throw new Error(`Failed to save tax report: ${error.message}`);
    }
  }

  async getRevenueSummary(teacherId: string, startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await this.client
      .from('invoices')
      .select('total_amount')
      .eq('teacher_id', teacherId)
      .eq('status', 'paid')
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to get revenue summary: ${error.message}`);
    }

    return data.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  }

  async getSystemRevenueSummary(startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await this.client
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to get system revenue summary: ${error.message}`);
    }

    return data.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
  }
}
