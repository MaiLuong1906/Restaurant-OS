'use client';

import * as React from 'react';
import { Payslip, TipMonthSummary } from '@/types';
import { formatVnd } from '@/lib/formatMoney';
import { ChevronRight, Coins } from 'lucide-react';

export interface PayslipListViewProps {
  payslips: Payslip[];
  currentTipMonth: TipMonthSummary | null;
  onOpenPayslipDetail: (payslip: Payslip) => void;
  onOpenTipDetail: () => void;
}

export function PayslipListView({
  payslips,
  currentTipMonth,
  onOpenPayslipDetail,
  onOpenTipDetail,
}: PayslipListViewProps) {
  const latestTipDateLabel =
    currentTipMonth?.dailyEntries && currentTipMonth.dailyEntries.length > 0
      ? `Cập nhật đến ${currentTipMonth.dailyEntries[0].dateLabel}`
      : currentTipMonth
        ? `Kỳ ${currentTipMonth.monthKey}`
        : '';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2B2118]">Phiếu lương</h1>
          <p className="text-xs text-[#7A6A58] mt-0.5">Thu nhập theo tháng và chi tiết tip</p>
        </div>
      </div>

      {/* Thẻ Tip tháng hiện tại */}
      {currentTipMonth && (
        <div
          onClick={onOpenTipDetail}
          className="bg-white rounded-lg border border-[#E9E4DC] hover:border-[#8C1D2C]/40 p-4 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#2B2118]">{currentTipMonth.monthLabel}</h2>
                <p className="text-xs text-[#7A6A58]">{latestTipDateLabel}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-[#8C1D2C] tabular-nums">
                {formatVnd(currentTipMonth.totalAmount)}
              </div>
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-[#7A6A58] rounded">
                {currentTipMonth.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#7A6A58] mt-3 pt-2 border-t border-[#F6F4F0]">
            Tip được quản lý độc lập — không phụ thuộc vào việc có phiếu lương hay không.
          </p>
        </div>
      )}

      {/* Danh sách phiếu lương */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider">
          Danh sách phiếu lương
        </h2>

        {payslips.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E9E4DC] p-8 text-center text-sm text-[#7A6A58]">
            Không có phiếu lương nào.
          </div>
        ) : (
          payslips.map((ps) => {
            const isProvisional = ps.status === 'PROVISIONAL';
            return (
              <div
                key={ps.id}
                onClick={() => onOpenPayslipDetail(ps)}
                className="bg-white rounded-lg border border-[#E9E4DC] hover:border-[#8C1D2C]/40 p-4 shadow-xs cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#2B2118]">
                      {ps.monthLabel || ps.month}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                        isProvisional
                          ? 'bg-gray-100 text-[#7A6A58]'
                          : 'bg-red-50 text-[#8C1D2C] border border-red-100'
                      }`}
                    >
                      {isProvisional ? 'Tạm tính' : 'Đã chốt'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6A58] mt-0.5">
                    Kỳ tính: {ps.periodLabel || ps.month}
                  </p>
                  <p className="text-xs text-[#7A6A58] mt-0.5">{ps.paymentNote}</p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="text-xs text-[#7A6A58]">Thực nhận</div>
                    <div className="text-base font-bold text-[#8C1D2C] tabular-nums">
                      {formatVnd(ps.netSalary)}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#7A6A58]" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
