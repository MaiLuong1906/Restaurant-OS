import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <StaffLayout homeHref="/pos">{children}</StaffLayout>;
}
