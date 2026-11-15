'use client';

import * as React from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { usePosQuickActions } from '@/components/staff/QuickActions';
import { usePosStore } from '@/stores/usePosStore';
import { CheckCircle2, X } from 'lucide-react';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const posActions = usePosQuickActions();
  const lastActionToast = usePosStore((s) => s.lastActionToast);
  const clearToast = usePosStore((s) => s.clearToast);

  React.useEffect(() => {
    if (!lastActionToast) return;
    const timer = setTimeout(() => clearToast(), 4500);
    return () => clearTimeout(timer);
  }, [lastActionToast, clearToast]);

  return (
    <StaffLayout homeHref="/pos" quickActions={posActions}>
      {children}

      {/* Toast thông báo phản hồi tức thì chung cho POS */}
      {lastActionToast ? (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white shadow-warm-lg md:bottom-6"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sage-500" />
            <span>{lastActionToast}</span>
          </div>
          <button
            type="button"
            onClick={clearToast}
            className="cursor-pointer rounded p-1 text-sand-300 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </StaffLayout>
  );
}
