import * as React from 'react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/ui/TopBar';

export interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  headerRight?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** Khung dashboard/báo cáo: sidebar + nội dung. Sidebar ẩn trên mobile. */
export function DashboardLayout({
  sidebar,
  headerRight,
  title,
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-cream', className)}>
      <TopBar left={<span className="text-base font-bold">{title ?? 'Restaurant OS'}</span>} right={headerRight} />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-sand-200 bg-white p-6 md:block">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
