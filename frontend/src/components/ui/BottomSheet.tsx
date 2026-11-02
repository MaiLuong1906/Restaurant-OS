'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** Bottom-sheet dùng chung phía khách (chi tiết món, giỏ hàng). Trượt từ dưới lên.
 * Review 2026-11-01: bấm Escape để đóng + khóa cuộn body khi mở. */
export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brown-900/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-warm-lg',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-sand-300" aria-hidden="true" />
        <div className="flex items-center justify-between gap-4">
          {title ? <h2 className="text-h3 font-semibold text-ink">{title}</h2> : <span />}
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-xl text-sand-600 transition-colors hover:bg-cream-dark"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
