'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  CreditCard,
  GitMerge,
  LockOpen,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { CashierTable, ShiftSettlementRecord, TableReservation } from '@/types';
import { computeTablePayable, computeTableSubtotal } from '@/stores/usePosStore';
import {
  formatTimeHHMMSS,
  formatVND,
  formatVietnameseFullDate,
} from '@/lib/utils';

interface CashierHomeViewProps {
  tables: CashierTable[];
  reservations: TableReservation[];
  shift: ShiftSettlementRecord;
  onEnterPos: (tableId?: string) => void;
  onOpenNewReservation: () => void;
  onOpenCheckInList: () => void;
  onOpenSplitMerge: (tableId: string) => void;
  onOpenShiftSettlement: () => void;
  onTriggerCashDrawer: () => void;
}

export function CashierHomeView({
  tables,
  reservations,
  shift,
  onEnterPos,
  onOpenNewReservation,
  onOpenCheckInList,
  onOpenSplitMerge,
  onOpenShiftSettlement,
  onTriggerCashDrawer,
}: CashierHomeViewProps) {
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTables = tables.filter(
    (t) => t.status === 'OCCUPIED' || t.status === 'OVERDUE' || t.status === 'LOCKED'
  );
  const overdueTables = tables.filter((t) => t.status === 'OVERDUE');
  const confirmedReservations = reservations.filter((r) => r.status === 'CONFIRMED');
  const totalUnpaidItems = activeTables.reduce(
    (sum, t) => sum + t.items.reduce((acc, i) => acc + i.qty, 0),
    0
  );

  const expectedCash =
    shift.openingCash +
    shift.cashSales +
    shift.depositCashCollected -
    shift.cashRefundsOrPayouts;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 pb-24 md:px-6 md:pb-8">
      {/* Header chào mừng chuẩn B2-home.png + Thời gian thực */}
      <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Xin chào, Thu ngân
          </h1>
          <p className="ops-nums mt-1 text-sm font-medium text-muted" suppressHydrationWarning>
            {formatVietnameseFullDate(now)} • {formatTimeHHMMSS(now)}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-sand-200 bg-white px-3.5 py-1.5 text-xs font-bold text-ink shadow-warm-sm">
            <span>Nhân viên vận hành</span>
            <span className="text-sand-400">•</span>
            <span className="text-primary-500">{shift.cashierName}</span>
          </div>
        </div>

        {/* Nút thao tác nhanh mở két & tạo đặt bàn */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTriggerCashDrawer}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-warm-sm transition-colors hover:bg-cream-dark"
          >
            <LockOpen className="h-4 w-4 text-primary-500" />
            <span>Mở két tiền</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewReservation}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-warm transition-colors hover:bg-primary-600"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>+ Đặt bàn mới</span>
          </button>
        </div>
      </section>

      {/* Lưới 2 cột trên màn hình rộng, 1 cột chuẩn B2-home trên mobile */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* THẺ 1: CA HÔM NAY (Giống hệt B2-home.png) */}
        <div className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-white p-6 shadow-warm">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-ink">Ca hôm nay</h2>
                <p className="mt-0.5 text-sm text-muted">{shift.shiftName}</p>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  shift.status === 'OPEN'
                    ? 'bg-sage-100 text-sage-700'
                    : 'bg-sand-200 text-brown-700'
                }`}
              >
                {shift.status === 'OPEN' ? 'Đang mở ca' : 'Đã chốt ca'}
              </span>
            </div>

            <div className="my-4 border-t border-sand-200/80" />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Giờ ca</span>
                <span className="ops-nums font-bold text-ink">
                  {shift.startTime} – {shift.endTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Khu vực</span>
                <span className="font-bold text-ink">{shift.area}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Ca tiếp theo</span>
                <span className="ops-nums font-medium text-muted">{shift.nextShift}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-sand-200 pt-2.5">
                <span className="text-muted">Tiền mặt dự kiến trong két</span>
                <span className="ops-nums font-bold text-primary-500">
                  {formatVND(expectedCash)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-sand-100 pt-4">
            <div className="flex items-center gap-2 text-sm font-bold text-primary-500">
              <Check className="h-4 w-4 stroke-[2.5] text-sage-700" />
              <span>Đã vào ca lúc {shift.checkedInAt}</span>
            </div>
            <button
              type="button"
              onClick={onOpenShiftSettlement}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-sand-300 bg-cream px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-cream-dark"
            >
              <Wallet className="h-3.5 w-3.5 text-primary-500" />
              <span>Đối soát & Kết ca</span>
            </button>
          </div>
        </div>

        {/* THẺ 2: THU NGÂN — POS (Hàng đợi lúc này — Giống hệt thẻ Bếp KDS ở B2-home.png) */}
        <div className="flex flex-col justify-between rounded-2xl border border-sand-200 bg-white p-6 shadow-warm">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-ink">Thu ngân — POS</h2>
                <p className="mt-0.5 text-sm text-muted">Hàng đợi lúc này</p>
              </div>
              <span className="ops-nums rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-500">
                {confirmedReservations.length} bàn đặt trước
              </span>
            </div>

            <div className="my-4 border-t border-dashed border-sand-200" />

            <div className="grid grid-cols-3 gap-2 py-2 text-center">
              <div className="flex flex-col items-center">
                <span className="ops-nums text-3xl font-extrabold text-ink">
                  {activeTables.length}
                </span>
                <span className="mt-1 text-xs font-medium text-muted">Bàn đang mở</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="ops-nums text-3xl font-extrabold text-danger-500">
                  {overdueTables.length}
                </span>
                <span className="mt-1 text-xs font-bold text-ink">Quá SLA</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="ops-nums text-3xl font-extrabold text-ink">
                  {totalUnpaidItems}
                </span>
                <span className="mt-1 text-xs font-medium text-muted">Món trên bill</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onEnterPos()}
              className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-all hover:bg-primary-600 active:scale-[0.99]"
            >
              <span>Vào quầy thu ngân</span>
            </button>
          </div>
        </div>
      </div>

      {/* DẢI CHỨC NĂNG USE CASE THU NGÂN (5 Use Cases từ image.png) */}
      <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-warm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">
             Nghiệp vụ Thu ngân (Cashier Use Cases)
          </h2>
          <span className="text-xs font-medium text-muted">
            Bấm để thao tác trực tiếp
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <button
            type="button"
            onClick={onOpenNewReservation}
            className="flex min-h-20 cursor-pointer flex-col items-start justify-between rounded-xl border border-sand-200 bg-cream/60 p-3.5 text-left transition-all hover:border-primary-400 hover:bg-white hover:shadow-warm-sm"
          >
            <CalendarPlus className="h-5 w-5 text-primary-500" />
            <div className="mt-2">
              <p className="text-xs font-bold text-ink">Tạo đặt bàn & Cọc</p>
              <p className="text-xs text-muted">Check trống + Thu cọc</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCheckInList}
            className="flex min-h-20 cursor-pointer flex-col items-start justify-between rounded-xl border border-sand-200 bg-cream/60 p-3.5 text-left transition-all hover:border-primary-400 hover:bg-white hover:shadow-warm-sm"
          >
            <UserCheck className="h-5 w-5 text-sage-700" />
            <div className="mt-2">
              <p className="text-xs font-bold text-ink">
                Check-in Bàn đặt ({confirmedReservations.length})
              </p>
              <p className="text-xs text-muted">Nhận bàn & Khấu trừ cọc</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenSplitMerge('t4')}
            className="flex min-h-20 cursor-pointer flex-col items-start justify-between rounded-xl border border-sand-200 bg-cream/60 p-3.5 text-left transition-all hover:border-primary-400 hover:bg-white hover:shadow-warm-sm"
          >
            <GitMerge className="h-5 w-5 text-honey-500" />
            <div className="mt-2">
              <p className="text-xs font-bold text-ink">Tách / Gộp Hóa đơn</p>
              <p className="text-xs text-muted">Chia đều / Theo món / Gộp</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onEnterPos('t4')}
            className="flex min-h-20 cursor-pointer flex-col items-start justify-between rounded-xl border border-sand-200 bg-cream/60 p-3.5 text-left transition-all hover:border-primary-400 hover:bg-white hover:shadow-warm-sm"
          >
            <CreditCard className="h-5 w-5 text-primary-500" />
            <div className="mt-2">
              <p className="text-xs font-bold text-ink">Thanh toán & In</p>
              <p className="text-xs text-muted">Khóa bàn • Giảm giá • ESC/POS</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenShiftSettlement}
            className="col-span-2 flex min-h-20 cursor-pointer flex-col items-start justify-between rounded-xl border border-sand-200 bg-cream/60 p-3.5 text-left transition-all hover:border-primary-400 hover:bg-white hover:shadow-warm-sm sm:col-span-1"
          >
            <Wallet className="h-5 w-5 text-brown-700" />
            <div className="mt-2">
              <p className="text-xs font-bold text-ink">Đối soát & Kết ca</p>
              <p className="text-xs text-muted">Kiểm tiền mặt & Chốt ca</p>
            </div>
          </button>
        </div>
      </section>

      {/* THẺ 3: CẢNH BÁO CẦN CHÚ Ý (Giống hệt B2-home.png) */}
      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-warm">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger-500" />
          <h2 className="text-lg font-bold text-ink">Cảnh báo cần chú ý</h2>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {overdueTables.length} bàn chờ quyết toán quá SLA và {confirmedReservations.length} lịch
          đặt bàn sắp đến giờ check-in — xem rõ từng bàn, bấm để sang đúng ngữ cảnh ở Thu ngân POS.
        </p>

        <div className="mt-4 divide-y divide-sand-200/80">
          {tables
            .filter((t) => t.status === 'OVERDUE' || t.status === 'OCCUPIED')
            .map((table) => {
              const summaryText = table.items
                .slice(0, 2)
                .map((it) => `${it.name} ×${it.qty}`)
                .join(', ');
              const payable = computeTablePayable(table);
              const subtotal = computeTableSubtotal(table);
              const isOverdue = table.status === 'OVERDUE';

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onEnterPos(table.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-cream/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-ink">
                      {table.label} • {summaryText || 'Đang phục vụ'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Ngồi {table.seatedMin} phút • Tạm tính: {formatVND(subtotal)} • Cần thu:{' '}
                      <strong className="ops-nums text-ink">{formatVND(payable)}</strong>
                      {table.depositAmount > 0
                        ? ` (Đã trừ cọc ${formatVND(table.depositAmount)})`
                        : ''}
                    </p>
                    {table.allergyAlert ? (
                      <p className="mt-1 text-xs font-semibold text-danger-600">
                        ⚠️ {table.allergyAlert}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      isOverdue
                        ? 'border-danger-200 bg-kds-overdue-bg text-danger-600'
                        : 'border-sand-200 bg-cream text-brown-700'
                    }`}
                  >
                    {isOverdue ? 'Quá SLA' : 'Chờ thu'}
                  </span>
                </button>
              );
            })}

          {confirmedReservations.map((res) => (
            <button
              key={res.id}
              type="button"
              onClick={onOpenCheckInList}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-cream/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-ink">
                  {res.tableLabel} • Khách đặt: {res.customerName} ({res.partySize} khách)
                </p>
                <p className="mt-1 text-xs text-muted">
                  Giờ hẹn: <strong className="ops-nums text-ink">{res.reservedTime}</strong> • SĐT:{' '}
                  {res.phone} • Tiền cọc:{' '}
                  <strong className="ops-nums text-sage-700">{formatVND(res.depositAmount)}</strong>
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-sage-200 bg-sage-100 px-3 py-1.5 text-xs font-bold text-sage-700">
                Chờ Check-in
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
