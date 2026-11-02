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

/** Hộp thoại modal dùng chung (xác nhận, form ngắn). Nền trắng, shadow nâu ấm. */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
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
