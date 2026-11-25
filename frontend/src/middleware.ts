import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessRoute } from '@/lib/rbac';

/**
 * Next.js Edge Middleware bảo vệ Route theo RBAC (khi NEXT_PUBLIC_ENABLE_ROUTE_GUARD=true).
 * Lưu ý: Đây là lớp bảo vệ điều hướng UX; Backend Spring Security (@PreAuthorize + JWT)
 * luôn là lớp kiểm tra quyền thực sự.
 */
export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENABLE_ROUTE_GUARD !== 'true') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Bỏ qua static assets và API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const role = request.cookies.get('ros_role')?.value ?? null;
  const isKds = request.cookies.get('ros_kds')?.value === '1';

  if (!canAccessRoute(pathname, role, isKds)) {
    const target = pathname.startsWith('/kds') ? '/kds/login' : '/login';
    const loginUrl = new URL(target, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
