'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';

export function WaiterToast() {
  const toastMessage = useWaiterStore((s) => s.toastMessage);
  const clearToast = useWaiterStore((s) => s.clearToast);

  if (!toastMessage) return null;

  const isWarning = toastMessage.includes('⚠️') || toastMessage.includes('⚡') || toastMessage.includes('lỗi');

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[300] flex max-w-sm sm:max-w-md items-center gap-3 rounded-xl bg-ops-ink text-white px-4 py-3 shadow-2xl border border-sand-600/40 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {isWarning ? (
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
      ) : (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
      )}
      <span className="text-xs sm:text-sm font-medium leading-snug flex-1">{toastMessage}</span>
      <button
        type="button"
        onClick={clearToast}
        className="text-sand-400 hover:text-white p-1 rounded-md transition-colors"
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
