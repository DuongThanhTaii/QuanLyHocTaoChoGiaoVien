import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
// Note: In a real app, you would inject the actual repository implementations
// This is a stub showing the integration point
import { SubscriptionAdminService } from '@/application/services/admin-subscription.service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const enabled = Boolean(body.enabled);

    // Dependencies would be injected here
    // const adminService = new SubscriptionAdminService(
    //   subscriptionRepo, planRepo, configRepo, userRepo
    // );
    // const result = await adminService.toggleBillingMode(user.id, enabled);

    // Stub response for now
    const result = { isSuccess: () => true, getError: () => new Error('Stub error') };

    if (result.isSuccess()) {
      return NextResponse.json({ success: true, enabled });
    } else {
      return NextResponse.json({ error: result.getError().message }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
