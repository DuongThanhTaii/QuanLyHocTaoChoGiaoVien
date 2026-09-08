'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { ClassService } from '@/application/services/class.service';
import { Money } from '@/domains/shared/value-objects';
import { v4 as uuidv4 } from 'uuid';

const CreateClassWizardSchema = z.object({
  name: z.string().min(2),
  subject: z.string().optional(),
  feeAmount: z.coerce.number().min(0),
  feeType: z.enum(['per_session', 'per_month', 'per_course']),
  color: z.string().optional(),
  description: z.string().optional(),
  location: z.string().trim().max(500).optional(),
  onlineMeetingUrl: z.union([z.string().trim().url(), z.literal('')]).optional(),
  scheduleType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  weekDays: z.array(z.string()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  studentContacts: z.string().optional()
});

export async function createClassWizard(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Bạn cần đăng nhập để tạo lớp học.' };
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if ((roleData?.role || profileData?.role) !== 'teacher') {
    return { error: 'Bạn không có quyền tạo lớp học.' };
  }

  const rawData = {
    name: formData.get('name'),
    subject: formData.get('subject'),
    feeAmount: formData.get('feeAmount'),
    feeType: formData.get('feeType') || 'per_session',
    color: formData.get('color'),
    description: formData.get('description'),
    location: formData.get('location'),
    onlineMeetingUrl: formData.get('onlineMeetingUrl'),
    scheduleType: formData.get('scheduleType'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    weekDays: formData.getAll('weekDays'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    studentContacts: formData.get('studentContacts')
  };

  const parsed = CreateClassWizardSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map((e: any) => e.message).join(', ');
    return { error: 'Invalid data: ' + errorMessages };
  }

  if (parsed.data.scheduleType === 'fixed' && !isValidTimeRange(parsed.data.startTime, parsed.data.endTime)) {
    return { error: 'Giờ kết thúc phải sau giờ bắt đầu.' };
  }

  // 1. Create Class
  const repos = await getRepositories();
  const classService = new ClassService(repos.classes, repos.enrollments);
  
  const classResult = await classService.createClass({
    teacherId: user.id,
    name: parsed.data.name,
    subject: parsed.data.subject,
    feePerSession: new Money(parsed.data.feeAmount), // Renamed from feePerSession to feeAmount in our context, but Domain expects feePerSession (representing fee magnitude)
    feeType: parsed.data.feeType,
    color: parsed.data.color,
    description: parsed.data.description,
    location: parsed.data.location || undefined,
    onlineMeetingUrl: parsed.data.onlineMeetingUrl || undefined,
    isActive: true
  });

  if (!classResult.isSuccess()) {
    return { error: classResult.getError().message };
  }

  const classId = classResult.getValue().id;

  // These records are created as part of a teacher-only server action. Use the
  // service-role client so the enrollment is not silently blocked by a missing
  // or outdated client-side RLS policy.
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Add any students entered during the class-creation wizard.
  try {
    const contacts = JSON.parse(parsed.data.studentContacts || '[]') as Array<{ email?: string; phone?: string }>;
    for (const contact of contacts) {
      const email = contact.email?.trim() || null;
      const phone = contact.phone?.trim() || null;
      if (!email && !phone) continue;

      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({ full_name: email || phone, email, phone })
        .select('id')
        .single();

      if (studentError || !student) throw studentError ?? new Error('Không thể tạo hồ sơ học sinh');

      const { error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .insert({ class_id: classId, student_id: student.id, status: 'ACTIVE' });

      if (enrollmentError) throw enrollmentError;
    }
  } catch (error) {
    console.error('Failed to add students during class creation:', error);
  }

  // 2. Generate random 6-char Join Code
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const tokenHash = uuidv4();

  // 3. Create Class Invitation
  const { error: invError } = await supabaseAdmin.from('class_invitations').insert({
    class_id: classId,
    join_code: joinCode,
    token_hash: tokenHash,
    type: 'GENERAL',
    status: 'ACTIVE'
  });

  if (invError) {
    console.error('Failed to create invitation', invError);
  }

  // 4. Generate Schedule Sessions if Fixed
  if (parsed.data.scheduleType === 'fixed' && parsed.data.startDate && parsed.data.weekDays && parsed.data.weekDays.length > 0) {
    try {
      const start = parseCalendarDate(parsed.data.startDate);
      const end = parsed.data.endDate ? parseCalendarDate(parsed.data.endDate) : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 90); // default to 90 days if no end date
      
      const dayMap: Record<string, number> = {
        'Chủ nhật': 0,
        'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6
      };
      const allowedDays = parsed.data.weekDays.map(d => dayMap[d]).filter(d => d !== undefined);
      const startTime = parsed.data.startTime || '18:00';
      const endTime = parsed.data.endTime || '19:30';

      // Persist the recurring schedule as well as individual sessions. The
      // timetable pages read schedule_slots, while attendance and invoicing
      // use class_sessions.
      const { data: scheduleSlots, error: scheduleSlotsError } = await supabaseAdmin
        .from('schedule_slots')
        .insert(allowedDays.map((dayOfWeek) => ({
          class_id: classId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_recurring: true,
          valid_from: parsed.data.startDate,
          valid_until: parsed.data.endDate || null,
        })))
        .select('id, day_of_week');

      if (scheduleSlotsError) throw scheduleSlotsError;
      const slotIdsByDay = new Map((scheduleSlots || []).map((slot) => [slot.day_of_week, slot.id]));
      
      let currentDate = new Date(start);
      const sessionsToInsert = [];
      let sessionOrder = 1;

      while (currentDate <= end) {
        if (allowedDays.includes(currentDate.getDay())) {
          const dateStr = formatCalendarDate(currentDate);
          sessionsToInsert.push({
            class_id: classId,
            schedule_slot_id: slotIdsByDay.get(currentDate.getDay()),
            session_date: dateStr,
            start_time: startTime,
            end_time: endTime,
            title: `Buổi ${sessionOrder}`,
            status: 'SCHEDULED'
          });
          sessionOrder++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (sessionsToInsert.length > 0) {
        const { error: sessionErr } = await supabaseAdmin.from('class_sessions').insert(sessionsToInsert);
        if (sessionErr) console.error('Failed to generate sessions:', sessionErr);
      }
    } catch (err) {
      console.error('Session generation error:', err);
    }
  }

  revalidatePath('/teacher/classes');
  revalidatePath(`/teacher/classes/${classId}/schedule`);
  revalidatePath('/teacher/schedule');
  revalidatePath('/student/schedule');
  revalidatePath('/parent/schedule');
  // Redirect to the success screen of the wizard or the class workspace
  redirect(`/teacher/classes/${classId}/settings?success=true&code=${joinCode}`);
}

function isValidTimeRange(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return false;
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(startTime) || !timePattern.test(endTime)) return false;

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return toMinutes(endTime) > toMinutes(startTime);
}

function parseCalendarDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const AddStudentManualSchema = z.object({
  classId: z.string().uuid(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

const UpdateClassSettingsSchema = z.object({
  classId: z.string().uuid(), name: z.string().min(2), subject: z.string().optional(), description: z.string().optional(),
  location: z.string().trim().max(500).optional(), onlineMeetingUrl: z.union([z.string().trim().url(), z.literal('')]).optional(),
  feeAmount: z.coerce.number().min(0), feeType: z.enum(['per_session', 'per_month', 'per_course']), color: z.string()
});

export async function updateClassSettings(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const parsed = UpdateClassSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!user || user.user_metadata?.role !== 'teacher') return { error: 'Bạn không có quyền chỉnh sửa lớp này.' };
  if (!parsed.success) return { error: 'Thông tin lớp học chưa hợp lệ.' };
  const { classId, feeAmount, ...data } = parsed.data;
  const { error } = await supabase.from('classes').update({ name: data.name, subject: data.subject || null, description: data.description || null, location: data.location || null, online_meeting_url: data.onlineMeetingUrl || null, fee_per_session: feeAmount, fee_type: data.feeType, color: data.color }).eq('id', classId).eq('teacher_id', user.id);
  if (error) return { error: error.message };
  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/student/classes/${classId}`);
  revalidatePath('/teacher/schedule');
  revalidatePath('/student/schedule');
  revalidatePath('/parent/schedule');
  return { success: true };
}

export async function generateClassInvitationCode(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'teacher') return { error: 'Bạn không có quyền.' };

  // Verify ownership
  const { data: clazz } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
  if (!clazz || clazz.teacher_id !== user.id) return { error: 'Lớp học không thuộc về bạn.' };

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const tokenHash = uuidv4();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS
  );

  const { error } = await supabaseAdmin.from('class_invitations').insert({
    class_id: classId,
    join_code: joinCode,
    token_hash: tokenHash,
    type: 'GENERAL',
    status: 'ACTIVE'
  });

  if (error) return { error: error.message };
  
  revalidatePath('/teacher/classes', 'layout');
  revalidatePath('/student/classes', 'layout');
  return { success: true };
}

export async function addStudentManual(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const parsed = AddStudentManualSchema.safeParse({
    classId: formData.get('classId'),
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
  });

  if (!parsed.success) return { error: 'Invalid data' };

  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: classroom } = await supabaseAdmin.from('classes').select('teacher_id').eq('id', parsed.data.classId).maybeSingle();
    if (!classroom || classroom.teacher_id !== user.id) return { error: 'Bạn không có quyền thêm học sinh vào lớp này.' };

    const email = parsed.data.email?.trim().toLowerCase() || null;
    let accountId: string | null = null;
    if (email) {
      const { data: accounts } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      accountId = accounts?.users.find((account) => account.email?.toLowerCase() === email)?.id || null;
    }

    let student = null as any;
    if (email) {
      const { data } = await supabaseAdmin.from('students').select('*').ilike('email', email).limit(1).maybeSingle();
      student = data;
    }

    if (student) {
      const { error: updateError } = await supabaseAdmin.from('students').update({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || student.phone || null,
        email,
        user_id: student.user_id || accountId,
      }).eq('id', student.id);
      if (updateError) throw updateError;
    } else {
      const { data, error: studentError } = await supabaseAdmin.from('students').insert({
        full_name: parsed.data.fullName, phone: parsed.data.phone || null, email, user_id: accountId,
      }).select().single();
      if (studentError || !data) throw studentError ?? new Error('Không thể tạo hồ sơ học sinh');
      student = data;
    }

    const { data: existingEnrollment } = await supabaseAdmin.from('enrollments')
      .select('id').eq('class_id', parsed.data.classId).eq('student_id', student.id).maybeSingle();
    if (existingEnrollment) return { error: 'Học sinh này đã có trong lớp.' };

    const { error: enrollmentError } = await supabaseAdmin.from('enrollments').insert({ class_id: parsed.data.classId, student_id: student.id, status: 'ACTIVE' });
    if (enrollmentError) throw enrollmentError;
  } catch (err: any) {
    return { error: err.message || 'Lỗi khi thêm học sinh' };
  }

  revalidatePath(`/teacher/classes/${parsed.data.classId}/students`);
  revalidatePath('/student/classes');
  return { success: true };
}

export async function removeStudentFromClass(enrollmentId: string, classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập.' };
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const [{ data: classroom }, { data: enrollment }] = await Promise.all([
    supabaseAdmin.from('classes').select('teacher_id').eq('id', classId).maybeSingle(),
    supabaseAdmin.from('enrollments').select('id, class_id').eq('id', enrollmentId).maybeSingle(),
  ]);
  if (!classroom || classroom.teacher_id !== user.id || !enrollment || enrollment.class_id !== classId) return { error: 'Bạn không có quyền xóa học sinh này.' };
  const { error } = await supabaseAdmin.from('enrollments').delete().eq('id', enrollmentId);
  if (error) return { error: error.message };
  revalidatePath(`/teacher/classes/${classId}/students`);
  revalidatePath('/student/classes');
  return { success: true };
}

const UpdateStudentSchema = z.object({
  studentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  fullName: z.string().min(2),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'PENDING', 'PAUSED', 'LEFT', 'BLOCKED']),
});

export async function updateStudent(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'teacher') return { error: 'Unauthorized' };

  const parsed = UpdateStudentSchema.safeParse({
    studentId: formData.get('studentId'),
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    enrollmentId: formData.get('enrollmentId'),
    status: formData.get('status'),
  });

  if (!parsed.success) return { error: 'Dữ liệu không hợp lệ' };

  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the student record
    const { error } = await supabaseAdmin
      .from('students')
      .update({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      })
      .eq('id', parsed.data.studentId);

    if (error) throw new Error(error.message);
    const { error: enrollmentError } = await supabaseAdmin.from('enrollments').update({ status: parsed.data.status, left_at: parsed.data.status === 'LEFT' ? new Date().toISOString() : null }).eq('id', parsed.data.enrollmentId);
    if (enrollmentError) throw new Error(enrollmentError.message);
  } catch (err: any) {
    return { error: err.message || 'Lỗi khi cập nhật học sinh' };
  }

  // We should revalidate the path, but we don't have classId here easily. 
  // We can just revalidate the general paths or pass classId in formData.
  const classId = formData.get('classId');
  if (classId) {
    revalidatePath(`/teacher/classes/${classId}/students`);
  }
  
  return { success: true };
}

export async function approveEnrollment(enrollmentId: string, classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  if (!user) return { error: 'Bạn không có quyền duyệt yêu cầu.' };

  // user_metadata is not updated for accounts created before the role system.
  // The class ownership check below is the authoritative permission check.
  const { data: enrollment } = await supabaseAdmin.from('enrollments').select('class_id').eq('id', enrollmentId).single();
  const { data: classroom } = await supabaseAdmin.from('classes').select('teacher_id').eq('id', enrollment?.class_id).single();
  if (!enrollment || !classroom || classroom.teacher_id !== user.id || enrollment.class_id !== classId) return { error: 'Yêu cầu không hợp lệ.' };
  const { error } = await supabaseAdmin.from('enrollments').update({ status: 'ACTIVE', left_at: null }).eq('id', enrollmentId);
  if (error) return { error: error.message };
  revalidatePath(`/teacher/classes/${classId}/students`);
  revalidatePath('/student/classes');
  return { success: true };
}

export async function joinClassByCode(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để tham gia lớp' };

  const rawCode = formData.get('code')?.toString().trim() || '';
  const code = (rawCode.match(/\/join\/([^/?#]+)/i)?.[1] || rawCode).toUpperCase();
  if (!code) return { error: 'Mã lớp không hợp lệ' };

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Find invitation
  const { data: invitation } = await supabaseAdmin
    .from('class_invitations')
    .select('class_id, status')
    .eq('join_code', code)
    .single();

  if (!invitation || invitation.status !== 'ACTIVE') {
    return { error: 'Mã lớp không tồn tại hoặc đã hết hạn' };
  }

  const classId = invitation.class_id;
  const { data: classroom } = await supabaseAdmin
    .from('classes')
    .select('name')
    .eq('id', classId)
    .maybeSingle();
  const className = classroom?.name || 'này';
  const repos = await getRepositories();

  // 2. Find or create Student profile for this user
  let student = await repos.students.findByUserId(user.id);
  
  if (!student) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    let matchedStudent = null;
    const claim = formData.get('claim')?.toString();
    
    if (claim) {
      // Teacher gave a specific student ID to claim
      const { data: claimStudent } = await supabaseAdmin.from('students').select('*').eq('id', claim).is('user_id', null).single();
      if (claimStudent) {
        matchedStudent = claimStudent;
      }
    }
    
    // Attempt to match by phone or email for unlinked student records if no claim or claim failed
    if (!matchedStudent && (profile?.email || profile?.phone)) {
      let query = supabaseAdmin.from('students').select('*').is('user_id', null);
      if (profile.email && profile.phone) {
        query = query.or(`email.eq.${profile.email},phone.eq.${profile.phone}`);
      } else if (profile.email) {
        query = query.eq('email', profile.email);
      } else if (profile.phone) {
        query = query.eq('phone', profile.phone);
      }
      
      const { data: matches } = await query;
      
      if (matches && matches.length > 0) {
        matchedStudent = matches[0];
      }
    }
    
    if (matchedStudent) {
      const { error: updateError } = await supabaseAdmin.from('students')
        .update({ user_id: user.id })
        .eq('id', matchedStudent.id);
        
      if (!updateError) {
        student = matchedStudent;
      }
    }

    if (!student) {
      student = await repos.students.create({
        user_id: user.id,
        full_name: profile?.full_name || 'Học sinh',
        phone: profile?.phone,
        email: profile?.email
      });
    }
  }

  // 3. Do not create a duplicate request for a class the student already joined.
  const { data: existingEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('status')
    .eq('class_id', classId)
    .eq('student_id', student.id)
    .maybeSingle();

  if (existingEnrollment) {
    if (existingEnrollment.status === 'ACTIVE') {
      return { success: `Bạn đã tham gia lớp ${className}.` };
    }
    if (existingEnrollment.status === 'PENDING') {
      return { success: `Yêu cầu tham gia lớp ${className} của bạn đang chờ giáo viên duyệt.` };
    }
    return { error: `Bạn hiện không thể gửi yêu cầu mới vào lớp ${className}. Vui lòng liên hệ giáo viên.` };
  }

  // 4. Create Enrollment
  const { error } = await supabase.from('enrollments').insert({
    class_id: classId,
    student_id: student.id,
    status: 'PENDING'
  });

  if (error && error.code !== '23505') {
    return { error: error.message };
  }

  revalidatePath('/student/classes');
  redirect('/student/classes?join=pending');
}

export async function deleteClass(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const repos = await getRepositories();
  const classroom = await repos.classes.findById(classId);
  
  if (!classroom || classroom.teacherId !== user.id) {
    return { error: 'Class not found or unauthorized' };
  }
  
  try {
    await repos.classes.delete(classId);
  } catch (e: any) {
    return { error: e.message };
  }
  
  revalidatePath('/teacher/classes');
  redirect('/teacher/classes');
}
