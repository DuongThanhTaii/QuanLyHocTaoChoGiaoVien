import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { SupabaseStorageAdapter } from '@/infrastructure/storage/supabase-storage.adapter';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { filename, fileType, classId } = await req.json();
    
    // Validate inputs
    if (!filename || !classId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const storage = new SupabaseStorageAdapter(supabase);
    const path = `classes/${classId}/${Date.now()}_${filename}`;
    const signedUrl = await storage.createSignedUploadUrl(path, fileType);

    return NextResponse.json({ signedUrl, path });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
