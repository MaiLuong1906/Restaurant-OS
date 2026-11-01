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
 * Khung mobile-first phía khách (QR / menu / giỏ hàng).
 * Header slot + nội dung + thanh giỏ hàng dính đáy (slot).
 * Nền cream Warm Earth; nội dung cách lề 24px, chừa chỗ cho thanh giỏ.
 */
export function CustomerLayout({
  headerLeft,
  headerRight,
  cartBar,
  children,
  className,
}: CustomerLayoutProps) {
  return (
    <div className={cn('mx-auto flex min-h-screen w-full max-w-lg flex-col bg-cream', className)}>
      <TopBar left={headerLeft} right={headerRight} />
      <main className="flex-1 px-6 py-6 pb-32">{children}</main>
      {cartBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-6 pb-6">
          {cartBar}
        </div>
      ) : null}
    </div>
  );
}
