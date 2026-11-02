'use client';

import * as React from 'react';
import { LayoutDashboard, LayoutGrid, Users, BarChart3, ChefHat, Menu, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/ui/TopBar';

export interface DashboardNavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
}

export interface DashboardLayoutProps {
  /** Nav cũ (node tự do) — vẫn hỗ trợ, nhưng trang v5 nên dùng navItems để có icon + thu gọn. */
  sidebar?: React.ReactNode;
  navItems?: DashboardNavItem[];
  headerRight?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const OPS_NAV_ICONS = {
  dashboard: <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden="true" />,
  tables: <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden="true" />,
  staff: <Users className="h-5 w-5 shrink-0" aria-hidden="true" />,
  report: <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />,
  kds: <ChefHat className="h-5 w-5 shrink-0" aria-hidden="true" />,
};

/**
 * Khung quản lý v6 (app vận hành, font-ops, nền #F6F4F0):
 * - Sidebar dùng icon Lucide, mục đang chọn = nền xám ấm + chữ ink đậm, KHÔNG đỏ.
 * - Nút thu gọn sidebar trên desktop; trên mobile (<1024px) sidebar thành drawer.
 * - Badge "Demo" gọn ở topbar thay cho việc lặp ghi chú dev ở nhiều chỗ.
 */
export function DashboardLayout({
  sidebar,
  navItems,
  headerRight,
  title,
  children,
  className,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const nav = navItems ? (
    <nav className="flex flex-col gap-1" aria-label="Quản lý">
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
            item.active
              ? 'bg-ops-bg text-ops-ink'
              : 'text-ops-muted hover:bg-ops-bg hover:text-ops-ink',
          )}
        >
          {item.icon}
          <span className={cn(collapsed && 'hidden')}>{item.label}</span>
        </a>
      ))}
    </nav>
  ) : (
    sidebar
  );

  return (
    <div className={cn('flex min-h-screen flex-col bg-ops-bg font-ops text-ops-ink', className)}>
      <TopBar
        left={
          <span className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setDrawerOpen(true)}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-ops-ink lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-base font-bold">{title ?? 'Restaurant OS'}</span>
            <span className="border border-ops-border bg-ops-bg px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ops-muted">
              Demo
            </span>
          </span>
        }
        right={headerRight}
        className="border-ops-border bg-white text-ops-ink"
      />
      <div className="flex flex-1">
        <aside
          className={cn(
            'hidden shrink-0 border-r border-ops-border bg-white p-4 lg:block',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="mb-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-1 border border-ops-border text-xs font-semibold text-ops-muted hover:text-ops-ink"
          >
            <ChevronLeft className={cn('h-4 w-4', collapsed && 'rotate-180')} aria-hidden="true" />
            {collapsed ? '' : 'Thu gọn'}
          </button>
          {nav}
        </aside>
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6 lg:pb-6">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 cursor-pointer bg-ops-ink/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold">Menu quản lý</span>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setDrawerOpen(false)}
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}
    </div>
  );
}
