'use server'

import { createClient } from '@/infrastructure/auth/supabase/server';

export async function saveUiSettings(theme?: string, themeColor?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Fetch current settings to merge
  const { data: profile } = await supabase
    .from('profiles')
    .select('ui_settings')
    .eq('id', user.id)
    .single();

  const currentSettings = profile?.ui_settings || {};
  const newSettings = {
    ...currentSettings,
    ...(theme !== undefined && { theme }),
    ...(themeColor !== undefined && { themeColor })
  };

  const { error } = await supabase
    .from('profiles')
    .update({ ui_settings: newSettings })
    .eq('id', user.id);

  if (error) {
    console.error('Error saving UI settings:', error);
    return { error: error.message };
  }
  
  return { success: true };
}
