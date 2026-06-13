// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = {
  family: ['/family'],
  companion: ['/companion']
};

const ALL_PROTECTED_ROUTES = [...PROTECTED_ROUTES.family, ...PROTECTED_ROUTES.companion];
const AUTH_ROUTES = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedPage = ALL_PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthPage = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // 1. لو يوزر مجهول يحاول دخول صفحة محمية -> ارميه على الـ Login
  if (!refreshToken && isProtectedPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('session', 'expired');
    return NextResponse.redirect(loginUrl);
  }

  // 2. لو يوزر مسجل وبيحاول يروح لصفحات الـ Auth (Login / Register)
  if (refreshToken && isAuthPage) {
    try {
      // فك التوكن قراءة فقط بالـ JavaScript العادية بدون مكتبات خارجية
      const base64Url = refreshToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      const userRole = payload.role; // لقطنا الـ Role بنجاح على السيرفر 

      // التوجيه التلقائي الصارم والذكي بناءً على الـ Role
      if (userRole === 'family') {
        return NextResponse.redirect(new URL('/family/dashboard', request.url));
      } else if (userRole === 'companion') {
        return NextResponse.redirect(new URL('/companion/dashboard', request.url));
      }
    } catch (err) {
      console.error("Proxy Token Decode Error:", err);
    }
    
    // Fallback لو حصل أي مشكلة في الفك، يروح للرئيسية
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/family/:path*', '/companion/:path*', '/login', '/register'],
};