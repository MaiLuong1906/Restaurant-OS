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
 * Khung KDS (v7.1) — nền sáng đồng bộ với web: nền giấy #F5F2EA, card trắng,
 * font sans Be Vietnam Pro (font-ops). Ngoại lệ nền tối #0B0F14 ở v6/v7 đã bỏ
 * theo quyết định của user: bếp cũng không dùng màu đen nữa.
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
    <div className={cn('flex min-h-screen flex-col bg-kds-bg font-ops text-kds-text', className)}>
      <TopBar
        left={
          <span className="flex items-center gap-2">
            <span className="shrink-0 text-base font-bold">{title ?? 'KDS Bếp'}</span>
            <span className="shrink-0 border border-kds-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-kds-muted">Demo</span>
          </span>
        }
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
