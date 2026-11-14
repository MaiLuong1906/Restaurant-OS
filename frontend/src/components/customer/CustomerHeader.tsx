'use client';

import { ArrowLeft, BellRing, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CustomerHeaderProps {
  title?: string;
  subtitle?: string;
  tableNumber?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenCallStaff?: () => void;
}

export function CustomerHeader({
  title = 'Phố Cổ',
  subtitle = 'Thực Đơn',
  tableNumber = 'Bàn 04',
  showBack = false,
  onBack,
  onOpenCallStaff,
}: CustomerHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fff8f6]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#dcc1b8]/40">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Quay lại"
              className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#1e1b1a] hover:bg-[#efe6e4] active:scale-95 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              {!showBack && (
                <span className="h-2 w-2 rounded-full bg-[#00873a] animate-pulse shrink-0" />
              )}
              <h1 className="truncate font-display text-lg font-bold tracking-tight text-[#1e1b1a]">
                {title}
              </h1>
            </div>
            {subtitle ? (
              <span className="truncate text-[11px] font-medium text-[#56423c]">
                {subtitle}
              </span>
            ) : null}
          </div>

          <span className="inline-flex shrink-0 items-center rounded-full bg-[#ffdbcf] px-2.5 py-0.5 text-xs font-bold text-[#380d00] shadow-xs">
            {tableNumber}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenCallStaff}
            className="flex h-10 min-h-[44px] items-center gap-1.5 rounded-full bg-[#efe6e4] hover:bg-[#e9e1df] px-3 text-xs font-semibold text-[#9a401c] active:scale-95 transition-all"
          >
            <BellRing className="h-4 w-4 text-[#9a401c]" />
            <span>Gọi NV</span>
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9a401c] text-white shadow-xs">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
