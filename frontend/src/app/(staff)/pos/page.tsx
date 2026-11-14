'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/stores/usePosStore';
import { CashierHomeView } from '@/components/pos/CashierHomeView';

export default function PosCashierPage() {
  const router = useRouter();
  const {
    tables,
    reservations,
    shift,
    currentAttendance,
    selectedTableId,
    isCashDrawerOpen,
    selectTable,
    syncRealtimeClockSeed,
    initializeWebSocket,
    toggleCashDrawer,
  } = usePosStore();

  React.useEffect(() => {
    syncRealtimeClockSeed();
    initializeWebSocket();
  }, [syncRealtimeClockSeed, initializeWebSocket]);

  return (
    <div className="min-h-screen bg-ops-bg font-sans text-ink">
      <CashierHomeView
        tables={tables}
        reservations={reservations}
        shift={shift}
        currentAttendance={currentAttendance}
        selectedTableId={selectedTableId}
        isCashDrawerOpen={isCashDrawerOpen}
        onEnterPos={(tableId) => {
          if (tableId) selectTable(tableId);
          router.push('/pos/floor');
        }}
        onOpenNewReservation={() => {
          router.push('/pos/reservation');
        }}
        onOpenCheckInList={() => {
          router.push('/pos/reservation');
        }}
        onOpenSplitMerge={(tableId) => {
          selectTable(tableId);
          router.push('/pos/floor');
        }}
        onOpenShiftSettlement={() => {
          router.push('/pos/shift');
        }}
        onOpenAttendance={() => {
          router.push('/pos/shift');
        }}
        onTriggerCashDrawer={() =>
          toggleCashDrawer('Mở két tiền từ màn hình Trang chủ Thu ngân')
        }
      />
    </div>
  );
}
