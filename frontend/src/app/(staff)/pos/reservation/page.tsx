'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      <div className="mx-auto max-w-[1440px] px-4 pt-4 md:px-8">
        <Link
          href="/pos"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-sm font-semibold text-[#2B2118] no-underline transition-transform hover:bg-neutral-50 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4 text-[#2B2118]" />
          <span>Trang chủ</span>
        </Link>
      </div>
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
