'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Calendar,
  FileText,
  DollarSign,
  UserCheck,
  GitMerge,
  Wallet,
} from 'lucide-react';
import { useQuickActionIntentStore } from '@/stores/useQuickActionIntentStore';

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
  onItemClick?: () => void;
}

export const CHEF_QUICK_ACTIONS: QuickActionItem[] = [
  {
    icon: Clock,
    label: 'Chấm công',
    sub: 'Vào / ra ca',
    href: '/staff/attendance',
  },
  {
    icon: Calendar,
    label: 'Lịch ca',
    sub: 'Ca tuần này',
    href: '/staff/schedule',
  },
  {
    icon: FileText,
    label: 'Xin nghỉ',
    sub: 'Đơn & quỹ phép',
    href: '/staff/leave',
  },
  {
    icon: DollarSign,
    label: 'Lương & Tip',
    sub: 'Phiếu tháng này',
    href: '/staff/payslip',
  },
];

export function usePosQuickActions(): QuickActionItem[] {
  const router = useRouter();
  const setPosIntent = useQuickActionIntentStore((s) => s.setPosIntent);

  return React.useMemo<QuickActionItem[]>(
    () => [
      {
        icon: UserCheck,
        label: 'Check-in khách',
        sub: 'Nhận bàn & Khấu trừ cọc',
        onClick: () => {
          setPosIntent('checkin');
          router.push('/pos');
        },
      },
      {
        icon: GitMerge,
        label: 'Gộp / tách bàn',
        sub: 'Chia đều / Theo món / Gộp',
        onClick: () => {
          setPosIntent('splitmerge');
          router.push('/pos');
        },
      },
      {
        icon: Clock,
        label: 'Chấm công',
        sub: 'Vào ca • Nghỉ ca • Tan ca',
        href: '/staff/attendance',
      },
      {
        icon: Wallet,
        label: 'Đối soát ca',
        sub: 'Kiểm tiền mặt & Chốt ca',
        onClick: () => {
          setPosIntent('settlement');
          router.push('/pos');
        },
      },
    ],
    [router, setPosIntent]
  );
}

const itemClassName =
  'min-h-[76px] p-3 px-2 rounded-lg border border-sand-200 bg-white hover:bg-neutral-50 active:scale-98 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs transition-transform cursor-pointer';

export function QuickActions({ title, subtitle, actions, onItemClick }: QuickActionsProps) {
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
                onClick={onItemClick}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.label || idx}
              type="button"
              onClick={() => {
                action.onClick?.();
                onItemClick?.();
              }}
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
