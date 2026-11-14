'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/stores/usePosStore';
import { ReservationView } from '@/components/pos/ReservationModal';

export default function PosReservationPage() {
  const router = useRouter();
  const {
    tables,
    reservations,
    createReservation,
    checkInReservation,
    cancelReservation,
    syncRealtimeClockSeed,
    initializeWebSocket,
  } = usePosStore();

  const [reservationSubTab] = React.useState<'create' | 'checkin'>('create');

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
          router.push('/pos');
        }}
        onCancelReservation={cancelReservation}
      />
    </div>
  );
}
