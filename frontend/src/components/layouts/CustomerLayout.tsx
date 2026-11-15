import * as React from 'react';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/ui/TopBar';

export interface CustomerLayoutProps {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  cartBar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Khung phía khách (v6): mobile 1 cột, desktop mở rộng (md 3xl, lg 5xl) và menu
 * 2 cột — không còn cột hẹp kẹt giữa màn hình desktop. Thanh giỏ dính đáy.
 */
export function CustomerLayout({
  headerLeft,
  headerRight,
  cartBar,
  children,
  className,
}: CustomerLayoutProps) {
  return (
    <div className={cn('mx-auto flex min-h-screen w-full max-w-lg flex-col bg-cream md:max-w-3xl lg:max-w-5xl', className)}>
      <TopBar left={headerLeft} right={headerRight} />
      <main className="flex-1 px-6 py-6 pb-32">{children}</main>
      {cartBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-6 pb-6 md:max-w-3xl lg:max-w-5xl">
          {cartBar}
        </div>
      ) : null}
    </div>
  );
}
