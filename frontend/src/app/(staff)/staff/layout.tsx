'use client';

import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { homeHrefForRole } from '@/app/login/login-helpers';
import {
  CHEF_QUICK_ACTIONS,
  WAITER_QUICK_ACTIONS,
  usePosQuickActions,
} from '@/components/staff/QuickActions';

export default function StaffSegmentLayout({ children }: { children: React.ReactNode }) {
  const staffUser = useAuthStore((s) => s.staffUser);
  const posActions = usePosQuickActions();

  const homeHref = (homeHrefForRole(staffUser?.role) as '/staff' | '/pos' | '/chef' | '/wait') || '/chef';

  const quickActions =
    staffUser?.role === 'WAITER'
      ? WAITER_QUICK_ACTIONS
      : staffUser?.role === 'CASHIER'
      ? posActions
      : CHEF_QUICK_ACTIONS;

  const homeHref =
    staffUser?.role === 'WAITER'
      ? '/wait'
      : staffUser?.role === 'CASHIER'
      ? '/pos'
      : '/chef';

  return (
    <StaffLayout homeHref={homeHref} quickActions={quickActions}>
      {children}
    </StaffLayout>
  );
}
