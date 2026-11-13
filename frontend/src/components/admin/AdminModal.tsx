'use client';

import * as React from 'react';
import { X } from 'lucide-react';

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Modal dùng chung cho toàn bộ Admin Portal, hỗ trợ sẵn a11y, backdrop-blur và đóng bằng phím Escape
 */
export function AdminModal({
  isOpen,
  onClose,
  title,
  icon,
  description,
  maxWidth = 'md',
  children,
  footer,
  className = '',
  ariaLabel,
}: AdminModalProps) {
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      // Delay nhỏ để DOM render xong
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const accessibleTitle =
    ariaLabel || (typeof title === 'string' ? title : 'Cửa sổ thao tác quản trị');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={accessibleTitle}
      className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
    >
      <div
        className={`bg-white rounded-xl ${MAX_WIDTH_MAP[maxWidth]} w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            {icon && <div className="text-ops-brand shrink-0">{icon}</div>}
            <div>
              <h3 className="font-ops text-base font-bold text-stone-900">{title}</h3>
              {description && (
                <p className="text-xs text-stone-500 font-normal mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Đóng modal"
            className="w-7 h-7 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3">{children}</div>

        {/* Footer (if any) */}
        {footer && <div className="pt-3 border-t border-stone-200">{footer}</div>}
      </div>
    </div>
  );
}

