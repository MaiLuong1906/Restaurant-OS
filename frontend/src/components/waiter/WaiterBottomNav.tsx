'use client';

import * as React from 'react';
import { LayoutGrid, Receipt, CookingPot } from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { WaiterTab } from '@/types/waiter';
import { cn } from '@/lib/utils';

export function WaiterBottomNav() {
  const activeTab = useWaiterStore((s) => s.activeTab);
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);
  const selectedTableId = useWaiterStore((s) => s.selectedTableId);
  const tables = useWaiterStore((s) => s.tables);

  const currentTable = tables[selectedTableId];
  const pendingCount = currentTable?.pendingItems?.length || 0;

  const items: { id: WaiterTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'floor', label: 'Sơ đồ bàn', icon: LayoutGrid },
    { id: 'order', label: 'Gọi món', icon: Receipt, badge: pendingCount },
    { id: 'tracking', label: 'Tiến độ bếp', icon: CookingPot },
  ];

  return (
    <nav
      aria-label="Điều hướng Waiter trên thiết bị di động"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 w-full items-center justify-around border-t border-ops-border bg-white/95 px-3 backdrop-blur-md shadow-lg lg:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors',
              isActive ? 'text-ops-brand font-bold' : 'text-ops-muted hover:text-ink font-medium'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ops-brand px-1 text-[10px] font-bold text-white shadow-xs">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] leading-none">{item.label}</span>
            {isActive ? (
              <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-ops-brand" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
