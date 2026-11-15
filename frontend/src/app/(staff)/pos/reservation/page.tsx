'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/stores/usePosStore';
import { useQuickActionIntentStore } from '@/stores/useQuickActionIntentStore';
import { ReservationView } from '@/components/pos/ReservationModal';

export default function PosReservationPage() {
  const router = useRouter();
  const pendingReservationSubTab = useQuickActionIntentStore(
    (s) => s.pendingReservationSubTab
  );
  const clearPendingReservationSubTab = useQuickActionIntentStore(
    (s) => s.clearPendingReservationSubTab
  );
  const {
    tables,
    reservations,
    createReservation,
    checkInReservation,
    cancelReservation,
    syncRealtimeClockSeed,
    initializeWebSocket,
  } = usePosStore();

  const [reservationSubTab, setReservationSubTab] = React.useState<'create' | 'checkin'>('create');

  React.useEffect(() => {
    if (pendingReservationSubTab === 'checkin') {
      setReservationSubTab('checkin');
      clearPendingReservationSubTab();
    }
  }, [pendingReservationSubTab, clearPendingReservationSubTab]);

  React.useEffect(() => {
    syncRealtimeClockSeed();
    initializeWebSocket();
  }, [syncRealtimeClockSeed, initializeWebSocket]);

  return (
    <div className="min-h-screen bg-ops-bg font-sans text-ink">
      <ReservationView
        tables={tables}
        reservations={reservations}
        initialTab={reservationSubTab}
        onCreateReservation={createReservation}
        onCheckInReservation={(resId) => {
          checkInReservation(resId);
          router.push('/pos/floor');
        }}
        onCancelReservation={cancelReservation}
      />
    </div>
  );
}
