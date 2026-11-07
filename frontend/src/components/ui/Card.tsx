import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Thẻ nội dung dùng chung (v6). Nền trắng, bóng nhẹ 0 1px 3px, radius 8px, padding 24px.
 * Tiêu đề dùng sans (Be Vietnam Pro) — serif chỉ còn ở tiêu đề website khách.
 * Hover nhấc lên nhẹ. Không đặt chiều cao cố định — nội dung tự giãn dọc.
 * Khoảng cách trong thẻ dùng gap 16px (flex column), không dùng margin rời rạc.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  interactive?: boolean;
}

export function Card({
  title,
  description,
  children,
  className,
  interactive,
  onClick,
  ...props
}: CardProps) {
  const isInteractive = interactive ?? Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col gap-4 rounded-card border border-sand-200 bg-white p-6 shadow-warm break-words',
        isInteractive &&
          'cursor-pointer transition-[transform,box-shadow] duration-[200ms] ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:shadow-warm-lg',
        className,
      )}
      {...props}
    >
      {title ? <h3 className="text-h3 font-semibold text-ink">{title}</h3> : null}
      {description ? <p className="text-small text-sand-600">{description}</p> : null}
      <div>{children}</div>
    </div>
  );
}
