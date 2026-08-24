import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
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

    const repos = await getRepositories();
    const adminService = new SubscriptionAdminService(
      repos.subscriptions,
      repos.plans,
      repos.systemConfig,
      repos.users
    );
    
    const result = await adminService.toggleBillingMode(user.id, enabled);

    if (result.isSuccess()) {
      return NextResponse.json({ success: true, enabled });
    } else {
      return NextResponse.json({ error: result.getError().message }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
