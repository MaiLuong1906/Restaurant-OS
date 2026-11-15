'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { WaiterTopBar } from '@/components/waiter/WaiterTopBar';
import { WaiterBottomNav } from '@/components/waiter/WaiterBottomNav';
import { WaiterFloorPlan } from '@/components/waiter/WaiterFloorPlan';
import { WaiterOrderView } from '@/components/waiter/WaiterOrderView';
import { WaiterOrderTracking } from '@/components/waiter/WaiterOrderTracking';
import { WaiterSendKitchenModal } from '@/components/waiter/WaiterSendKitchenModal';
import { WaiterTransferModal } from '@/components/waiter/WaiterTransferModal';
import { WaiterToast } from '@/components/waiter/WaiterToast';
import { WaiterTab } from '@/types/waiter';

function WaiterMainContent() {
  const activeTab = useWaiterStore((s) => s.activeTab);
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);
  const setSelectedTable = useWaiterStore((s) => s.setSelectedTable);

  const searchParams = useSearchParams();

  // Sync initial URL query params if any
  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'floor' || tabParam === 'order' || tabParam === 'tracking') {
      setActiveTab(tabParam as WaiterTab);
    }
    const tableParam = searchParams.get('table');
    if (tableParam) {
      setSelectedTable(tableParam);
    }
  }, [searchParams, setActiveTab, setSelectedTable]);

  return (
    <div className="flex min-h-screen flex-col bg-ops-bg text-ink antialiased">
      {/* Top Bar Navigation */}
      <WaiterTopBar />

      {/* Main Work Area */}
      <main className="w-full flex-1 max-w-[1720px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12">
        {activeTab === 'floor' ? <WaiterFloorPlan /> : null}
        {activeTab === 'order' ? <WaiterOrderView /> : null}
        {activeTab === 'tracking' ? <WaiterOrderTracking /> : null}
      </main>

      {/* Mobile Bottom Navigation */}
      <WaiterBottomNav />

      {/* Modals & Overlay Services */}
      <WaiterSendKitchenModal />
      <WaiterTransferModal />
      <WaiterToast />
    </div>
  );
}

export default function WaiterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ops-bg text-xs font-semibold text-ops-muted">
          Đang tải giao diện Waiter Floor Ops...
        </div>
      }
    >
      <WaiterMainContent />
    </React.Suspense>
  );
}
