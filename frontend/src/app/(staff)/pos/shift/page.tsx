'use client';

import * as React from 'react';
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
