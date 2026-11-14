'use client';

import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { CHEF_QUICK_ACTIONS } from '@/components/staff/QuickActions';

export default function ChefLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffLayout homeHref="/chef" quickActions={CHEF_QUICK_ACTIONS}>
      {children}
    </StaffLayout>
  );
}
