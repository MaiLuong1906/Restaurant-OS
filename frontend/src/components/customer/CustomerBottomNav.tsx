'use client';

import Link from 'next/link';
import { UtensilsCrossed, Search, ReceiptText, ShoppingBag } from 'lucide-react';

export type CustomerTabKey = 'menu' | 'search' | 'orders' | 'cart';

export interface CustomerBottomNavProps {
  activeTab: CustomerTabKey;
  cartCount: number;
  ordersCount?: number;
  onTabChange?: (tab: CustomerTabKey) => void;
}

export function CustomerBottomNav({
  activeTab,
  cartCount,
  ordersCount = 0,
  onTabChange,
}: CustomerBottomNavProps) {
  const navItems: {
    key: CustomerTabKey;
    label: string;
    href: string;
    icon: typeof UtensilsCrossed;
    badge?: number;
  }[] = [
    {
      key: 'menu',
      label: 'Thực đơn',
      href: '/menu',
      icon: UtensilsCrossed,
    },
    {
      key: 'search',
      label: 'Tìm món',
      href: '/menu?tab=search',
      icon: Search,
    },
    {
      key: 'orders',
      label: 'Đã đặt',
      href: '/orders',
      icon: ReceiptText,
      badge: ordersCount,
    },
    {
      key: 'cart',
      label: 'Giỏ hàng',
      href: '/cart',
      icon: ShoppingBag,
      badge: cartCount,
    },
  ];

  return (
    <nav
      aria-label="Điều hướng khách hàng"
      className="fixed bottom-0 inset-x-0 z-50 bg-[#fff8f6]/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(41,37,36,0.08)] border-t border-[#dcc1b8]/40"
    >
      <div className="mx-auto flex h-18 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          if (onTabChange && (item.key === 'menu' || item.key === 'search')) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`flex min-h-[48px] min-w-[64px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors ${
                  isActive
                    ? 'text-[#9a401c] font-bold'
                    : 'text-[#56423c] hover:text-[#1e1b1a] font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-1 text-[11px] leading-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex min-h-[48px] min-w-[64px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors ${
                isActive
                  ? 'text-[#9a401c] font-bold'
                  : 'text-[#56423c] hover:text-[#1e1b1a] font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="ops-nums absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#9a401c] px-1 text-[10px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="mt-1 text-[11px] leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
