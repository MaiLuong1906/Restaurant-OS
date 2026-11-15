'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Nút dùng chung toàn dự án — design system v6.
 * - primary/ops: nút chính DUY NHẤT dùng đỏ brand #8C1D2C (primary-500/ops-brand).
 * - secondary/ops-outline: nút phụ viền XÁM + chữ ink, KHÔNG viền đỏ (v6).
 * - danger: chỉ hành động hủy/xóa, đỏ cảnh báo #D14B3A.
 * Radius thống nhất 8px (rounded-playful), min-height 48px, size "kds" >= 64px.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ops' | 'ops-outline' | 'kds-action' | 'kds-success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'kds';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white shadow-warm hover:bg-primary-600 hover:shadow-warm-lg active:bg-primary-700 disabled:bg-primary-200 disabled:shadow-none',
  secondary:
    'border border-sand-300 bg-white text-ink hover:bg-cream-dark active:bg-sand-200 disabled:border-sand-200 disabled:text-sand-400',
  ghost:
    'bg-transparent text-brown-600 hover:bg-cream-dark active:bg-sand-200 disabled:text-sand-400',
  danger:
    'bg-danger-500 text-white shadow-warm hover:bg-danger-600 hover:shadow-warm-lg active:bg-danger-600 disabled:bg-danger-200 disabled:shadow-none',
  ops:
    'bg-ops-brand text-white shadow-warm hover:bg-ops-brand-dark hover:shadow-warm-lg active:bg-ops-brand-dark disabled:bg-ops-brand-light disabled:text-ops-muted disabled:shadow-none',
  'ops-outline':
    'border border-ops-border bg-white text-ops-ink hover:bg-ops-bg active:bg-ops-bg disabled:border-ops-border disabled:text-ops-muted',
  /* v7 KDS: Nhận món = xanh dương trung tính; Báo xong = xanh lá. Đỏ chỉ cho cảnh báo. */
  'kds-action':
    'bg-kds-action text-white shadow-warm hover:opacity-90 active:opacity-90 disabled:bg-kds-border disabled:text-kds-muted disabled:shadow-none',
  'kds-success':
    'bg-sage-700 text-white shadow-warm hover:opacity-90 active:opacity-90 disabled:bg-kds-border disabled:text-kds-muted disabled:shadow-none',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-12 px-4 text-sm',
  md: 'min-h-12 px-8 text-base',
  lg: 'min-h-14 px-8 text-base',
  kds: 'min-h-16 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-playful font-semibold transition-[transform,box-shadow,background-color,border-color] duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-px active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
