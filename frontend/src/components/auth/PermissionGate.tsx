'use client';

import * as React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PermissionCode } from '@/lib/rbac';

interface PermissionGateProps {
  permission?: PermissionCode;
  anyOf?: readonly PermissionCode[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Ẩn/hiện các thành phần UI (nút xóa, nút duyệt, tab nhạy cảm) theo Permission RBAC.
 */
export function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const isStaffAuthenticated = useAuthStore((s) => s.isStaffAuthenticated);
  const isKdsAuthenticated = useAuthStore((s) => s.isKdsAuthenticated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  // Nếu chưa login ở chế độ demo preview không bật strict guard -> không ẩn UI mẫu
  if (!isStaffAuthenticated && !isKdsAuthenticated && process.env.NEXT_PUBLIC_ENABLE_ROUTE_GUARD !== 'true') {
    return <>{children}</>;
  }

  const allowed = permission
    ? hasPermission(permission)
    : anyOf && anyOf.length > 0
    ? hasAnyPermission(anyOf)
    : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
