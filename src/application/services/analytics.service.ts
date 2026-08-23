import { IAnalyticsRepository } from '../ports/analytics.repository';
import { IInvoiceRepository } from '../ports/invoice.repository';
import { Result } from '../../domains/shared/result';
import { TaxReport } from '../../domains/analytics/entities/tax-report';

export class AnalyticsService {
  constructor(
    private analyticsRepo: IAnalyticsRepository,
    private invoiceRepo: IInvoiceRepository
  ) {}

  async generateMonthlyTaxReport(teacherId: string, year: number, month: number): Promise<Result<TaxReport>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Fetch all paid invoices for this teacher in the period
    const invoices = await this.invoiceRepo.findByTeacherAndDateRange(teacherId, startDate, endDate);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');

    const invoiceData = paidInvoices.map(inv => ({
      amount: inv.totalAmount.amount,
      isTaxable: true // Based on business rules
    }));

    const reportResult = TaxReport.calculate(teacherId, year, month, invoiceData);
    if (reportResult.isSuccess()) {
      await this.analyticsRepo.saveTaxReport(reportResult.getValue());
    }

    return reportResult;
  }

  async getAdminRevenueDashboardData(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const revenue = await this.analyticsRepo.getSystemRevenueSummary(startOfMonth, now);
    // In real app, calculate subscriptions, metrics...
    
    return {
      monthlyRevenue: revenue,
      activeTeachers: 0, // Mock metric
      activeStudents: 0  // Mock metric
    };
  }
}
