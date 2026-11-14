'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { QuickActionItem } from '@/components/staff/QuickActions';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  loadQuickActionCounts,
  incrementQuickActionCount,
  sortActionsForSpeedDial,
} from '@/lib/quickActionCounts';

export interface QuickActionsFabProps {
  actions: QuickActionItem[];
}

export function QuickActionsFab({ actions }: QuickActionsFabProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [entered, setEntered] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const staffUser = useAuthStore((s) => s.staffUser);
  const staffId = staffUser?.id || null;

  const fabButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const pillRefs = React.useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const wasOpenRef = React.useRef(false);

  // Kiểm tra prefers-reduced-motion
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Sắp xếp danh sách action cho Speed-Dial (action có lượt bấm cao nhất ở cuối mảng - sát FAB)
  const sortedActions = React.useMemo(() => {
    if (!open && !mounted) return actions;
    const counts = loadQuickActionCounts(staffId);
    return sortActionsForSpeedDial(actions, counts);
  }, [actions, staffId, open, mounted]);

  // Quản lý animation mount / enter / exit
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      if (reducedMotion) {
        setEntered(true);
      } else {
        const frame = requestAnimationFrame(() => {
          setEntered(true);
        });
        return () => cancelAnimationFrame(frame);
      }
    } else {
      setEntered(false);
      if (reducedMotion) {
        setMounted(false);
      } else {
        const timer = setTimeout(() => {
          setMounted(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [open, reducedMotion]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleSelect = React.useCallback(
    (action: QuickActionItem) => {
      incrementQuickActionCount(action, staffId);
      action.onClick?.();
      handleClose();
    },
    [staffId, handleClose]
  );

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

  // Focus management: Focus vào pill gần FAB nhất khi mở; trả focus về FAB khi đóng
  React.useEffect(() => {
    if (open && entered) {
      // Pill gần FAB nhất là pill cuối cùng trong mảng
      const nearestPill = pillRefs.current[sortedActions.length - 1];
      nearestPill?.focus();
    } else if (wasOpenRef.current && !open) {
      fabButtonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open, entered, sortedActions.length]);

  return (
    <>
      {/* Floating Action Button (FAB) - Chỉ hiện trên mobile (md:hidden) */}
      <button
        ref={fabButtonRef}
        type="button"
        onClick={handleToggle}
        aria-label={open ? 'Đóng thao tác nhanh' : 'Mở thao tác nhanh'}
        aria-expanded={open}
        aria-controls="speed-dial-pills"
        className="md:hidden fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom)+16px)] w-14 h-14 rounded-full bg-ops-brand text-white shadow-lg z-50 active:scale-98 flex items-center justify-center transition-transform cursor-pointer"
      >
        <Plus
          className={`h-6 w-6 transform transition-transform ${
            reducedMotion ? '' : 'duration-200'
          } ${open && !reducedMotion ? 'rotate-45' : 'rotate-0'}`}
        />
      </button>

      {/* Speed-Dial Modal (Backdrop + Pills) */}
      {mounted ? (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop kính mờ */}
          <div
            className={`absolute inset-0 bg-black/35 ${
              reducedMotion ? '' : 'backdrop-blur-md transition-opacity duration-200'
            } ${entered ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Cột dọc 4 pill kính mờ trồi lên ngay trên FAB */}
          <div
            id="speed-dial-pills"
            role="menu"
            aria-label="Danh sách thao tác nhanh"
            className="fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom)+16px+56px+10px)] flex flex-col items-end gap-[10px] z-50 pointer-events-auto"
          >
            {sortedActions.map((action, idx) => {
              const Icon = action.icon;
              // Khoảng cách từ pill tới FAB: pill cuối cùng (idx = len - 1) cách 0 bước
              const distanceFromFab = sortedActions.length - 1 - idx;
              const delayMs = reducedMotion ? 0 : distanceFromFab * 50;

              const pillStyle: React.CSSProperties = {
                transitionDelay: `${delayMs}ms`,
              };

              const pillClasses = `min-h-[48px] px-4 py-2 rounded-full bg-white/70 ${
                reducedMotion ? '' : 'backdrop-blur-md shadow-lg transition-all duration-200'
              } flex items-center gap-3 active:scale-98 cursor-pointer select-none ${
                entered
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-3 scale-95'
              }`;

              const pillContent = (
                <>
                  <span className="text-sm font-semibold text-ink whitespace-nowrap">
                    {action.label}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-ops-brand text-white flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                </>
              );

              if (action.href) {
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    ref={(el) => {
                      pillRefs.current[idx] = el;
                    }}
                    role="menuitem"
                    aria-label={action.label}
                    style={pillStyle}
                    className={pillClasses}
                    onClick={() => handleSelect(action)}
                  >
                    {pillContent}
                  </Link>
                );
              }

              return (
                <button
                  key={action.label}
                  type="button"
                  ref={(el) => {
                    pillRefs.current[idx] = el;
                  }}
                  role="menuitem"
                  aria-label={action.label}
                  style={pillStyle}
                  className={pillClasses}
                  onClick={() => handleSelect(action)}
                >
                  {pillContent}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
