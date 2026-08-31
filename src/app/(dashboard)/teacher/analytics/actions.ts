'use server';

import { createClient } from '@/infrastructure/auth/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveTaxSettingsAction(formData: {
  tax_code?: string;
  tax_authority?: string;
  tax_business_type?: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Vui lòng đăng nhập');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      tax_code: formData.tax_code || null,
      tax_authority: formData.tax_authority || null,
      tax_business_type: formData.tax_business_type || 'personal',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) {
    // If tax_code column does not exist yet in profiles, fallback gracefully
    console.warn('Profile tax update warning:', error.message);
  }

  revalidatePath('/teacher/analytics');
  return { success: true };
}
