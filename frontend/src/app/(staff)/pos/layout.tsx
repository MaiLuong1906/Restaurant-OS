'use client';

import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { usePosQuickActions } from '@/components/staff/QuickActions';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const posActions = usePosQuickActions();

  return (
    <StaffLayout homeHref="/pos" quickActions={posActions}>
      {children}
    </StaffLayout>
  );
}
