import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Nhãn trạng thái dùng chung (v6). default = trung tính (ink), KHÔNG đỏ brand;
 * đỏ chỉ xuất hiện ở sla-overdue/danger (cảnh báo) và trạng thái bàn quá SLA.
 */
export type BadgeVariant =
  | 'table-empty'
  | 'table-inuse'
  | 'table-overdue'
  | 'table-cleaning'
  | 'sla-ok'
  | 'sla-warning'
  | 'sla-overdue'
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  blink?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  'table-empty': 'bg-table-empty text-white',
  'table-inuse': 'bg-table-inuse text-brown-900',
  'table-overdue': 'bg-table-overdue text-white',
  'table-cleaning': 'bg-table-cleaning text-white',
  'sla-ok': 'bg-sage-700 text-white',
  'sla-warning': 'bg-honey-500 text-brown-900',
  'sla-overdue': 'bg-danger-500 text-white',
  default: 'bg-ops-ink text-white',
  success: 'bg-sage-700 text-white',
  warning: 'bg-honey-500 text-brown-900',
  danger: 'bg-danger-500 text-white',
  neutral: 'bg-sand-200 text-brown-700',
};

export function Badge({ variant = 'default', blink = false, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        variants[variant],
        blink && 'animate-blink',
        className,
      )}
      {...props}
    />
  );
}
