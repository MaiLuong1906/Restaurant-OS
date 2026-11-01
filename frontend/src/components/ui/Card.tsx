import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Thẻ nội dung dùng chung. Nền trắng, shadow nâu ấm, radius 16px, padding 24px.
 * Hover nhấc lên nhẹ. Không đặt chiều cao cố định — nội dung tự giãn dọc.
 * Khoảng cách trong thẻ dùng gap 16px (flex column), không dùng margin rời rạc.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function Card({ title, description, children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-card border border-sand-200 bg-white p-6 shadow-warm break-words transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-warm-lg',
        className,
      )}
      {...props}
    >
      {title ? <h3 className="font-display text-h3 font-semibold text-ink">{title}</h3> : null}
      {description ? <p className="text-small text-sand-600">{description}</p> : null}
      <div>{children}</div>
    </div>
  );
}
