import { IPaymentGateway, PaymentWebhookPayload } from '../../domains/payment/ports/payment-gateway';
import { Invoice } from '../../domains/payment/entities/invoice';
import { Result } from '../../domains/shared/result';
import * as crypto from 'crypto';

export class VNPayAdapter implements IPaymentGateway {
  name = 'vnpay';
  
  private merchantId = process.env.VNPAY_TMN_CODE || 'TEST_CODE';
  private secretKey = process.env.VNPAY_HASH_SECRET || 'TEST_SECRET';
  private endpoint = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  async createPaymentUrl(invoice: Invoice, returnUrl: string): Promise<string> {
    // VNPay logic integration stub based on the rules design
    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.merchantId,
      vnp_Amount: (invoice.totalAmount.amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: invoice.id,
      vnp_OrderInfo: `Hoc phi ${invoice.invoiceNumber}`,
      vnp_ReturnUrl: returnUrl,
      vnp_CreateDate: new Date().toISOString().replace(/\D/g, '').substring(0, 14),
      vnp_IpAddr: '127.0.0.1',
    };
    
    // Sort keys and generate signature
    const sortedKeys = Object.keys(vnp_Params).sort();
    const signData = sortedKeys.map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`).join('&');
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    return `${this.endpoint}?${signData}&vnp_SecureHash=${signed}`;
  }
  
  verifyWebhook(payload: any, signature: string): Result<PaymentWebhookPayload> {
    // Mock signature verification for now
    const isValid = true; 
    
    if (!isValid) {
      return Result.fail(new Error('Invalid signature'));
    }

    return Result.ok({
      transactionRef: payload.vnp_TransactionNo || 'mock-txn',
      invoiceId: payload.vnp_TxnRef,
      amount: parseInt(payload.vnp_Amount) / 100,
      method: 'vnpay',
      status: payload.vnp_ResponseCode === '00' ? 'success' : 'failed',
    });
  }

  async refund(transactionId: string, amount: number): Promise<Result<void>> {
    return Result.ok(undefined);
  }
}
