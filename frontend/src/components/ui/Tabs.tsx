'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Bản tối cho KDS (nền tối theo token kds-bg). Mặc định là bản sáng Warm Earth. */
  dark?: boolean;
  className?: string;
}

/**
 * Thanh tab ngang dùng chung (v6). Tab đang active: chữ ink + gạch chân ink
 * (bản tối: chữ trắng + gạch trắng) — KHÔNG dùng đỏ brand cho tab đang chọn.
 */
export function Tabs({ items, value, onChange, dark = false, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-2 overflow-x-auto border-b',
        dark ? 'border-kds-border' : 'border-sand-200',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px min-h-12 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-semibold transition-[color,border-color] duration-200',
              active
                ? dark
                  ? 'border-white text-kds-text'
                  : 'border-ink text-ink'
                : dark
                  ? 'border-transparent text-kds-muted hover:text-kds-text'
                  : 'border-transparent text-sand-600 hover:text-ink',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
