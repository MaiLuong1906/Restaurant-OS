import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';

export default function ChefLayout({ children }: { children: React.ReactNode }) {
  return <StaffLayout homeHref="/chef">{children}</StaffLayout>;
}
