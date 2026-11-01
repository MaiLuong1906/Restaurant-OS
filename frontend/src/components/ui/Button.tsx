'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Nút dùng chung toàn dự án. Chỉ dùng token trong @theme (globals.css),
 * không hardcode màu hex. Radius playful 24px 24px 2px 24px, min-height 48px.
 * Hover: scale nhẹ + tăng shadow; active: nhấn xuống — chuyển động xác nhận hành động.
 * Size "kds" cao tối thiểu 64px theo quy chuẩn KDS.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'kds';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white shadow-warm hover:bg-primary-600 hover:shadow-warm-lg active:bg-primary-700 disabled:bg-primary-200 disabled:shadow-none',
  secondary:
    'border-2 border-primary-500 bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100 disabled:border-primary-200 disabled:text-primary-300',
  ghost:
    'bg-transparent text-brown-600 hover:bg-cream-dark active:bg-sand-200 disabled:text-sand-400',
  danger:
    'bg-danger-500 text-white shadow-warm hover:bg-danger-600 hover:shadow-warm-lg active:bg-danger-600 disabled:bg-danger-200 disabled:shadow-none',
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
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-playful font-semibold transition-[transform,box-shadow,background-color,border-color] duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
