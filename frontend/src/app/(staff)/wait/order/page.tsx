'use client';

import * as React from 'react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { WaiterBottomNav } from '@/components/waiter/WaiterBottomNav';
import { WaiterOrderView } from '@/components/waiter/WaiterOrderView';
import { WaiterSendKitchenModal } from '@/components/waiter/WaiterSendKitchenModal';
import { WaiterTransferModal } from '@/components/waiter/WaiterTransferModal';
import { WaiterToast } from '@/components/waiter/WaiterToast';

export default function WaiterOrderPage() {
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);

  React.useEffect(() => {
    setActiveTab('order');
  }, [setActiveTab]);

  return (
    <div className="flex min-h-screen flex-col bg-ops-bg text-ink antialiased">
      {/* Main Work Area: Order & Menu */}
      <main className="w-full flex-1 max-w-[1720px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12">
        <WaiterOrderView />
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
