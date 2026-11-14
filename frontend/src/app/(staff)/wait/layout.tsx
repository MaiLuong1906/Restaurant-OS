'use client';

import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { WAITER_QUICK_ACTIONS } from '@/components/staff/QuickActions';

export default function WaitLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffLayout homeHref="/wait" quickActions={WAITER_QUICK_ACTIONS}>
      {children}
    </StaffLayout>
  );
}
