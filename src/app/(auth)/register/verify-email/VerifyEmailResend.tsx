'use client'

import { useActionState, useEffect } from 'react'
import { resendEmailVerification } from '../../actions'
import { Button } from '@/components/ui/button'

const initialState = { error: '', success: false, message: '' }

export function VerifyEmailResend({ email }: { email?: string }) {
  const [state, formAction, isPending] = useActionState(resendEmailVerification, initialState)

  useEffect(() => {
    if (state.success) {
      const timer = window.setTimeout(() => window.location.reload(), 60_000)
      return () => window.clearTimeout(timer)
    }
  }, [state.success])

  if (!email) {
    return <p className="text-sm text-zinc-500">Không thấy email? Hãy quay lại đăng ký.</p>
  }

  return (
    <form action={formAction} className="w-full space-y-2 text-center">
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-zinc-500">
        Không nhận được email? Kiểm tra Spam hoặc gửi lại.
      </p>
      <Button type="submit" variant="ghost" className="w-full" disabled={isPending || state.success}>
        {isPending ? 'Đang gửi...' : state.success ? 'Đã gửi — thử lại sau 60 giây' : 'Gửi lại email xác thực'}
      </Button>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.message}</p>}
    </form>
  )
}
