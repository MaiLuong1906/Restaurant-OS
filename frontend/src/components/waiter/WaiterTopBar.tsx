'use client';

import * as React from 'react';
import { UtensilsCrossed, Bell, Radio } from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { WaiterTab } from '@/types/waiter';
import { cn } from '@/lib/utils';

export function WaiterTopBar() {
  const activeTab = useWaiterStore((s) => s.activeTab);
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);
  const selectedTableId = useWaiterStore((s) => s.selectedTableId);
  const showToast = useWaiterStore((s) => s.showToast);

  const tabs: { id: WaiterTab; label: string }[] = [
    { id: 'floor', label: 'Sơ đồ bàn' },
    { id: 'order', label: 'Gọi món & Thực đơn' },
    { id: 'tracking', label: 'Tiến độ món & Bếp' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-ops-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1720px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ops-brand text-white shadow-xs">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-ink leading-tight">
                RESTAURANT OS
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-ops-muted uppercase">
                Floor Ops v2.4
              </span>
            </div>
          </div>

          <div className="hidden h-5 w-px bg-ops-border md:block" />

          {/* Desktop Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 rounded-lg border border-ops-border/80 bg-ops-bg/80 p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-ops-brand text-white shadow-xs'
                      : 'text-ops-muted hover:bg-white hover:text-ink'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Active Table Quick Indicator */}
          <div className="flex items-center gap-1.5 rounded-lg border border-ops-brand/20 bg-ops-brand-light px-2.5 py-1 text-xs font-bold text-ops-brand">
            <span>Bàn {selectedTableId}</span>
          </div>

          {/* Shift Info */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-ops-border bg-white px-3 py-1.5 text-xs">
            <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-semibold text-ink">Ca sáng 08:00 - 14:00</span>
              <span className="mt-0.5 text-[10px] text-ops-muted">Sảnh Tầng 1 • Khu A-B</span>
            </div>
          </div>

          {/* Notification Button */}
          <button
            type="button"
            onClick={() => showToast('Hệ thống trạm KDS & POS hoạt động bình thường.')}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-ops-border bg-white text-ops-muted hover:border-sand-400 hover:text-ink transition-colors"
            aria-label="Thông báo hệ thống"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ops-brand" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-1 border-l border-ops-border">
            <div className="hidden text-right md:block leading-tight">
              <div className="text-xs font-bold text-ink">Minh Huy</div>
              <div className="text-[10px] font-medium text-ops-muted">Nhân viên phục vụ bàn</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ops-brand text-xs font-bold text-white shadow-xs">
              H
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
