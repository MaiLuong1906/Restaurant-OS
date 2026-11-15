'use client';

import * as React from 'react';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  LockOpen,
  Printer,
  QrCode,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import { CashierTable, DiscountRule, PaymentMethodType } from '@/types';
import {
  PRESET_DISCOUNTS,
  computeTablePayable,
  computeTableSubtotal,
} from '@/stores/usePosStore';
import { formatVND } from '@/lib/utils';

interface SettlementSheetProps {
  open: boolean;
  onClose: () => void;
  table: CashierTable;
  onLockTable: (tableId: string) => void;
  onUnlockTable: (tableId: string) => void;
  onApplyDiscount: (tableId: string, rule: DiscountRule) => void;
  onPrintEscPos: (tableId: string, method: PaymentMethodType, cashReceived?: number) => void;
  onTriggerCashDrawer: (reason: string) => void;
  onConfirmSettlement: (params: {
    tableId: string;
    method: PaymentMethodType;
    cashReceived: number;
    printEscPos: boolean;
    openCashDrawer: boolean;
  }) => void;
}

export function SettlementSheet({
  open,
  onClose,
  table,
  onLockTable,
  onUnlockTable,
  onApplyDiscount,
  onPrintEscPos,
  onTriggerCashDrawer,
  onConfirmSettlement,
}: SettlementSheetProps) {
  const [method, setMethod] = React.useState<PaymentMethodType>('CASH');
  const [cashInput, setCashInput] = React.useState<string>('');
  const [autoPrintEscPos, setAutoPrintEscPos] = React.useState(true);
  const [autoOpenDrawer, setAutoOpenDrawer] = React.useState(true);
  const [showReceiptPreview, setShowReceiptPreview] = React.useState(false);

  const subtotal = computeTableSubtotal(table);
  const vat = Math.round(subtotal * 0.08);
  const payable = computeTablePayable(table);

  React.useEffect(() => {
    if (open) {
      setCashInput(String(payable));
    }
  }, [open, payable]);

  if (!open) return null;

  const cashReceivedNum = Math.max(0, Math.round(Number(cashInput.replace(/[^0-9]/g, '')) || 0));
  const changeAmount = cashReceivedNum - payable;

  const quickCashNotes = [
    payable,
    Math.ceil(payable / 100000) * 100000,
    Math.ceil(payable / 500000) * 500000,
    1000000,
  ].filter((v, idx, arr) => v >= payable && arr.indexOf(v) === idx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-warm-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sand-200 bg-cream px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Use Case • Process Counter Settlement &amp; Payment
            </p>
            <h2 className="text-xl font-extrabold text-ink">
              Quyết Toán &amp; Thanh Toán Tại Quầy — {table.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-sand-300 bg-white text-ink hover:bg-cream-dark"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body 2 cột */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-12">
          {/* Cột trái: Lock Table State + Apply Discount + Phương thức thanh toán */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            {/* <<include>> Lock Table State */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                table.status === 'LOCKED'
                  ? 'border-primary-300 bg-primary-50/60'
                  : 'border-sand-200 bg-cream/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {table.status === 'LOCKED' ? (
                  <Lock className="h-5 w-5 shrink-0 text-primary-500" />
                ) : (
                  <LockOpen className="h-5 w-5 shrink-0 text-muted" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">
                      Khóa trạng thái bàn (Lock Table State)
                    </span>
                    <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-600">
                      &lt;&lt;include&gt;&gt;
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {table.status === 'LOCKED'
                      ? `Đang khóa bởi ${table.lockedBy ?? 'Thu ngân'} — khách không thể thêm món khi đang chốt bill`
                      : 'Khóa bàn tạm thời để tránh khách gọi thêm món hoặc 2 thu ngân thao tác trùng'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  table.status === 'LOCKED'
                    ? onUnlockTable(table.id)
                    : onLockTable(table.id)
                }
                className={`min-h-10 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold ${
                  table.status === 'LOCKED'
                    ? 'border-sand-300 bg-white text-ink hover:bg-cream'
                    : 'border-primary-500 bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {table.status === 'LOCKED' ? 'Mở khóa bàn' : 'Khóa bàn ngay'}
              </button>
            </div>

            {/* <<extend>> Apply Discount */}
            <div className="rounded-xl border border-sand-200 bg-cream/40 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-bold text-ink">
                    Áp dụng Chiết khấu / Voucher (Apply Discount)
                  </span>
                </div>
                <span className="rounded bg-sand-200 px-2 py-0.5 text-[10px] font-bold text-brown-700">
                  &lt;&lt;extend&gt;&gt;
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_DISCOUNTS.map((rule) => {
                  const isSelected =
                    (rule.value === 0 && table.discountAmount === 0) ||
                    (rule.value > 0 && table.discountLabel === rule.label);
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => onApplyDiscount(table.id, rule)}
                      className={`min-h-10 cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-sand-300 bg-white text-ink hover:bg-cream'
                      }`}
                    >
                      {rule.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                Phương thức thanh toán tại quầy
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'CASH', label: 'Tiền mặt (VND)', icon: Wallet },
                    { id: 'VIETQR', label: 'Mã động VietQR', icon: QrCode },
                    { id: 'CARD', label: 'Thẻ Ngân hàng', icon: CreditCard },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = method === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                        active
                          ? 'border-2 border-primary-500 bg-primary-50/40 text-primary-600 shadow-warm-sm'
                          : 'border-sand-300 bg-white text-ink hover:bg-cream'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chi tiết theo phương thức */}
            {method === 'CASH' ? (
              <div className="rounded-xl border border-sand-200 bg-cream/50 p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="cash-input" className="text-xs font-bold text-ink">
                    Tiền mặt khách đưa (Số nguyên VND):
                  </label>
                  <span className="ops-nums text-xs font-bold text-primary-500">
                    Cần thu: {formatVND(payable)}
                  </span>
                </div>
                <input
                  id="cash-input"
                  type="text"
                  inputMode="numeric"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  className="ops-nums mt-2 min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-right text-lg font-extrabold text-ink outline-none focus:border-primary-500"
                />
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {quickCashNotes.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashInput(String(amt))}
                      className="ops-nums min-h-9 cursor-pointer rounded-lg border border-sand-300 bg-white px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                    >
                      {formatVND(amt)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-sand-200 pt-2.5 text-sm">
                  <span className="font-semibold text-muted">
                    {changeAmount >= 0 ? 'Tiền thừa trả khách:' : 'Khách đưa còn thiếu:'}
                  </span>
                  <span
                    className={`ops-nums text-lg font-extrabold ${
                      changeAmount >= 0 ? 'text-sage-700' : 'text-danger-600'
                    }`}
                  >
                    {formatVND(Math.abs(changeAmount))}
                  </span>
                </div>
              </div>
            ) : method === 'VIETQR' ? (
              <div className="flex items-center gap-4 rounded-xl border border-sand-200 bg-cream/50 p-4">
                <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-ink bg-white p-2 text-center">
                  <QrCode className="h-14 w-14 text-ink" />
                  <span className="text-[9px] font-bold uppercase text-muted">NAPAS 247</span>
                </div>
                <div className="text-xs">
                  <p className="text-sm font-bold text-ink">
                    Mã động VietQR — Tự động điền đúng {formatVND(payable)}
                  </p>
                  <p className="mt-1 text-muted">
                    Nội dung CK: <strong>ROS {table.label.replace(/\s+/g, '')}</strong> • Tự động
                    bắt webhook xác nhận hoặc thu ngân đối chiếu biên lai.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-sand-200 bg-cream/50 p-4 text-xs text-muted">
                <p className="text-sm font-bold text-ink">
                  Quẹt thẻ / Chạm Apple Pay &amp; Samsung Pay trên máy POS
                </p>
                <p className="mt-1">
                  Số tiền đẩy sang thiết bị POS ngân hàng:{' '}
                  <strong className="ops-nums text-ink">{formatVND(payable)}</strong>.
                </p>
              </div>
            )}

            {/* <<extend>> Print Receipt via ESC/POS & <<extend>> Trigger Cash Drawer Opening */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-xl border border-sand-200 bg-white p-3.5">
                <label className="flex cursor-pointer items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-ink">
                      In hóa đơn nhiệt ESC/POS
                    </p>
                    <p className="text-[11px] text-muted">
                      &lt;&lt;extend&gt;&gt; Khổ 80mm LAN/USB
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPrintEscPos}
                    onChange={(e) => setAutoPrintEscPos(e.target.checked)}
                    className="h-4 w-4 accent-[#8C1D2C]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptPreview((v) => !v);
                    onPrintEscPos(table.id, method, cashReceivedNum);
                  }}
                  className="mt-2.5 flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sand-300 bg-cream px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                >
                  <Printer className="h-3.5 w-3.5 text-primary-500" />
                  <span>{showReceiptPreview ? 'Ẩn mẫu phiếu in' : 'Xem & In thử ESC/POS'}</span>
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-sand-200 bg-white p-3.5">
                <label className="flex cursor-pointer items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-ink">
                      Kích hoạt mở két tiền
                    </p>
                    <p className="text-[11px] text-muted">
                      &lt;&lt;extend&gt;&gt; Trigger Cash Drawer
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoOpenDrawer}
                    onChange={(e) => setAutoOpenDrawer(e.target.checked)}
                    className="h-4 w-4 accent-[#8C1D2C]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onTriggerCashDrawer(`Mở két kiểm tiền tại bàn ${table.label}`)
                  }
                  className="mt-2.5 flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sand-300 bg-cream px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                >
                  <LockOpen className="h-3.5 w-3.5 text-primary-500" />
                  <span>Mở ngăn kéo tiền ngay</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Bản xem trước Phiếu Tính Tiền / ESC-POS 80mm */}
          <div className="flex flex-col justify-between rounded-2xl border border-sand-300 bg-cream p-5 lg:col-span-5">
            <div>
              <div className="border-b border-dashed border-sand-400 pb-3 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted">
                  PHIẾU THANH TOÁN ESC/POS (80MM)
                </p>
                <h3 className="mt-1 text-base font-extrabold text-ink">
                  RESTAURANT OS — ẨM THỰC PHỐ CỔ
                </h3>
                <p className="text-[11px] text-muted">
                  {table.area} • {table.label} • Thu ngân: Minh Anh
                </p>
              </div>

              {/* Danh sách món */}
              <div className="my-3 max-h-48 divide-y divide-dashed divide-sand-300 overflow-y-auto text-xs">
                {table.items.map((it) => (
                  <div key={it.id} className="flex items-baseline justify-between py-2">
                    <div className="pr-2">
                      <span className="font-bold text-ink">{it.name}</span>
                      <span className="ops-nums ml-1 text-muted">×{it.qty}</span>
                      {it.note ? (
                        <p className="text-[11px] italic text-primary-600">({it.note})</p>
                      ) : null}
                    </div>
                    <span className="ops-nums shrink-0 font-bold text-ink">
                      {formatVND(it.qty * it.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tổng hợp tiền tệ VND */}
              <div className="space-y-2 border-t border-dashed border-sand-400 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Tạm tính ({table.items.length} dòng):</span>
                  <span className="ops-nums font-bold text-ink">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Thuế GTGT (VAT 8%):</span>
                  <span className="ops-nums font-bold text-ink">+{formatVND(vat)}</span>
                </div>
                {table.discountAmount > 0 ? (
                  <div className="flex justify-between text-sage-700">
                    <span>Chiết khấu ({table.discountLabel ?? 'KM'}):</span>
                    <span className="ops-nums font-bold">
                      -{formatVND(table.discountAmount)}
                    </span>
                  </div>
                ) : null}
                {table.depositAmount > 0 ? (
                  <div className="flex justify-between text-primary-600">
                    <span>Khấu trừ tiền cọc đặt bàn:</span>
                    <span className="ops-nums font-bold">
                      -{formatVND(table.depositAmount)}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-baseline justify-between border-t border-sand-400 pt-2.5">
                  <span className="text-sm font-extrabold text-ink">KHÁCH CẦN THANH TOÁN:</span>
                  <span className="ops-nums text-2xl font-extrabold text-primary-500">
                    {formatVND(payable)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onConfirmSettlement({
                    tableId: table.id,
                    method,
                    cashReceived: cashReceivedNum,
                    printEscPos: autoPrintEscPos,
                    openCashDrawer: autoOpenDrawer,
                  });
                  onClose();
                }}
                className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-colors hover:bg-primary-600"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Hoàn tất Thanh toán ({formatVND(payable)})</span>
              </button>
              <p className="text-center text-[11px] text-muted">
                Giao dịch tự động sinh UUID Idempotency-Key chống trừ tiền 2 lần
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

