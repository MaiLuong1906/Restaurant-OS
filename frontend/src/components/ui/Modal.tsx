'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** Hộp thoại modal dùng chung (xác nhận, form ngắn). Nền trắng, shadow nâu ấm.
 * Review 2026-11-01: bấm Escape để đóng + khóa cuộn body khi mở. */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-brown-900/60 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('w-full max-w-lg rounded-card bg-white p-6 shadow-warm-lg', className)}
        onClick={(e) => e.stopPropagation()}
      >
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
