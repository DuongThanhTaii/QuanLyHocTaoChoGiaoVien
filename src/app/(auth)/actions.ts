'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/auth/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type AuthActionState = {
  error?: string
  success?: boolean
  message?: string
}

function getLoginErrorMessage(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác.'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản.'
  }

  return 'Không thể đăng nhập lúc này. Vui lòng thử lại.'
}

function getAuthCallbackUrl(headerList: Headers, nextPath = '/onboarding') {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  const next = encodeURIComponent(nextPath)
  if (configuredUrl) {
    return `${configuredUrl.replace(/\/$/, '')}/auth/callback?next=${next}`
  }

  const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const protocol = headerList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')

  return host
    ? `${protocol}://${host}/auth/callback?next=${next}`
    : `http://localhost:3000/auth/callback?next=${next}`
}

export async function login(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const result = LoginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: 'Vui lòng nhập email hợp lệ và mật khẩu có ít nhất 6 ký tự.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: getLoginErrorMessage(error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Mật khẩu không khớp' }
  }

  const result = RegisterSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: 'Email không hợp lệ hoặc mật khẩu quá ngắn' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {}
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/register/verify-email?email=' + encodeURIComponent(email))
}

export async function resendEmailVerification(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const result = z.string().email().safeParse(email)

  if (!result.success) {
    return { error: 'Email không hợp lệ.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: result.data,
    options: {},
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Đã gửi lại email xác thực. Hãy kiểm tra cả mục Spam.' }
}

export async function verifySignupOtp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const token = (formData.get('token') as string || '').replace(/\s/g, '')

  if (!z.string().email().safeParse(email).success) {
    return { error: 'Email xác thực không hợp lệ. Vui lòng đăng ký lại.' }
  }

  if (!/^\d{6}$/.test(token)) {
    return { error: 'Vui lòng nhập đủ 6 chữ số của mã xác thực.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })

  if (error) {
    return { error: 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại hoặc gửi mã mới.' }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function requestPasswordReset(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const result = z.string().email().safeParse(email)

  if (!result.success) {
    return { error: 'Vui lòng nhập địa chỉ email hợp lệ.' }
  }

  const supabase = await createClient()
  const callbackUrl = getAuthCallbackUrl(await headers(), '/reset-password')
  const { error } = await supabase.auth.resetPasswordForEmail(result.data, {
    redirectTo: callbackUrl,
  })

  // Always return a generic success state to avoid exposing which emails have accounts.
  if (error) {
    console.error('Password reset request failed:', error.message)
  }

  return {
    success: true,
    message: 'Nếu email này có tài khoản Mari, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Hãy kiểm tra cả mục Spam.',
  }
}

export async function updatePassword(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Xác nhận mật khẩu chưa khớp.' }
  }

  const result = z.string().min(8, 'Mật khẩu cần có ít nhất 8 ký tự.').safeParse(password)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Mật khẩu chưa hợp lệ.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu một liên kết mới.' }
  }

  const { error } = await supabase.auth.updateUser({ password: result.data })
  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?reset=success')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
