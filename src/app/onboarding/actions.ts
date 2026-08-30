'use server'

import { createClient } from '@/infrastructure/auth/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const TeacherProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
})

const StudentProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  school: z.string().optional(),
})

const GuardianProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
})

export async function completeTeacherOnboarding(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  const result = TeacherProfileSchema.safeParse({ fullName, phone })
  if (!result.success) return { error: 'Invalid input' }

  // 1. Update profiles (status = ACTIVE, full_name, role)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone, status: 'ACTIVE', role: 'teacher' })
    .eq('id', user.id)
  
  if (profileError) return { error: profileError.message }

  // 2. Insert user_roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'teacher', is_primary: true })

  if (roleError) return { error: roleError.message }

  // 3. Insert teacher_profiles
  const { error: teacherError } = await supabase
    .from('teacher_profiles')
    .upsert({ user_id: user.id, phone })

  if (teacherError) return { error: teacherError.message }

  // 4. Update auth metadata for backward compatibility
  await supabase.auth.updateUser({
    data: { role: 'teacher', full_name: fullName }
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function completeStudentOnboarding(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string
  const school = formData.get('school') as string

  const result = StudentProfileSchema.safeParse({ fullName, phone, school })
  if (!result.success) return { error: 'Invalid input' }

  // 1. Update profiles (status = ACTIVE, full_name, role)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone, status: 'ACTIVE', role: 'student' })
    .eq('id', user.id)
  
  if (profileError) return { error: profileError.message }

  // 2. Insert user_roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'student', is_primary: true })

  if (roleError) return { error: roleError.message }

  // 3. Insert student_profiles
  const { error: studentError } = await supabase
    .from('student_profiles')
    .upsert({ user_id: user.id, phone, school })

  if (studentError) return { error: studentError.message }

  // 4. Update auth metadata for backward compatibility
  await supabase.auth.updateUser({
    data: { role: 'student', full_name: fullName }
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function completeGuardianOnboarding(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  const result = GuardianProfileSchema.safeParse({ fullName, phone })
  if (!result.success) return { error: 'Invalid input' }

  // 1. Update profiles (status = ACTIVE, full_name, role)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone, status: 'ACTIVE', role: 'parent' })
    .eq('id', user.id)
  
  if (profileError) return { error: profileError.message }

  // 2. Insert user_roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'parent', is_primary: true }) // Using 'parent' or 'guardian'? Enum says 'parent'

  if (roleError) return { error: roleError.message }

  // 3. Insert guardian_profiles
  const { error: guardianError } = await supabase
    .from('guardian_profiles')
    .upsert({ user_id: user.id, phone })

  if (guardianError) return { error: guardianError.message }

  // 4. Update auth metadata for backward compatibility
  await supabase.auth.updateUser({
    data: { role: 'parent', full_name: fullName }
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
