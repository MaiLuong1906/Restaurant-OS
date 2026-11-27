'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { canAccessRoute, type PermissionCode } from '@/lib/rbac';

interface RoleGuardProps {
  requiredPermissions?: readonly PermissionCode[];
  allowKdsSession?: boolean;
  loginHref?: string;
  children: React.ReactNode;
}

/**
 * Client-side Route Guard đồng bộ với RBAC Backend.
 * - Tự động kiểm tra quyền chi tiết theo từng route (pathname) qua canAccessRoute().
 * - Khi chưa bật NEXT_PUBLIC_ENABLE_ROUTE_GUARD=true và chưa đăng nhập: giữ tương thích chế độ demo preview.
 */
export function RoleGuard({
  requiredPermissions = [],
  allowKdsSession = false,
  loginHref = '/login',
  children,
}: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const staffUser = useAuthStore((s) => s.staffUser);
  const permissions = useAuthStore((s) => s.permissions);
  const isStaffAuthenticated = useAuthStore((s) => s.isStaffAuthenticated);
  const isKdsAuthenticated = useAuthStore((s) => s.isKdsAuthenticated);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const strictGuard = process.env.NEXT_PUBLIC_ENABLE_ROUTE_GUARD === 'true';
  const isLoggedIn = isStaffAuthenticated || (allowKdsSession && isKdsAuthenticated);

  React.useEffect(() => {
    if (!isLoggedIn && strictGuard && typeof window !== 'undefined') {
      router.replace(`${loginHref}?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoggedIn, strictGuard, loginHref, pathname, router]);

  if (!isLoggedIn) {
    if (!strictGuard) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-ops-border rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ops-ink">Yêu cầu đăng nhập</h2>
            <p className="text-xs text-ops-muted">
              Vui lòng đăng nhập tài khoản nhân sự để truy cập khu vực vận hành này.
            </p>
          </div>
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-ops-brand text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ops-brand-dark transition-colors"
          >
            Đi tới trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const allowedByRoute = canAccessRoute(
    pathname,
    staffUser?.role ?? null,
    allowKdsSession && isKdsAuthenticated,
    permissions,
  );
  const allowedByProps =
    requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);

  if (!allowedByRoute || !allowedByProps) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-rose-800">403 — Không có quyền truy cập</h2>
            <p className="text-xs text-ops-muted">
              Vai trò hiện tại của bạn không được cấp quyền sử dụng chức năng này. Vui lòng liên hệ Quản lý hoặc Chủ nhà hàng.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-ops-border text-ops-ink text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ops-bg transition-colors"
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
