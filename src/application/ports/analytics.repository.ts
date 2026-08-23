import { TaxReport } from '../../domains/analytics/entities/tax-report';

export interface IAnalyticsRepository {
  findTaxReport(teacherId: string, year: number, month: number | null): Promise<TaxReport | null>;
  saveTaxReport(report: TaxReport): Promise<void>;
  
  // Gets raw total paid invoice amounts
  getRevenueSummary(teacherId: string, startDate: Date, endDate: Date): Promise<number>;
  getSystemRevenueSummary(startDate: Date, endDate: Date): Promise<number>;
}
