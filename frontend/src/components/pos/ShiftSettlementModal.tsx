'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  LockOpen,
  Plus,
  RotateCcw,
  StickyNote,
  Wallet,
} from 'lucide-react';
import {
  ShiftSettlementRecord,
} from '@/types';
import {
  formatVND,
} from '@/lib/utils';

interface ShiftSettlementViewProps {
  shift: ShiftSettlementRecord;
  isCashDrawerOpen?: boolean;
  onSettleShift: (actualCountedCash: number, discrepancyReason: string) => void;
  onRecordPayout: (amount: number, note: string) => void;
  onReopenShiftDemo: () => void;
  onTriggerCashDrawer: (reason: string) => void;
}

export function ShiftSettlementView({
  shift,
  isCashDrawerOpen = false,
  onSettleShift,
  onRecordPayout,
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

  // Internal cash payout note state
  const [payoutOpen, setPayoutOpen] = React.useState<boolean>(false);
  const [payoutAmountStr, setPayoutAmountStr] = React.useState<string>('50000');
  const [payoutNote, setPayoutNote] = React.useState<string>('');
  const [payoutError, setPayoutError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCountedStr(String(shift.actualCountedCash ?? expectedCash));
  }, [expectedCash, shift.actualCountedCash]);

  const countedCash = Math.max(0, Math.round(Number(countedStr.replace(/[^0-9]/g, '')) || 0));
  const diff = countedCash - expectedCash;

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (shift.status === 'SETTLED') return;
    if (diff !== 0 && !reason.trim()) {
      setErrorMsg(
        'Số tiền kiểm đếm thực tế đang chênh lệch so với dự kiến — bắt buộc nhập lý do giải trình.'
      );
      return;
    }
    setErrorMsg(null);
    onSettleShift(countedCash, reason);
  };

  const handleSavePayout = () => {
    const parsedAmount = Math.max(
      0,
      Math.round(Number(payoutAmountStr.replace(/[^0-9]/g, '')) || 0)
    );
    if (parsedAmount <= 0) {
      setPayoutError('Vui lòng nhập số tiền chi hợp lệ (lớn hơn 0 ₫).');
      return;
    }
    if (!payoutNote.trim()) {
      setPayoutError('Vui lòng nhập ghi chú (note) lý do chi tiền nội bộ.');
      return;
    }
    setPayoutError(null);
    onRecordPayout(parsedAmount, payoutNote.trim());
    setPayoutAmountStr('50000');
    setPayoutNote('');
    setPayoutOpen(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 pb-24 md:px-8 md:pb-8">
      {/* Header Đối Soát Tiền Mặt & Kết Ca */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Nghiệp vụ Thu ngân • Đối Soát Tiền Mặt &amp; Kết Ca
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">
            Đối Soát Tiền Mặt &amp; Kết Ca Thu Ngân
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái: Bảng công thức đối soát tiền mặt trong két */}
        <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-4">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-lg font-bold text-ink">{shift.shiftName}</h2>
                <p className="text-xs text-muted">
                  Giờ ca: {shift.startTime} – {shift.endTime} • Phụ trách: {shift.cashierName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onTriggerCashDrawer('Mở két kiểm đếm tiền mặt cuối ca')
                }
                className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors ${
                  isCashDrawerOpen
                    ? 'border-primary-400 bg-primary-50 text-primary-600 hover:bg-primary-100'
                    : 'border-sand-300 bg-sand-100 text-ink hover:bg-sand-200'
                }`}
              >
                {isCashDrawerOpen ? (
                  <Lock className="h-4 w-4 text-primary-600" />
                ) : (
                  <LockOpen className="h-4 w-4 text-primary-500" />
                )}
                <span>{isCashDrawerOpen ? 'Đóng két' : 'Mở két kiểm tiền'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPayoutOpen((v) => !v)}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 text-xs font-bold text-ink transition-colors hover:bg-sand-100"
              >
                <Plus className="h-4 w-4 text-primary-500" />
                <span>Chi tiền nội bộ</span>
              </button>
            </div>
          </div>

          {/* Form Modal Mini nhập phiếu chi tiền nội bộ */}
          {payoutOpen ? (
            <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
              <div className="flex items-center gap-2 font-bold text-primary-600">
                <StickyNote className="h-4 w-4" />
                <span className="text-sm">Tạo phiếu chi tiền mặt từ két ca</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted">
                    Số tiền chi (VND)
                  </label>
                  <input
                    type="text"
                    value={payoutAmountStr}
                    onChange={(e) => setPayoutAmountStr(e.target.value)}
                    placeholder="VD: 50000"
                    className="ops-nums mt-1 min-h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted">
                    Ghi chú / Lý do chi
                  </label>
                  <input
                    type="text"
                    value={payoutNote}
                    onChange={(e) => setPayoutNote(e.target.value)}
                    placeholder="VD: Mua đá lạnh cấp tốc, trả shipper..."
                    className="mt-1 min-h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm text-ink outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              {payoutError ? (
                <p className="mt-2 text-xs font-semibold text-danger-600">
                  {payoutError}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePayout}
                  className="rounded-lg bg-primary-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-warm-sm hover:bg-primary-600"
                >
                  Xác nhận chi két
                </button>
              </div>
            </div>
          ) : null}

          {/* Dòng công thức tính toán tài chính chi tiết */}
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted">1. Số dư đầu ca (Tiền lẻ bàn giao)</span>
              <span className="ops-nums font-bold text-ink">
                +{formatVND(shift.openingCash)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted">2. Doanh thu bán hàng tiền mặt trong ca</span>
              <span className="ops-nums font-bold text-sage-700">
                +{formatVND(shift.cashSales)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted">3. Thu tiền cọc đặt bàn bằng tiền mặt</span>
              <span className="ops-nums font-bold text-sage-700">
                +{formatVND(shift.depositCashCollected)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted">
                4. Chi tiền mặt / Hoàn cọc / Chi tiêu nội bộ ({shift.payoutLogs.length} phiếu)
              </span>
              <span className="ops-nums font-bold text-danger-600">
                -{formatVND(shift.cashRefundsOrPayouts)}
              </span>
            </div>

            {/* Danh sách note chi tiêu két */}
            {shift.payoutLogs.length > 0 ? (
              <div className="rounded-xl border border-sand-200 bg-sand-50/50 p-3">
                <p className="text-xs font-bold text-ink">Lịch sử phiếu chi két:</p>
                <ul className="mt-1.5 divide-y divide-sand-200 text-xs">
                  {shift.payoutLogs.map((pn) => (
                    <li
                      key={pn.id}
                      className="flex items-center justify-between py-1.5 text-muted"
                    >
                      <span>
                        [{pn.timestamp}] {pn.note}
                      </span>
                      <strong className="ops-nums text-danger-600">
                        -{formatVND(pn.amount)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="my-1 border-t border-sand-200" />

            <div className="flex items-center justify-between rounded-xl bg-sand-100 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Tiền mặt dự kiến phải có trong két
                </p>
                <p className="text-xs text-muted">
                  (1) + (2) + (3) - (4)
                </p>
              </div>
              <span className="ops-nums text-2xl font-black text-primary-500">
                {formatVND(expectedCash)}
              </span>
            </div>
          </div>

          {/* Form đếm tiền & giải trình chênh lệch */}
          <form
            onSubmit={handleConfirmClose}
            className="flex flex-col gap-4 border-t border-sand-200 pt-5"
          >
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-ink">
                  Số tiền mặt thực tế kiểm đếm (VND)
                </label>
                <span className="text-xs text-muted">Đếm tất cả các mệnh giá tiền trong két</span>
              </div>
              <input
                type="text"
                disabled={shift.status === 'SETTLED'}
                value={countedStr}
                onChange={(e) => setCountedStr(e.target.value)}
                placeholder="Nhập số tiền mặt đếm được..."
                className="ops-nums mt-1.5 min-h-13 w-full rounded-xl border border-sand-300 bg-white px-4 text-xl font-black text-ink outline-none transition-colors focus:border-primary-500 disabled:bg-sand-100"
              />
            </div>

            {/* Cảnh báo chênh lệch tiền */}
            <div
              className={`rounded-xl border p-4 text-sm font-semibold transition-all ${
                diff === 0
                  ? 'border-sage-200 bg-sage-50 text-sage-800'
                  : 'border-danger-200 bg-kds-overdue-bg text-danger-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Chênh lệch so với kỳ vọng:</span>
                <strong className="ops-nums text-base">
                  {diff === 0
                    ? '0 ₫ (Khớp tuyệt đối 100%)'
                    : diff > 0
                    ? `Thừa +${formatVND(diff)}`
                    : `Thiếu ${formatVND(diff)}`}
                </strong>
              </div>
              {diff !== 0 ? (
                <p className="mt-1 text-xs">
                  ⚠️ Phát hiện lệch tiền mặt trong két. Quy chế kế toán bắt buộc thu ngân phải giải
                  trình rõ lý do vào ô bên dưới trước khi chốt ca.
                </p>
              ) : null}
            </div>

            {diff !== 0 || shift.discrepancyReason ? (
              <div>
                <label className="text-xs font-bold text-ink">
                  Lý do giải trình chênh lệch ({diff > 0 ? 'Tiền thừa' : 'Tiền thiếu'}) *
                </label>
                <textarea
                  rows={2}
                  disabled={shift.status === 'SETTLED'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Khách không lấy 2.000đ tiền thối, hoặc đếm nhầm cọc tiền 50k..."
                  className="mt-1.5 w-full rounded-xl border border-sand-300 bg-white p-3 text-sm text-ink outline-none focus:border-primary-500 disabled:bg-sand-100"
                />
              </div>
            ) : null}

            {errorMsg ? (
              <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-kds-overdue-bg p-3 text-xs font-bold text-danger-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            {shift.status === 'SETTLED' ? (
              <div className="flex flex-col gap-3 rounded-xl border border-sage-200 bg-sage-50 p-4">
                <div className="flex items-center gap-2 text-sage-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-700" />
                  <div>
                    <p className="text-sm font-bold">Ca làm việc đã được chốt sổ thành công</p>
                    <p className="text-xs">
                      Thời điểm chốt: {shift.settledAt ?? 'Vừa xong'} • Người duyệt: Quản trị hệ thống
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onReopenShiftDemo}
                  className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 text-xs font-bold text-ink transition-colors hover:bg-sand-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Mở lại ca làm việc (Demo Mode)</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-all hover:bg-primary-600 active:scale-[0.99]"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Xác nhận &amp; Chốt ca thu ngân (Kết ca)</span>
              </button>
            )}
          </form>
        </div>

        {/* Cột phải: Báo cáo doanh số các phương thức thanh toán khác */}
        <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-5">
          <div className="border-b border-sand-200 pb-4">
            <h2 className="text-lg font-bold text-ink">Tổng hợp Doanh số Toàn ca</h2>
            <p className="text-xs text-muted">
              Bao gồm tất cả các cổng thanh toán đã thanh toán qua POS
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-sand-200 bg-sand-50/60 p-3.5">
              <div>
                <p className="text-xs font-bold text-ink">Tiền mặt (Cash)</p>
                <p className="text-xs text-muted">Đã đối soát két</p>
              </div>
              <strong className="ops-nums text-lg font-extrabold text-ink">
                {formatVND(shift.cashSales)}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-sand-200 bg-sand-50/60 p-3.5">
              <div>
                <p className="text-xs font-bold text-ink">Chuyển khoản VietQR</p>
                <p className="text-xs text-muted">Tự động đối soát qua Webhook</p>
              </div>
              <strong className="ops-nums text-lg font-extrabold text-ink">
                {formatVND(shift.bankTransferSales)}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-sand-200 bg-sand-50/60 p-3.5">
              <div>
                <p className="text-xs font-bold text-ink">Quẹt thẻ POS (Card)</p>
                <p className="text-xs text-muted">Máy quẹt thẻ ngân hàng</p>
              </div>
              <strong className="ops-nums text-lg font-extrabold text-ink">
                {formatVND(shift.cardSales)}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-sand-200 bg-sand-50/60 p-3.5">
              <div>
                <p className="text-xs font-bold text-ink">Ví điện tử (Momo / ZaloPay)</p>
                <p className="text-xs text-muted">Đối soát cổng trung gian</p>
              </div>
              <strong className="ops-nums text-lg font-extrabold text-ink">
                {formatVND(shift.eWalletSales)}
              </strong>
            </div>

            <div className="my-1 border-t border-sand-200" />

            <div className="flex items-center justify-between rounded-xl bg-ink p-4 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sand-300">
                  Tổng Doanh Thu Ca
                </p>
                <p className="text-xs text-sand-400">
                  {shift.totalOrdersSettled} hóa đơn đã đóng
                </p>
              </div>
              <span className="ops-nums text-2xl font-black text-honey-500">
                {formatVND(shift.totalRevenue)}
              </span>
            </div>
          </div>

          <div className="mt-3 border-t border-sand-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Ghi chú kết ca từ quản lý
            </h3>
            <div className="mt-2.5 flex flex-col gap-2">
              {shift.notes.map((n, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg bg-sand-100 p-2.5 text-xs text-ink"
                >
                  <span className="font-bold text-primary-500">•</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-sand-200 bg-sand-100 p-4 text-xs text-muted">
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
export default ShiftSettlementView;
