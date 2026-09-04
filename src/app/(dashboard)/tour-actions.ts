'use server';

import { createClient } from '@/infrastructure/auth/supabase/server';

export async function completeTeacherProductTour() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập.' };

  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('ui_settings')
    .eq('id', user.id)
    .single();
  if (readError) return { error: readError.message };

  const settings = (profile?.ui_settings || {}) as Record<string, unknown>;
  const tours = (settings.tours || {}) as Record<string, unknown>;
  const teacherSetup = (tours.teacher_setup_v1 || {}) as Record<string, unknown>;
  const { error } = await supabase
    .from('profiles')
    .update({
      ui_settings: {
        ...settings,
        tours: {
          ...tours,
          teacher_setup_v1: { ...teacherSetup, completedAt: new Date().toISOString() },
        },
      },
    })
    .eq('id', user.id);

  return error ? { error: error.message } : { success: true };
}
