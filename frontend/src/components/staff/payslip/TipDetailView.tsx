'use client';

import * as React from 'react';
import { TipMonthSummary } from '@/types';
import { formatVnd } from '@/lib/formatMoney';
import { ArrowLeft } from 'lucide-react';

export interface TipDetailViewProps {
  currentTipMonth: TipMonthSummary;
  tipMonths: TipMonthSummary[];
  onBack: () => void;
}

export function TipDetailView({ currentTipMonth, tipMonths, onBack }: TipDetailViewProps) {
  const summaryHeading = currentTipMonth.monthLabel
    ? `Tổng ${currentTipMonth.monthLabel.toLowerCase()}`
    : `Tổng tip kỳ ${currentTipMonth.monthKey}`;

  const latestTipDateLabel =
    currentTipMonth.dailyEntries && currentTipMonth.dailyEntries.length > 0
      ? `Cập nhật đến ${currentTipMonth.dailyEntries[0].dateLabel}`
      : `Kỳ ${currentTipMonth.monthKey}`;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Phiếu lương</span>
      </button>

      <div>
        <h1 className="text-xl font-bold text-[#2B2118]">{currentTipMonth.monthLabel}</h1>
        <p className="text-xs text-[#7A6A58] mt-0.5">
          Tip tách riêng khỏi lương, không tính vào phiếu lương
        </p>
      </div>

      {/* Tổng tip card */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-2">
        <h2 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider">
          {summaryHeading}
        </h2>
        <div className="text-3xl font-bold text-[#8C1D2C] tabular-nums">
          {formatVnd(currentTipMonth.totalAmount)}
        </div>
        <p className="text-xs text-[#7A6A58]">{latestTipDateLabel}</p>
        <div>
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-[#7A6A58] rounded">
            {currentTipMonth.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </span>
        </div>
        <p className="text-xs text-[#7A6A58] pt-2 border-t border-[#F6F4F0]">
          {currentTipMonth.paymentNote}
        </p>
      </div>

      {/* Tip theo ngày */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#2B2118]">Tip theo ngày</h2>
          <p className="text-xs text-[#7A6A58] mt-0.5">
            Tip được chia theo ca làm việc — số tiền mỗi ngày là tổng tip của các ca trong ngày
            đó.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {currentTipMonth.dailyEntries?.map((entry) => (
            <div
              key={entry.date}
              className="flex items-center justify-between p-3 rounded-lg bg-[#F6F4F0] border border-[#E9E4DC]"
            >
              <div>
                <div className="text-sm font-semibold text-[#2B2118]">{entry.dateLabel}</div>
                <div className="text-xs text-[#7A6A58] mt-0.5">{entry.shiftLabel}</div>
              </div>
              <div className="text-sm font-bold text-[#8C1D2C] tabular-nums">
                {formatVnd(entry.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Các tháng trước (chỉ đọc) */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#2B2118]">Các tháng trước</h2>
          <p className="text-xs text-[#7A6A58] mt-0.5">
            Chỉ xem tổng theo tháng — chi tiết theo ngày chỉ có cho tháng hiện tại.
          </p>
        </div>

        <div className="space-y-2 text-sm pt-1">
          {tipMonths
            .filter((m) => m.monthKey !== currentTipMonth.monthKey)
            .map((m) => (
              <div
                key={m.monthKey}
                className="flex justify-between py-2 border-b border-[#F6F4F0] last:border-0"
              >
                <div>
                  <span className="font-semibold text-[#2B2118]">{m.monthLabel}</span>
                  <span className="ml-2 text-xs text-emerald-700 font-medium">
                    Đã thanh toán
                  </span>
                </div>
                <span className="font-bold text-[#141210] tabular-nums">
                  {formatVnd(m.totalAmount)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
