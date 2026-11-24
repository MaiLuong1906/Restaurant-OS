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
    isLoading,
    syncError,
    hasBackendTableUuids,
    createReservation,
    checkInReservation,
    cancelReservation,
    syncWithBackend,
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
        isLoading={isLoading}
        syncError={syncError}
        hasBackendTableUuids={hasBackendTableUuids}
        onRetrySync={() => {
          void syncWithBackend();
        }}
        initialTab={reservationSubTab}
        onCreateReservation={createReservation}
        onCheckInReservation={(resId, idempotencyKey) => {
          checkInReservation(resId, idempotencyKey);
          router.push('/pos/floor');
        }}
        onCancelReservation={(resId, idempotencyKey) => {
          cancelReservation(resId, idempotencyKey);
        }}
      />
    </div>
  );
}
