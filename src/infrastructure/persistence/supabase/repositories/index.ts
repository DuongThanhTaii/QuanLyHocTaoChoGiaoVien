import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseUserRepository } from './user.repository';
import { SupabaseClassRepository } from './class.repository';
import { SupabaseEnrollmentRepository } from './enrollment.repository';
import { SupabaseScheduleRepository } from './schedule.repository';
import { SupabaseAttendanceRepository } from './attendance.repository';
import { SupabaseContentRepository } from './content.repository';
import { SupabaseInvoiceRepository } from './invoice.repository';
import { SupabasePlanRepository } from './plan.repository';
import { SupabaseSubscriptionRepository } from './subscription.repository';
import { SupabaseSystemConfigRepository } from './system-config.repository';
import { SupabaseAnalyticsRepository } from './analytics.repository';
import { SupabaseChatRepository } from './chat.repository';

export interface Repositories {
  users: SupabaseUserRepository;
  classes: SupabaseClassRepository;
  enrollments: SupabaseEnrollmentRepository;
  schedules: SupabaseScheduleRepository;
  attendance: SupabaseAttendanceRepository;
  content: SupabaseContentRepository;
  invoices: SupabaseInvoiceRepository;
  plans: SupabasePlanRepository;
  subscriptions: SupabaseSubscriptionRepository;
  systemConfig: SupabaseSystemConfigRepository;
  analytics: SupabaseAnalyticsRepository;
  chat: SupabaseChatRepository;
}

export function createRepositories(client: SupabaseClient): Repositories {
  return {
    users: new SupabaseUserRepository(client),
    classes: new SupabaseClassRepository(client),
    enrollments: new SupabaseEnrollmentRepository(client),
    schedules: new SupabaseScheduleRepository(client),
    attendance: new SupabaseAttendanceRepository(client),
    content: new SupabaseContentRepository(client),
    invoices: new SupabaseInvoiceRepository(client),
    plans: new SupabasePlanRepository(client),
    subscriptions: new SupabaseSubscriptionRepository(client),
    systemConfig: new SupabaseSystemConfigRepository(client),
    analytics: new SupabaseAnalyticsRepository(client),
    chat: new SupabaseChatRepository(client)
  };
}

export * from './user.repository';
export * from './class.repository';
export * from './enrollment.repository';
export * from './schedule.repository';
export * from './attendance.repository';
export * from './content.repository';
export * from './invoice.repository';
export * from './plan.repository';
export * from './subscription.repository';
export * from './system-config.repository';
export * from './analytics.repository';
export * from './chat.repository';
