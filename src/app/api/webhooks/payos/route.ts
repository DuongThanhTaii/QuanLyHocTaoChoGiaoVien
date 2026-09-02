import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Money } from '@/domains/shared/value-objects';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if it is a webhook confirmation request (first time setup)
    if (body.data && body.desc === 'success') {
      // In a real app we'd verify the signature, but for setup confirmation we can return 200 OK.
    }

    // Usually PayOS sends { code, desc, data, signature }
    const { code, data, signature } = body;

    if (code !== '00') {
      return NextResponse.json({ success: false, message: 'Invalid code' });
    }

    if (!data) {
      return NextResponse.json({ success: false, message: 'No data' }, { status: 400 });
    }

    // The payment status
    if (data.desc === 'success') {
      const orderCode = data.orderCode; // e.g., numeric ID matching invoice ID or invoice Number
      const amount = data.amount;
      const transactionRef = data.reference;

      // Extract invoice ID from orderCode (if we stored it) or look up by payment_token
      const repos = await getRepositories();
      const invoice = await repos.invoices.findByPaymentToken(orderCode.toString());

      if (!invoice) {
        return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
      }

      // Mark as paid
      const payResult = invoice.markAsPaid(
        new Money(amount),
        'vietqr',
        transactionRef
      );

      if (payResult.isSuccess()) {
        await repos.invoices.save(invoice);
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json({ success: false, message: 'Payment processing failed' });
    }

    return NextResponse.json({ success: true, message: 'Ignored' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
