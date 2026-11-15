import * as React from 'react';

export interface KpiBadge {
  text: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
  className?: string;
}

export interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  badge?: KpiBadge | React.ReactNode;
  subtext?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const BADGE_STYLES: Record<NonNullable<KpiBadge['variant']>, string> = {
  neutral: 'text-stone-700 bg-stone-100 border-stone-200',
  success: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  warning: 'text-amber-800 bg-amber-50 border-amber-200',
  danger: 'text-rose-800 bg-rose-50 border-rose-200',
  brand: 'text-white bg-ops-brand border-ops-brand',
};

/**
 * Thẻ hiển thị chỉ số điều hành (KPI Card) chuẩn hoá toàn hệ thống Admin
 */
export function KpiCard({
  title,
  value,
  badge,
  subtext,
  className = '',
  onClick,
}: KpiCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-1.5 transition-all ${
        isClickable ? 'cursor-pointer hover:border-stone-300 hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700 truncate">
          {title}
        </span>

        {badge && (
          <div className="shrink-0">
            {React.isValidElement(badge) ? (
              badge
            ) : typeof badge === 'object' && 'text' in badge ? (
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                  badge.className || BADGE_STYLES[badge.variant || 'neutral']
                }`}
              >
                {badge.text}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight pt-0.5">
        {value}
      </div>

      {subtext && (
        <div className="text-xs text-stone-600 font-medium pt-1.5 border-t border-stone-100">
          {subtext}
        </div>
      )}
    </div>
  );
}

