'use client';

import * as React from 'react';
import { Payslip } from '@/types';
import { formatVnd } from '@/lib/formatMoney';
import { ArrowLeft, Info } from 'lucide-react';

export interface PayslipDetailViewProps {
  payslip: Payslip;
  onBack: () => void;
}

export function PayslipDetailView({ payslip, onBack }: PayslipDetailViewProps) {
  const incomeTotal =
    payslip.workedHours * payslip.hourlyRate + payslip.allowance + payslip.bonus;
  const deductionTotal = (payslip.bhxhAmount || 0) + (payslip.advanceAmount || 0);

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

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2B2118]">
          Phiếu lương {payslip.monthLabel || payslip.month}
        </h1>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded ${
            payslip.status === 'PROVISIONAL'
              ? 'bg-gray-100 text-[#7A6A58]'
              : 'bg-red-50 text-[#8C1D2C] border border-red-100'
          }`}
        >
          {payslip.status === 'PROVISIONAL' ? 'Tạm tính' : 'Đã chốt'}
        </span>
      </div>

      {/* Banner giải thích phiếu tạm tính */}
      {payslip.status === 'PROVISIONAL' && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <b>Phiếu tạm tính</b> — tính theo lịch ca đã xếp cả tháng (100 giờ × 40.000đ), chưa
            phải giờ làm thực tế. Số liệu sẽ thay đổi khi hết tháng.
          </div>
        </div>
      )}

      {/* Thẻ Thực nhận */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs">
        <h2 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider">
          Thực nhận
        </h2>
        <div className="text-3xl font-bold text-[#8C1D2C] mt-1 tabular-nums">
          {formatVnd(payslip.netSalary)}
        </div>
        <p className="text-xs text-[#7A6A58] mt-1">Đã trừ các khoản khấu trừ bên dưới</p>
      </div>

      {/* Thu nhập */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-2 text-sm">
        <h2 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
          Thu nhập
        </h2>
        <div className="flex justify-between py-1">
          <span className="text-[#7A6A58]">
            Lương theo giờ ({payslip.workedHours} giờ × {formatVnd(payslip.hourlyRate)})
          </span>
          <span className="font-semibold text-[#141210] tabular-nums">
            {formatVnd(payslip.workedHours * payslip.hourlyRate)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
          <span className="text-[#7A6A58]">Thưởng KPI</span>
          <span className="font-semibold text-[#141210] tabular-nums">
            {formatVnd(payslip.bonus)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
          <span className="text-[#7A6A58]">Phụ cấp ăn ca</span>
          <span className="font-semibold text-[#141210] tabular-nums">
            {formatVnd(payslip.allowance)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#E9E4DC] font-bold text-[#2B2118]">
          <span>Tổng thu nhập</span>
          <span className="tabular-nums">{formatVnd(incomeTotal)}</span>
        </div>
      </div>

      {/* Khấu trừ */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-2 text-sm">
        <h2 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
          Khấu trừ
        </h2>
        <div className="flex justify-between py-1">
          <span className="text-[#7A6A58]">Bảo hiểm xã hội</span>
          <span className="font-semibold text-[#D14B3A] tabular-nums">
            -{formatVnd(payslip.bhxhAmount || 200000)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
          <span className="text-[#7A6A58]">Tạm ứng</span>
          <span className="font-semibold text-[#D14B3A] tabular-nums">
            -{formatVnd(payslip.advanceAmount || 50000)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#E9E4DC] font-bold text-[#2B2118]">
          <span>Tổng khấu trừ</span>
          <span className="text-[#D14B3A] tabular-nums">-{formatVnd(deductionTotal)}</span>
        </div>
        <p className="text-[11px] text-[#7A6A58] pt-1">
          Tỷ lệ BHXH và giới hạn tạm ứng do quán quy định — số tiền trong phiếu là ví dụ.
        </p>
      </div>

      {/* Thanh toán */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-2 text-sm">
        <h2 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
          Thanh toán
        </h2>
        <div className="flex justify-between py-1">
          <span className="text-[#7A6A58]">Trạng thái</span>
          <span className="font-semibold text-[#141210]">
            {payslip.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Dự kiến thanh toán'}
          </span>
        </div>
        <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
          <span className="text-[#7A6A58]">Ngày thanh toán</span>
          <span className="font-semibold text-[#141210]">
            {payslip.paymentDateLabel || '10/12/2026'}
          </span>
        </div>
      </div>
    </div>
  );
}
