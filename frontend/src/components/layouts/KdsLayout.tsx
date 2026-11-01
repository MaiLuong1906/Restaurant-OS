import * as React from 'react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/ui/TopBar';

export interface KdsLayoutProps {
  title?: React.ReactNode;
  stationFilter?: React.ReactNode;
  soundToggle?: React.ReactNode;
  clock?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Khung KDS — NGOẠI LỆ nền tối: giữ nền tối theo token kds-bg để đọc được trong bếp,
 * nhưng nút/accent đã chuyển sang terracotta Warm Earth qua Button/Button token.
 * Mọi nút hành động trong KDS dùng size "kds" (>= 64px).
 */
export function KdsLayout({
  title,
  stationFilter,
  soundToggle,
  clock,
  children,
  className,
}: KdsLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-kds-bg text-kds-text', className)}>
      <TopBar
        dark
        left={<span className="text-base font-bold">{title ?? 'KDS Bếp'}</span>}
        center={stationFilter}
        right={
          <>
            {soundToggle}
            {clock}
          </>
        }
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
