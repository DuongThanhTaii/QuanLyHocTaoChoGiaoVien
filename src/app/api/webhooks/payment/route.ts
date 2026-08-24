import { NextRequest, NextResponse } from 'next/server';
import { VNPayAdapter } from '@/infrastructure/payment/vnpay.adapter';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Money } from '@/domains/shared/value-objects';

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const payload = Object.fromEntries(searchParams.entries());

    const gateway = new VNPayAdapter();
    const verification = gateway.verifyWebhook(payload, payload.vnp_SecureHash || '');

    if (!verification.isSuccess()) {
      return NextResponse.json({ error: verification.getError().message }, { status: 400 });
    }
    
    const data = verification.getValue();
    
    if (data.status === 'success') {
      const repos = await getRepositories();
      
      // 1. Fetch invoice
      const invoice = await repos.invoices.findById(data.invoiceId);
      if (!invoice) {
        return NextResponse.json({ RspCode: '01', Message: 'Invoice not found' }, { status: 404 });
      }
      
      // 2. Mark as paid
      const payResult = invoice.markAsPaid(
        new Money(data.amount),
        'vnpay',
        data.transactionRef
      );
      
      if (payResult.isSuccess()) {
        await repos.invoices.save(invoice);
        return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
      }
      
      return NextResponse.json({ RspCode: '01', Message: 'Payment processing failed' });
    }

    return NextResponse.json({ RspCode: '01', Message: 'Payment Failed' });
  } catch (err: any) {
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' }, { status: 500 });
  }
}
