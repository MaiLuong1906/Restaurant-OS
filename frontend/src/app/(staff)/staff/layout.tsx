'use client';

import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  CHEF_QUICK_ACTIONS,
  WAITER_QUICK_ACTIONS,
  usePosQuickActions,
} from '@/components/staff/QuickActions';

export default function StaffSegmentLayout({ children }: { children: React.ReactNode }) {
  const staffUser = useAuthStore((s) => s.staffUser);
  const posActions = usePosQuickActions();

  const quickActions =
    staffUser?.role === 'WAITER'
      ? WAITER_QUICK_ACTIONS
      : staffUser?.role === 'CASHIER'
      ? posActions
      : CHEF_QUICK_ACTIONS;

  return (
    <StaffLayout homeHref="/chef" quickActions={quickActions}>
      {children}
    </StaffLayout>
  );
}
