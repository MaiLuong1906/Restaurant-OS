'use client';

import * as React from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { QuickActionItem, QuickActions } from '@/components/staff/QuickActions';

export interface QuickActionsFabProps {
  actions: QuickActionItem[];
}

export function QuickActionsFab({ actions }: QuickActionsFabProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [entered, setEntered] = React.useState(false);
  const fabButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = React.useRef(false);

  // Quản lý animation mount / enter / exit
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // Kích hoạt transition translate-y-0 sau khi render frame đầu tiên (translate-y-full)
      const frame = requestAnimationFrame(() => {
        setEntered(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setEntered(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Escape key handler
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  // Return focus to FAB when closing
  React.useEffect(() => {
    if (wasOpenRef.current && !open) {
      fabButtonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <>
      {/* Floating Action Button (FAB) - Chỉ hiện trên mobile (md:hidden) */}
      <button
        ref={fabButtonRef}
        type="button"
        onClick={handleToggle}
        aria-label="Thao tác nhanh"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="md:hidden fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom)+16px)] w-14 h-14 rounded-full bg-ops-brand text-white shadow-lg z-40 active:scale-98 flex items-center justify-center transition-transform cursor-pointer"
      >
        {open ? <X className="h-6 w-6" /> : <LayoutGrid className="h-6 w-6" />}
      </button>

      {/* Bottom Sheet Modal */}
      {mounted ? (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-280 ease-standard ${
              entered ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Thao tác nhanh"
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-ops-bg p-4 pb-[calc(16px+env(safe-area-inset-bottom))] transition-transform duration-280 ease-standard ${
              entered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <QuickActions
              title="Thao tác nhanh"
              subtitle="Chọn chức năng để thực hiện tác vụ"
              actions={actions}
              onItemClick={handleClose}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
