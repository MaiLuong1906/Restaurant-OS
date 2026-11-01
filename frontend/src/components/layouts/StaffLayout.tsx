import * as React from 'react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/ui/TopBar';

export interface StaffNavItem {
  id: string;
  label: string;
  href: string;
}

export interface StaffLayoutProps {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  navItems: StaffNavItem[];
  activeNavId?: string;
  children: React.ReactNode;
  className?: string;
}

/** Khung Staff Portal mobile + bottom navigation. */
export function StaffLayout({
  headerLeft,
  headerRight,
  navItems,
  activeNavId,
  children,
  className,
}: StaffLayoutProps) {
  return (
    <div className={cn('mx-auto flex min-h-screen w-full max-w-lg flex-col bg-cream', className)}>
      <TopBar left={headerLeft} right={headerRight} />
      <main className="flex-1 px-6 py-6 pb-32">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-lg grid-cols-4 border-t border-sand-200 bg-white">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            aria-current={item.id === activeNavId ? 'page' : undefined}
            className={cn(
              'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors',
              item.id === activeNavId ? 'text-primary-600' : 'text-sand-600 hover:text-ink',
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
