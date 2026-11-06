'use client';

import * as React from 'react';
import Link from 'next/link';
import { staffService } from '@/services/mock/mockStaffService';
import { Payslip, TipMonthSummary, TipRecord } from '@/types';
import { formatVnd } from '@/lib/formatMoney';
import {
  ChevronRight,
  AlertCircle,
  Coins,
  Receipt,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';

export default function PayslipPage() {
  // Views: 'B11' (Danh sách phiếu & tip) | 'B12' (Chi tiết phiếu lương) | 'B13' (Chi tiết tip)
  const [view, setView] = React.useState<'B11' | 'B12' | 'B13'>('B11');

  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [tipMonths, setTipMonths] = React.useState<TipMonthSummary[]>([]);
  const [selectedPayslip, setSelectedPayslip] = React.useState<Payslip | null>(null);
  const [currentTipMonth, setCurrentTipMonth] = React.useState<TipMonthSummary | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ps, tms] = await Promise.all([
        staffService.getPayslips(),
        staffService.getTipMonths(),
      ]);
      setPayslips(ps);
      setTipMonths(tms);
      if (tms.length > 0) {
        setCurrentTipMonth(tms[0]);
      }
    } catch (err) {
      setError((err as Error).message || 'Không thể tải thông tin phiếu lương');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = (ps: Payslip) => {
    setSelectedPayslip(ps);
    setView('B12');
  };

  const handleOpenTip = () => {
    setView('B13');
  };

  // Tính thu nhập chi tiết
  const getIncomeTotal = (ps: Payslip) => {
    return ps.workedHours * ps.hourlyRate + ps.allowance + ps.bonus;
  };

  // Tính khấu trừ chi tiết
  const getDeductionTotal = (ps: Payslip) => {
    return (ps.bhxhAmount || 0) + (ps.advanceAmount || 0);
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      {/* ===================== B11: DANH SÁCH PHIẾU LƯƠNG & TIP ===================== */}
      {view === 'B11' && (
        <div className="max-w-[720px] mx-auto px-4 py-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#2B2118]">Phiếu lương</h1>
              <p className="text-xs text-[#7A6A58] mt-0.5">Thu nhập theo tháng và chi tiết tip</p>
            </div>
          </div>

          {/* Thẻ Tip tháng hiện tại */}
          {currentTipMonth && (
            <div
              onClick={handleOpenTip}
              className="bg-white rounded-lg border border-[#E9E4DC] hover:border-[#8C1D2C]/40 p-4 shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#2B2118]">
                      {currentTipMonth.monthLabel}
                    </h2>
                    <p className="text-xs text-[#7A6A58]">Tính đến 05/11</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-[#8C1D2C] tabular-nums">
                    {formatVnd(currentTipMonth.totalAmount)}
                  </div>
                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-[#7A6A58] rounded">
                    Chưa thanh toán
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
                    onClick={() => handleOpenDetail(ps)}
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
      )}

      {/* ===================== B12: CHI TIẾT PHIẾU LƯƠNG ===================== */}
      {view === 'B12' && selectedPayslip && (
        <div className="max-w-[720px] mx-auto px-4 py-4 space-y-4">
          <button
            type="button"
            onClick={() => setView('B11')}
            className="text-sm font-semibold text-[#8C1D2C] hover:underline min-h-[44px] flex items-center gap-1"
          >
            ← Phiếu lương
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#2B2118]">
              Phiếu lương {selectedPayslip.monthLabel || selectedPayslip.month}
            </h1>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                selectedPayslip.status === 'PROVISIONAL'
                  ? 'bg-gray-100 text-[#7A6A58]'
                  : 'bg-red-50 text-[#8C1D2C] border border-red-100'
              }`}
            >
              {selectedPayslip.status === 'PROVISIONAL' ? 'Tạm tính' : 'Đã chốt'}
            </span>
          </div>

          {/* Banner giải thích phiếu tạm tính tháng 11 */}
          {selectedPayslip.status === 'PROVISIONAL' && (
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
              {formatVnd(selectedPayslip.netSalary)}
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
                Lương theo giờ ({selectedPayslip.workedHours} giờ ×{' '}
                {formatVnd(selectedPayslip.hourlyRate)})
              </span>
              <span className="font-semibold text-[#141210] tabular-nums">
                {formatVnd(selectedPayslip.workedHours * selectedPayslip.hourlyRate)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
              <span className="text-[#7A6A58]">Thưởng KPI</span>
              <span className="font-semibold text-[#141210] tabular-nums">
                {formatVnd(selectedPayslip.bonus)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
              <span className="text-[#7A6A58]">Phụ cấp ăn ca</span>
              <span className="font-semibold text-[#141210] tabular-nums">
                {formatVnd(selectedPayslip.allowance)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E9E4DC] font-bold text-[#2B2118]">
              <span>Tổng thu nhập</span>
              <span className="tabular-nums">{formatVnd(getIncomeTotal(selectedPayslip))}</span>
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
                -{formatVnd(selectedPayslip.bhxhAmount || 200000)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
              <span className="text-[#7A6A58]">Tạm ứng</span>
              <span className="font-semibold text-[#D14B3A] tabular-nums">
                -{formatVnd(selectedPayslip.advanceAmount || 50000)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E9E4DC] font-bold text-[#2B2118]">
              <span>Tổng khấu trừ</span>
              <span className="text-[#D14B3A] tabular-nums">
                -{formatVnd(getDeductionTotal(selectedPayslip))}
              </span>
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
                {selectedPayslip.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Dự kiến thanh toán'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
              <span className="text-[#7A6A58]">Ngày thanh toán</span>
              <span className="font-semibold text-[#141210]">
                {selectedPayslip.paymentDateLabel || '10/12/2026'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== B13: CHI TIẾT TIP ===================== */}
      {view === 'B13' && currentTipMonth && (
        <div className="max-w-[720px] mx-auto px-4 py-4 space-y-4">
          <button
            type="button"
            onClick={() => setView('B11')}
            className="text-sm font-semibold text-[#8C1D2C] hover:underline min-h-[44px] flex items-center gap-1"
          >
            ← Phiếu lương
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
              Tổng tip tháng 11
            </h2>
            <div className="text-3xl font-bold text-[#8C1D2C] tabular-nums">
              {formatVnd(currentTipMonth.totalAmount)}
            </div>
            <p className="text-xs text-[#7A6A58]">Tính đến 05/11</p>
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-[#7A6A58] rounded">
                Chưa thanh toán
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
                .filter((m) => m.monthKey !== '2026-11')
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
      )}
    </div>
  );
}
