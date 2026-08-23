import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/auth/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session for Supabase Auth
  const response = await updateSession(request)

  const isTeacherRoute = request.nextUrl.pathname.startsWith('/teacher')
  
  if (isTeacherRoute) {
    // Basic Subscription Guard implementation
    // A more complex implementation would fetch the subscription from the database.
    // For now, we rely on updateSession logic to redirect if not authenticated.
    // We could check user_metadata.role here or rely on layouts.
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (external webhooks)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
