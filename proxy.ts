import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = {
  family: ['/family'],
  companion: ['/companion'],
  onboarding: ['/onboarding']
};

const AUTH_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
 const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isProtectedRoute = [...PROTECTED_ROUTES.family, ...PROTECTED_ROUTES.companion, ...PROTECTED_ROUTES.onboarding].some(
    route => pathname.startsWith(route)
  );
  
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // 1. إذا حاول دخول مسار محمي بدون توكن -> توجيه إلى تسجيل الدخول
  if (isProtectedRoute && !refreshToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && refreshToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/family/:path*',
    '/companion/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
  ],
};