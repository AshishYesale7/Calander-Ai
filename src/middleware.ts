
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_ROOT = '/dashboard';
const AUTH_PAGES = ['/auth/signin', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // This is not for security, but for UX. It hints that a user session might exist.
  // The true security check happens client-side in the main app layout.
  // We check for a generic Firebase cookie that indicates some persistence state.
  const hasSessionHint = request.cookies.getAll().some(cookie => cookie.name.startsWith('firebase:authUser'));
  
  // If a user seems logged in and is on an auth page, send them to the dashboard.
  if (hasSessionHint && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
  }

  // Allow all other requests to proceed. Client-side logic in /src/app/(app)/layout.tsx
  // will handle redirecting unauthenticated users from protected pages.
  return NextResponse.next();
}

export const config = {
  // This matcher now only runs the middleware on the auth pages where it's needed.
  matcher: [
    '/auth/signin',
    '/auth/signup',
  ],
};
