import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/auth/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session for Supabase Auth
  const response = await updateSession(request)

  // Skip role check for auth routes and static paths
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register') || request.nextUrl.pathname.startsWith('/forgot-password') || request.nextUrl.pathname.startsWith('/reset-password') || request.nextUrl.pathname.startsWith('/auth/callback') || request.nextUrl.pathname.startsWith('/onboarding') || request.nextUrl.pathname === '/') {
    return response;
  }

  // Get user from the updated session headers/cookies (if available)
  // Actually, updateSession already verifies auth, but we need the role here.
  // Instead of fetching from DB in middleware (which is slow), we rely on a cookie 
  // or just let the (dashboard)/layout.tsx do the heavy lifting.
  // Wait, layout.tsx is Server Component, it can check safely!

  return response;
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
