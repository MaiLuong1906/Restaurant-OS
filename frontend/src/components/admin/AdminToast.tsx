'use client';

import * as React from 'react';

export interface AdminToastProps {
  message: string | null;
}

/**
 * Toast thông báo trạng thái thao tác chuẩn trong Admin Portal
 */
export function AdminToast({ message }: AdminToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-stone-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2"
    >
      {message}
    </div>
  );
}

/**
 * Hook quản lý trạng thái hiển thị Toast và tự động dọn dẹp timer khi unmount
 */
export function useAdminToast(duration = 3000) {
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = React.useCallback(
    (msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToastMsg(msg);
      timerRef.current = setTimeout(() => setToastMsg(null), duration);
    },
    [duration]
  );

  return { toastMsg, showToast };
}

