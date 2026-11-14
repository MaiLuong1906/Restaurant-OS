import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';

export default function StaffSegmentLayout({ children }: { children: React.ReactNode }) {
  return <StaffLayout homeHref="/staff">{children}</StaffLayout>;
}
