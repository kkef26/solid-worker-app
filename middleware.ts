import { NextRequest, NextResponse } from 'next/server';

// No server-side session check needed — client manages JWT in localStorage
// Middleware only handles root redirect
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to worker login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/worker/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
