import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TopBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  dark?: boolean;
  className?: string;
}

/** Thanh topbar dùng chung với 3 slot trái / giữa / phải. */
export function TopBar({ left, center, right, dark = false, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex min-h-14 items-center justify-between gap-3 px-4',
        dark ? 'bg-kds-surface text-kds-text' : 'border-b border-sand-200 bg-white text-ink shadow-warm-sm',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">{center}</div>
      <div className="flex flex-1 items-center justify-end gap-2">{right}</div>
    </header>
  );
}
