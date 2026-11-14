'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, DollarSign, User } from 'lucide-react';
import { QuickActionItem } from '@/components/staff/QuickActions';
import { QuickActionsFab } from '@/components/staff/QuickActionsFab';

export interface StaffLayoutProps {
  children: React.ReactNode;
  homeHref?: '/staff' | '/pos' | '/chef';
  quickActions?: QuickActionItem[];
}

export function StaffLayout({
  children,
  homeHref = '/staff',
  quickActions,
}: StaffLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: homeHref, label: 'Trang chủ', icon: Home },
    { href: '/staff/schedule', label: 'Lịch ca', icon: Calendar },
    { href: '/staff/payslip', label: 'Lương & Tip', icon: DollarSign },
    { href: '/staff/personal', label: 'Cá nhân', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] flex flex-col font-sans">
      {/* Topnav cho bản Laptop (cao 40px, max-w-4xl / 1024px) */}
      <header className="hidden md:block w-full max-w-[480px] md:max-w-4xl mx-auto px-4 pt-4">
        <nav
          className="bg-white border border-[#E9E4DC] rounded-lg p-1 flex gap-1 shadow-xs"
          aria-label="Điều hướng Staff Portal (bản laptop)"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 min-h-[40px] rounded-md font-bold text-sm flex items-center justify-center transition-colors duration-140 ${
                  isActive
                    ? 'bg-[#8C1D2C] text-white'
                    : 'text-[#2B2118] hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Vùng nội dung chính với padding bottom cho mobile để không bị che bởi fixed bottom nav */}
      <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-6">
        {children}
      </main>

      {/* FAB Thao tác nhanh cho Mobile */}
      {quickActions && quickActions.length > 0 ? (
        <QuickActionsFab actions={quickActions} />
      ) : null}

      {/* Bottom Nav cố định đáy cho mobile (cao 64-68px) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E9E4DC] grid grid-cols-4 px-2 py-2 shadow-lg z-40"
        aria-label="Điều hướng Staff Portal (bản điện thoại)"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] min-h-[48px] ${
                isActive
                  ? 'font-bold text-[#8C1D2C]'
                  : 'font-semibold text-[#7A6A58] hover:text-[#2B2118]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default StaffLayout;
