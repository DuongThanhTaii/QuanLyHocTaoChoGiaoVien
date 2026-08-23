import { NextRequest, NextResponse } from 'next/server';
import { VNPayAdapter } from '@/infrastructure/payment/vnpay.adapter';
// import { InvoiceRepository } from '@/infrastructure/persistence/supabase/repositories/invoice.repository';
// import { NotificationService } from '@/infrastructure/notification/notification.service';

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const payload = Object.fromEntries(searchParams.entries());
    
    // VNPay usually sends data via GET return URL or POST webhook. 
    // If it's POST body:
    // const body = await req.json();

    const gateway = new VNPayAdapter();
    const verification = gateway.verifyWebhook(payload, payload.vnp_SecureHash || '');

    if (!verification.isSuccess()) {
      return NextResponse.json({ error: verification.getError().message }, { status: 400 });
    }
    
    const data = verification.getValue();
    
    if (data.status === 'success') {
      // 1. Fetch invoice
      // const invoice = await invoiceRepo.findById(data.invoiceId);
      
      // 2. Mark as paid
      // invoice.markAsPaid({ amount: data.amount, currency: 'VND' }, 'vnpay', data.transactionRef);
      // await invoiceRepo.save(invoice);
      
      // 3. Notify
      // await notificationService.notifyPaymentSuccess(invoice);
      
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    return NextResponse.json({ RspCode: '01', Message: 'Payment Failed' });
  } catch (err: any) {
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' }, { status: 500 });
  }
}
