import React from 'react';
import Link from 'next/link';

export interface QuickActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  href?: string;
  onClick?: () => void;
}

export interface QuickActionsProps {
  title: string;
  subtitle: string;
  actions: QuickActionItem[];
}

const itemClassName =
  'min-h-[76px] p-3 px-2 rounded-lg border border-sand-200 bg-white hover:bg-neutral-50 active:scale-98 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs transition-transform cursor-pointer';

export function QuickActions({ title, subtitle, actions }: QuickActionsProps) {
  return (
    <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="text-sm text-muted mb-3">{subtitle}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const content = (
            <>
              <Icon className="h-5 w-5 text-ops-brand" />
              <span className="text-sm font-semibold text-ink">{action.label}</span>
              <span className="text-xs text-muted">{action.sub}</span>
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.href || idx}
                href={action.href}
                className={itemClassName}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.label || idx}
              type="button"
              onClick={action.onClick}
              className={itemClassName}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
