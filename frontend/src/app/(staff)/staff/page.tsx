'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { homeHrefForRole } from '@/app/login/login-helpers';

export default function StaffPage() {
  const router = useRouter();
  const staffUser = useAuthStore((s) => s.staffUser);

  React.useEffect(() => {
    const destination = homeHrefForRole(staffUser?.role);
    router.replace(destination);
  }, [router, staffUser?.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F4F0] text-xs font-semibold text-[#7A6A58]">
      Đang chuyển hướng về trang chủ...
    </div>
  );
}
