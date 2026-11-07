'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, DollarSign, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/staff', label: 'Trang chủ', icon: Home },
  { href: '/staff/schedule', label: 'Lịch ca', icon: Calendar },
  { href: '/staff/payslip', label: 'Lương & Tip', icon: DollarSign },
  { href: '/staff/personal', label: 'Cá nhân', icon: User },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] flex flex-col font-sans">
      {/* Topnav cho bản Laptop (cao 40px, max-w-4xl / 1024px) */}
      <header className="hidden md:block w-full max-w-[480px] md:max-w-4xl mx-auto px-4 pt-4">
        <nav
          className="bg-white border border-[#E9E4DC] rounded-lg p-1 flex gap-1 shadow-xs"
          aria-label="Điều hướng Staff Portal (bản laptop)"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-h-[40px] rounded-md font-bold text-sm flex items-center justify-center transition-colors duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)] ${
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

      {/* Bottom Nav cố định đáy cho mobile (cao 64-68px) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E9E4DC] grid grid-cols-4 px-2 py-2 shadow-lg z-40"
        aria-label="Điều hướng Staff Portal (bản điện thoại)"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] min-h-[48px] transition-colors duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)] ${
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
