import { Result } from '../../shared/result';
import { Invoice } from '../entities/invoice';

export interface PaymentWebhookPayload {
  transactionRef: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: 'success' | 'failed';
  message?: string;
}

export interface IPaymentGateway {
  name: string;
  createPaymentUrl(invoice: Invoice, returnUrl: string): Promise<string>;
  verifyWebhook(payload: any, signature: string): Result<PaymentWebhookPayload>;
  refund(transactionId: string, amount: number): Promise<Result<void>>;
}
