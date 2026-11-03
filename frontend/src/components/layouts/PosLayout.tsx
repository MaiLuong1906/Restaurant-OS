import * as React from 'react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/ui/TopBar';

export interface PosLayoutProps {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  mapArea: React.ReactNode;
  sideRail: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Khung POS: vùng sơ đồ bàn + rail bên phải (chi tiết bàn đã chọn).
 * Trên mobile rail xếp xuống dưới bản đồ. Không dùng Three.js ở đây.
 */
export function PosLayout({
  headerLeft,
  headerRight,
  mapArea,
  sideRail,
  children,
  className,
}: PosLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-cream', className)}>
      <TopBar left={headerLeft} right={headerRight} />
      <main className="flex flex-1 flex-col gap-6 p-6 lg:flex-row">
        <section className="min-w-0 flex-1">{mapArea}</section>
        <aside className="w-full shrink-0 lg:w-[380px]">{sideRail}</aside>
      </main>
      {children}
    </div>
  );
}
