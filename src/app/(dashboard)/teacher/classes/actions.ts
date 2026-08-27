'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { ClassService } from '@/application/services/class.service';
import { Money } from '@/domains/shared/value-objects';
import { v4 as uuidv4 } from 'uuid';

const CreateClassWizardSchema = z.object({
  name: z.string().min(2),
  subject: z.string().optional(),
  feePerSession: z.coerce.number().min(0),
  color: z.string().optional(),
  description: z.string().optional(),
  scheduleType: z.string().optional(), // 'fixed', 'flexible', 'none'
  // More schedule fields can be added here
});

export async function createClassWizard(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name'),
    subject: formData.get('subject'),
    feePerSession: formData.get('feePerSession'),
    color: formData.get('color'),
    description: formData.get('description'),
    scheduleType: formData.get('scheduleType'),
  };

  const parsed = CreateClassWizardSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  // 1. Create Class
  const repos = await getRepositories();
  const classService = new ClassService(repos.classes, repos.enrollments);
  
  const classResult = await classService.createClass({
    teacherId: user.id,
    name: parsed.data.name,
    subject: parsed.data.subject,
    feePerSession: new Money(parsed.data.feePerSession),
    feeType: 'per_session' as const,
    color: parsed.data.color,
    description: parsed.data.description,
    isActive: true
  });

  if (!classResult.isSuccess()) {
    return { error: classResult.getError().message };
  }

  const classId = classResult.getValue().id;

  // 2. Generate random 6-char Join Code
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const tokenHash = uuidv4();

  // 3. Create Class Invitation
  const { error: invError } = await supabase.from('class_invitations').insert({
    class_id: classId,
    join_code: joinCode,
    token_hash: tokenHash,
    type: 'GENERAL',
    status: 'ACTIVE'
  });

  if (invError) {
    console.error('Failed to create invitation', invError);
  }

  revalidatePath('/teacher/classes');
  // Redirect to the success screen of the wizard or the class workspace
  redirect(`/teacher/classes/${classId}/settings?success=true&code=${joinCode}`);
}

const AddStudentManualSchema = z.object({
  classId: z.string().uuid(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

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

  const repos = await getRepositories();

  // 1. Check if student already exists by phone/email (simplified for now, ideally search globally)
  // Here we just create a new standalone student record
  const student = await repos.students.create({
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
  });

  // 2. Create Enrollment
  const { error } = await supabase.from('enrollments').insert({
    class_id: parsed.data.classId,
    student_id: student.id,
    status: 'ACTIVE'
  });

  if (error) return { error: error.message };

  revalidatePath(`/teacher/classes/${parsed.data.classId}/students`);
  return { success: true };
}

export async function joinClassByCode(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để tham gia lớp' };

  const code = formData.get('code')?.toString().toUpperCase().trim();
  if (!code) return { error: 'Mã lớp không hợp lệ' };

  // 1. Find invitation
  const { data: invitation } = await supabase
    .from('class_invitations')
    .select('class_id, status')
    .eq('join_code', code)
    .single();

  if (!invitation || invitation.status !== 'ACTIVE') {
    return { error: 'Mã lớp không tồn tại hoặc đã hết hạn' };
  }

  const classId = invitation.class_id;
  const repos = await getRepositories();

  // 2. Find or create Student profile for this user
  let student = await repos.students.findByUserId(user.id);
  if (!student) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    student = await repos.students.create({
      user_id: user.id,
      full_name: profile?.full_name || 'Học sinh',
      phone: profile?.phone,
      email: profile?.email
    });
  }

  // 3. Create Enrollment
  const { error } = await supabase.from('enrollments').insert({
    class_id: classId,
    student_id: student.id,
    status: 'PENDING'
  });

  if (error) {
    if (error.code === '23505') return { error: 'Bạn đã tham gia lớp này rồi' };
    return { error: error.message };
  }

  revalidatePath('/student/classes');
  redirect(`/student/classes/${classId}`);
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
