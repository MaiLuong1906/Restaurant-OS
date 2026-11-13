'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  History,
  LockOpen,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { ShiftSettlementRecord } from '@/types';
import { formatVND } from '@/lib/utils';

interface ShiftSettlementViewProps {
  shift: ShiftSettlementRecord;
  onSettleShift: (actualCountedCash: number, discrepancyReason: string) => void;
  onReopenShiftDemo: () => void;
  onTriggerCashDrawer: (reason: string) => void;
}

export function ShiftSettlementView({
  shift,
  onSettleShift,
  onReopenShiftDemo,
  onTriggerCashDrawer,
}: ShiftSettlementViewProps) {
  const expectedCash =
    shift.openingCash +
    shift.cashSales +
    shift.depositCashCollected -
    shift.cashRefundsOrPayouts;

  const [countedStr, setCountedStr] = React.useState<string>(String(expectedCash));
  const [reason, setReason] = React.useState<string>(shift.discrepancyReason || '');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCountedStr(String(shift.actualCountedCash ?? expectedCash));
  }, [expectedCash, shift.actualCountedCash]);

  const countedCash = Math.max(0, Math.round(Number(countedStr.replace(/[^0-9]/g, '')) || 0));
  const diff = countedCash - expectedCash;

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (diff !== 0 && !reason.trim()) {
      setErrorMsg(
        'Số tiền kiểm đếm thực tế đang chênh lệch so với dự kiến — bắt buộc nhập lý do giải trình.'
      );
      return;
    }
    setErrorMsg(null);
    onSettleShift(countedCash, reason);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 pb-24 md:px-6 md:pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Use Case • Settle Cash &amp; Balance Shift
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">
            Đối Soát Tiền Mặt &amp; Kết Ca Thu Ngân
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTriggerCashDrawer('Mở két kiểm đếm tiền mặt cuối ca')}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-sand-300 bg-white px-4 text-xs font-bold text-ink shadow-warm-sm hover:bg-cream-dark"
          >
            <LockOpen className="h-4 w-4 text-primary-500" />
            <span>Mở két kiểm tiền</span>
          </button>
          {shift.status === 'SETTLED' ? (
            <button
              type="button"
              onClick={onReopenShiftDemo}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-primary-300 bg-primary-50 px-4 text-xs font-bold text-primary-600"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Mở lại ca (Demo)</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái: Bảng công thức đối soát tiền mặt trong két */}
        <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-lg font-bold text-ink">{shift.shiftName}</h2>
                <p className="text-xs text-muted">
                  Giờ ca: {shift.startTime} – {shift.endTime} • Phụ trách: {shift.cashierName}
                </p>
              </div>
            </div>
            <span
              className={`rounded-lg px-3 py-1 text-xs font-bold ${
                shift.status === 'OPEN'
                  ? 'bg-sage-100 text-sage-700'
                  : 'bg-primary-100 text-primary-600'
              }`}
            >
              {shift.status === 'OPEN'
                ? 'Đang mở ca'
                : `Đã chốt lúc ${shift.settledAt ?? ''}`}
            </span>
          </div>

          {/* Công thức tính tiền mặt dự kiến */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-sand-200/70 py-2">
              <span className="text-muted">1. Tiền mặt đầu ca (Opening Cash)</span>
              <span className="ops-nums font-bold text-ink">
                {formatVND(shift.openingCash)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-sand-200/70 py-2">
              <span className="text-muted">2. Tiền mặt thu từ bán hàng (+)</span>
              <span className="ops-nums font-bold text-sage-700">
                +{formatVND(shift.cashSales)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-sand-200/70 py-2">
              <span className="text-muted">3. Tiền cọc đặt bàn thu tiền mặt (+)</span>
              <span className="ops-nums font-bold text-sage-700">
                +{formatVND(shift.depositCashCollected)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-sand-200/70 py-2">
              <span className="text-muted">4. Chi nội bộ / Hoàn tiền mặt (−)</span>
              <span className="ops-nums font-bold text-danger-600">
                -{formatVND(shift.cashRefundsOrPayouts)}
              </span>
            </div>

            <div className="flex items-baseline justify-between rounded-xl border border-sand-300 bg-cream p-4">
              <div>
                <p className="text-sm font-extrabold text-ink">
                  TIỀN MẶT DỰ KIẾN TRONG KÉT
                </p>
                <p className="text-xs text-muted">
                  = Đầu ca + Thu bán hàng + Cọc mặt − Chi/Hoàn
                </p>
              </div>
              <span className="ops-nums text-2xl font-extrabold text-primary-500">
                {formatVND(expectedCash)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-dashed border-sand-300 bg-white px-4 py-3 text-xs">
              <span className="text-muted">
                Doanh thu Chuyển khoản VietQR &amp; Thẻ POS (Đối soát tự động qua cổng):
              </span>
              <strong className="ops-nums text-sm text-ink">
                {formatVND(shift.qrAndCardSales)}
              </strong>
            </div>
          </div>

          {/* Form nhập số tiền kiểm đếm thực tế */}
          <form onSubmit={handleConfirmClose} className="space-y-4 border-t border-sand-200 pt-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="actual-cash" className="text-xs font-bold text-ink">
                  Nhập số tiền mặt kiểm đếm thực tế tại két (VND):
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCountedStr(String(expectedCash))}
                    className="cursor-pointer rounded border border-sand-300 bg-cream px-2 py-0.5 text-[11px] font-bold text-ink hover:bg-cream-dark"
                  >
                    Khớp 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountedStr(String(expectedCash - 50000))}
                    className="cursor-pointer rounded border border-danger-200 bg-kds-overdue-bg px-2 py-0.5 text-[11px] font-bold text-danger-600"
                  >
                    Giả lập lệch -50k
                  </button>
                </div>
              </div>
              <input
                id="actual-cash"
                type="text"
                inputMode="numeric"
                value={countedStr}
                onChange={(e) => setCountedStr(e.target.value)}
                className="ops-nums min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-right text-lg font-extrabold text-ink outline-none focus:border-primary-500"
              />
            </div>

            {/* Hiển thị chênh lệch */}
            <div
              className={`flex items-center justify-between rounded-xl border p-3.5 text-sm ${
                diff === 0
                  ? 'border-sage-200 bg-sage-100/70 text-sage-700'
                  : 'border-danger-200 bg-kds-overdue-bg text-danger-600'
              }`}
            >
              <span className="font-bold">
                {diff === 0
                  ? '✓ Khớp két tuyệt đối (Không chênh lệch)'
                  : diff > 0
                  ? '⚠️ Tiền thực tế đang DƯ so với sổ sách:'
                  : '⚠️ Tiền thực tế đang THIẾU so với sổ sách:'}
              </span>
              <span className="ops-nums text-lg font-extrabold">
                {diff > 0 ? `+${formatVND(diff)}` : formatVND(diff)}
              </span>
            </div>

            {diff !== 0 ? (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-danger-600">
                  Lý do chênh lệch (Bắt buộc nhập khi lệch két) *
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Chi tạm ứng mua đá viên chưa kịp nhập phiếu chi..."
                  className="min-h-12 w-full rounded-xl border border-danger-500 bg-white px-4 text-sm text-ink outline-none"
                />
              </div>
            ) : null}

            {errorMsg ? (
              <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-kds-overdue-bg p-3 text-xs font-bold text-danger-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={shift.status === 'SETTLED'}
              className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>
                {shift.status === 'SETTLED'
                  ? 'Ca làm việc đã được chốt đối soát'
                  : 'Xác nhận Đối soát & Đóng ca Thu ngân'}
              </span>
            </button>
          </form>
        </div>

        {/* Cột phải: Nhật ký mở két tiền (Trigger Cash Drawer Logs) */}
        <div className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-sand-200 pb-4">
              <History className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Nhật ký Mở Két Tiền ({shift.drawerOpenLogs.length})
                </h2>
                <p className="text-xs text-muted">
                  Mọi lệnh mở ngăn kéo tiền đều gắn Idempotency-Key &amp; lưu vết kiểm toán
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {shift.drawerOpenLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-sand-200 bg-cream/50 p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="ops-nums font-bold text-primary-500">
                      🕒 {log.timestamp}
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-muted">
                      #{log.idempotencyKey.slice(0, 8)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-bold text-ink">{log.reason}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Thực hiện bởi: {log.triggeredBy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-sand-200 bg-cream p-4 text-xs text-muted">
            <p className="font-bold text-ink">Quy chuẩn Kiểm toán Ca Thu Ngân</p>
            <p className="mt-1">
              • Tiền mặt đếm tay đối chiếu trực tiếp với két vật lý.
              <br />• VietQR NAPAS 247 &amp; Thẻ đối soát tự động theo lô giao dịch ngân hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

