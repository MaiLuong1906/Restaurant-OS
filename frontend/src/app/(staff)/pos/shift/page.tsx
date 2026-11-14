'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePosStore } from '@/stores/usePosStore';
import { ShiftSettlementView } from '@/components/pos/ShiftSettlementModal';

export default function PosShiftPage() {
  const {
    shift,
    isCashDrawerOpen,
    syncRealtimeClockSeed,
    initializeWebSocket,
    settleShiftAndBalance,
    recordInternalPayout,
    reopenShiftDemo,
    toggleCashDrawer,
  } = usePosStore();

  React.useEffect(() => {
    syncRealtimeClockSeed();
    initializeWebSocket();
  }, [syncRealtimeClockSeed, initializeWebSocket]);

  return (
    <div className="min-h-screen bg-ops-bg font-sans text-ink">
      <div className="mx-auto max-w-[1440px] px-4 pt-4 md:px-8">
        <Link
          href="/pos"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-sm font-semibold text-[#2B2118] no-underline transition-transform hover:bg-neutral-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4 text-[#2B2118]" />
          <span>Trang chủ</span>
        </Link>
      </div>
      <ShiftSettlementView
        shift={shift}
        isCashDrawerOpen={isCashDrawerOpen}
        onSettleShift={settleShiftAndBalance}
        onRecordPayout={recordInternalPayout}
        onReopenShiftDemo={reopenShiftDemo}
        onTriggerCashDrawer={(reason) => toggleCashDrawer(reason)}
      />
    </div>
  );
}
