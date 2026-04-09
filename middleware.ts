import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/worker/login', '/api/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths, static assets, and all API routes (they handle their own auth)
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check for session cookie (set by /worker/login page on successful auth)
  const token = request.cookies.get('worker_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/worker/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
