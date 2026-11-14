'use client';

import * as React from 'react';
import {
  CheckCircle2,
  CreditCard,
  GitMerge,
  Lock,
  LockOpen,
  Printer,
  Sparkles,
  Tag,
  UserCheck,
  X,
} from 'lucide-react';
import {
  PRESET_DISCOUNTS,
  computeTablePayable,
  computeTableSubtotal,
  usePosStore,
} from '@/stores/usePosStore';
import { CashierTableArea, CashierTableStatus } from '@/types';
import { CashierHomeView } from '@/components/pos/CashierHomeView';
import { ReservationView } from '@/components/pos/ReservationModal';
import { SplitMergeModal } from '@/components/pos/SplitMergeModal';
import { SettlementSheet } from '@/components/pos/SettlementSheet';
import { ShiftSettlementView } from '@/components/pos/ShiftSettlementModal';
import { formatVND } from '@/lib/utils';

type CashierNavTab = 'home' | 'pos' | 'reservation' | 'shift';

const STATUS_CONFIG: Record<
  CashierTableStatus,
  { label: string; dot: string; bgTint: string; badgeClass: string }
> = {
  IDLE: {
    label: 'Bàn trống',
    dot: 'bg-table-empty',
    bgTint: 'bg-ops-tint-empty',
    badgeClass: 'bg-sage-100 text-sage-700 border-sage-200',
  },
  RESERVED: {
    label: 'Đã đặt trước',
    dot: 'bg-honey-500',
    bgTint: 'bg-ops-tint-inuse',
    badgeClass: 'bg-honey-500/20 text-brown-900 border-honey-500/40',
  },
  OCCUPIED: {
    label: 'Đang phục vụ',
    dot: 'bg-table-inuse',
    bgTint: 'bg-white',
    badgeClass: 'bg-cream text-brown-800 border-sand-300',
  },
  LOCKED: {
    label: 'Đang khóa bill',
    dot: 'bg-primary-500',
    bgTint: 'bg-primary-50/50',
    badgeClass: 'bg-primary-100 text-primary-600 border-primary-200',
  },
  OVERDUE: {
    label: 'Quá SLA',
    dot: 'bg-danger-500',
    bgTint: 'bg-ops-tint-overdue',
    badgeClass: 'bg-kds-overdue-bg text-danger-600 border-danger-200',
  },
  CLEANING: {
    label: 'Cần dọn bàn',
    dot: 'bg-table-cleaning',
    bgTint: 'bg-ops-tint-cleaning',
    badgeClass: 'bg-sand-200 text-brown-700 border-sand-300',
  },
};

export default function PosCashierPage() {
  const {
    tables,
    reservations,
    shift,
    currentAttendance,
    attendanceLogs,
    selectedTableId,
    isCashDrawerOpen,
    lastActionToast,
    lastPrintedReceipt,
    selectTable,
    clearToast,
    syncRealtimeClockSeed,
    initializeWebSocket,
    createReservation,
    checkInReservation,
    cancelReservation,
    mergeTables,
    splitInvoiceEqual,
    splitInvoiceByItems,
    markSplitPartPaid,
    clearSplitInvoice,
    lockTableForSettlement,
    unlockTableState,
    applyDiscountRule,
    triggerCashDrawerOpening,
    toggleCashDrawer,
    printReceiptEscPos,
    processCounterSettlement,
    markTableCleanDone,
    recordInternalPayout,
    settleShiftAndBalance,
    reopenShiftDemo,
    clockInAttendance,
    toggleBreakAttendance,
    clockOutAttendance,
  } = usePosStore();

  const [activeTab, setActiveTab] = React.useState<CashierNavTab>('home');
  const [reservationSubTab, setReservationSubTab] = React.useState<'create' | 'checkin'>('create');
  const [shiftSubTab, setShiftSubTab] = React.useState<'settlement' | 'attendance'>('settlement');
  const [areaFilter, setAreaFilter] = React.useState<'ALL' | CashierTableArea>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | CashierTableStatus>('ALL');
  const [splitMergeOpen, setSplitMergeOpen] = React.useState(false);
  const [settlementOpen, setSettlementOpen] = React.useState(false);

  React.useEffect(() => {
    syncRealtimeClockSeed();
    initializeWebSocket();
  }, [syncRealtimeClockSeed, initializeWebSocket]);

  React.useEffect(() => {
    if (!lastActionToast) return;
    const timer = setTimeout(() => clearToast(), 4500);
    return () => clearTimeout(timer);
  }, [lastActionToast, clearToast]);

  const selectedTable =
    tables.find((t) => t.id === selectedTableId) ?? tables[0];

  const filteredTables = tables.filter((t) => {
    if (areaFilter !== 'ALL' && t.area !== areaFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    return true;
  });

  const handleOpenSettlement = (tableId: string) => {
    selectTable(tableId);
    // UC4 <<include>> Lock Table State tự động khi mở màn quyết toán
    lockTableForSettlement(tableId);
    setSettlementOpen(true);
  };

  const selectedSubtotal = selectedTable ? computeTableSubtotal(selectedTable) : 0;
  const selectedVat = Math.round(selectedSubtotal * 0.08);
  const selectedPayable = selectedTable ? computeTablePayable(selectedTable) : 0;
  const linkedReservation = reservations.find(
    (r) => r.id === selectedTable?.reservationId && r.status === 'CONFIRMED'
  );

  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      {/* NỘI DUNG THEO TAB */}
      {activeTab === 'home' ? (
        <CashierHomeView
          tables={tables}
          reservations={reservations}
          shift={shift}
          currentAttendance={currentAttendance}
          isCashDrawerOpen={isCashDrawerOpen}
          onEnterPos={(tableId) => {
            if (tableId) selectTable(tableId);
            setActiveTab('pos');
          }}
          onOpenNewReservation={() => {
            setReservationSubTab('create');
            setActiveTab('reservation');
          }}
          onOpenCheckInList={() => {
            setReservationSubTab('checkin');
            setActiveTab('reservation');
          }}
          onOpenSplitMerge={(tableId) => {
            selectTable(tableId);
            setActiveTab('pos');
            setSplitMergeOpen(true);
          }}
          onOpenShiftSettlement={() => {
            setShiftSubTab('settlement');
            setActiveTab('shift');
          }}
          onOpenAttendance={() => {
            setShiftSubTab('attendance');
            setActiveTab('shift');
          }}
          onTriggerCashDrawer={() =>
            toggleCashDrawer('Mở két tiền từ màn hình Trang chủ Thu ngân')
          }
        />
      ) : null}

      {activeTab === 'pos' ? (
        <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 pb-24 md:px-8 md:pb-8 lg:grid-cols-12">
          {/* CỘT TRÁI (7 cols): Sơ đồ bàn + Lọc khu vực & Trạng thái */}
          <section className="flex flex-col gap-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white p-5 shadow-warm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Sơ đồ bàn trực quan • Realtime STOMP
                </p>
                <h1 className="mt-0.5 text-2xl font-extrabold text-ink">
                  Quầy Thu Ngân &amp; Điều Phối Bàn
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReservationSubTab('create');
                    setActiveTab('reservation');
                  }}
                  className="min-h-11 cursor-pointer rounded-xl border border-sand-300 bg-cream px-3.5 text-xs font-bold text-ink hover:bg-cream-dark"
                >
                  + Tạo Đặt Bàn / Thu Cọc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReservationSubTab('checkin');
                    setActiveTab('reservation');
                  }}
                  className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-3.5 text-xs font-bold text-white shadow-warm-sm hover:bg-primary-600"
                >
                  Check-in Bàn Đặt (
                  {reservations.filter((r) => r.status === 'CONFIRMED').length})
                </button>
              </div>
            </div>

            {/* Bộ lọc khu vực & trạng thái */}
            <div className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-white p-4 shadow-warm">
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'Sảnh Tầng 1', 'Tầng 2 VIP', 'Sân vườn'] as const).map(
                  (area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setAreaFilter(area)}
                      className={`min-h-10 cursor-pointer rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                        areaFilter === area
                          ? 'border-ink bg-ink text-white'
                          : 'border-sand-200 bg-cream/60 text-ink hover:bg-cream-dark'
                      }`}
                    >
                      {area === 'ALL' ? 'Tất cả khu vực' : area}
                    </button>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 border-t border-sand-100 pt-2.5">
                {(
                  [
                    { id: 'ALL', label: `Tất cả (${tables.length})` },
                    { id: 'OVERDUE', label: 'Quá SLA' },
                    { id: 'OCCUPIED', label: 'Đang phục vụ' },
                    { id: 'RESERVED', label: 'Đã đặt trước' },
                    { id: 'LOCKED', label: 'Đang khóa bill' },
                    { id: 'IDLE', label: 'Bàn trống' },
                    { id: 'CLEANING', label: 'Cần dọn' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`min-h-9 cursor-pointer rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                      statusFilter === st.id
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-sand-200 bg-white text-muted hover:text-ink'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lưới thẻ bàn */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              {filteredTables.map((t) => {
                const cfg = STATUS_CONFIG[t.status];
                const isSelected = t.id === selectedTable?.id;
                const payable = computeTablePayable(t);

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTable(t.id)}
                    className={`flex min-h-36 cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                      cfg.bgTint
                    } ${
                      isSelected
                        ? 'border-2 border-primary-500 shadow-warm-lg ring-2 ring-primary-200'
                        : 'border-sand-200 shadow-warm hover:border-sand-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="ops-nums text-lg font-extrabold text-ink">
                          {t.label}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {t.area} • {t.seats} ghế
                      </p>
                    </div>

                    <div className="mt-3 border-t border-sand-200/80 pt-2.5">
                      {t.status === 'RESERVED' ? (
                        <div className="text-xs">
                          <p className="font-bold text-brown-900">
                            Cọc: {formatVND(t.depositAmount)}
                          </p>
                          <p className="text-[11px] text-muted">Chờ khách Check-in</p>
                        </div>
                      ) : t.items.length > 0 ? (
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted">
                            {t.items.length} món • {t.seatedMin}p
                          </span>
                          <span className="ops-nums text-sm font-extrabold text-primary-500">
                            {formatVND(payable)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">
                          {t.status === 'CLEANING' ? 'Đang dọn bàn...' : 'Sẵn sàng đón khách'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* CỘT PHẢI (5 cols): Chi tiết Hóa đơn Bàn & Toàn bộ Thao tác Use Case */}
          <aside className="flex flex-col gap-4 lg:col-span-5">
            {selectedTable ? (
              <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm">
                {/* Tiêu đề bàn */}
                <div className="flex items-start justify-between border-b border-sand-200 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Chi tiết Hóa đơn &amp; Tác nghiệp
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-ink">
                      {selectedTable.label} ({selectedTable.area})
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Sức chứa {selectedTable.seats} ghế • Đang ngồi:{' '}
                      <strong>{selectedTable.guests} khách</strong> • Phục vụ:{' '}
                      <strong>{selectedTable.staff || '—'}</strong>
                    </p>
                  </div>
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      STATUS_CONFIG[selectedTable.status].badgeClass
                    }`}
                  >
                    {STATUS_CONFIG[selectedTable.status].label}
                  </span>
                </div>

                {/* Nếu là bàn ĐÃ ĐẶT TRƯỚC (UC2: Check-in Reserved Table) */}
                {selectedTable.status === 'RESERVED' && linkedReservation ? (
                  <div className="rounded-xl border border-honey-500/40 bg-ops-tint-inuse p-4">
                    <p className="text-xs font-bold uppercase text-brown-800">
                      Thông tin Khách đặt bàn trước
                    </p>
                    <p className="mt-1 text-base font-extrabold text-ink">
                      {linkedReservation.customerName} • {linkedReservation.phone}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Giờ hẹn: <strong>{linkedReservation.reservedTime}</strong> • Tiền cọc đã
                      thu:{' '}
                      <strong className="ops-nums text-primary-500">
                        {formatVND(linkedReservation.depositAmount)}
                      </strong>
                    </p>
                    {linkedReservation.note ? (
                      <p className="mt-1.5 text-xs italic text-ink">
                        📌 {linkedReservation.note}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => checkInReservation(linkedReservation.id)}
                      className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white shadow-warm hover:bg-primary-600"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Check-in Nhận Bàn &amp; Mở Hóa Đơn</span>
                    </button>
                  </div>
                ) : null}

                {/* Nếu bàn cần dọn */}
                {selectedTable.status === 'CLEANING' ? (
                  <div className="rounded-xl border border-sand-200 bg-cream p-4 text-center">
                    <p className="text-sm font-bold text-ink">
                      Bàn vừa thanh toán xong — đang chờ nhân viên dọn bàn
                    </p>
                    <button
                      type="button"
                      onClick={() => markTableCleanDone(selectedTable.id)}
                      className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-sage-700 px-5 text-xs font-bold text-white"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Xác nhận Đã dọn xong &rarr; Mở bàn trống</span>
                    </button>
                  </div>
                ) : null}

                {/* Danh sách món đã gọi */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                      Danh sách món trong hóa đơn ({selectedTable.items.length})
                    </h3>
                    {selectedTable.status === 'LOCKED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Đã khóa bàn</span>
                      </span>
                    ) : null}
                  </div>

                  {selectedTable.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-sand-300 bg-cream/40 p-6 text-center text-xs text-muted">
                      Bàn này hiện chưa có món gọi.
                    </div>
                  ) : (
                    <ul className="divide-y divide-sand-200/80 rounded-xl border border-sand-200 bg-cream/30 px-4">
                      {selectedTable.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-baseline justify-between gap-2 py-3 text-sm"
                        >
                          <div>
                            <span className="font-bold text-ink">{item.name}</span>
                            <span className="ops-nums ml-1.5 text-xs font-semibold text-muted">
                              ×{item.qty}
                            </span>
                            {item.note ? (
                              <p className="text-xs font-medium text-danger-600">
                                Ghi chú: {item.note}
                              </p>
                            ) : null}
                          </div>
                          <span className="ops-nums shrink-0 font-bold text-ink">
                            {formatVND(item.qty * item.unitPrice)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Khối tính tiền số nguyên VND */}
                {selectedTable.items.length > 0 ? (
                  <div className="space-y-2 rounded-xl border border-sand-200 bg-cream p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Tạm tính:</span>
                      <span className="ops-nums font-bold text-ink">
                        {formatVND(selectedSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Thuế VAT (8%):</span>
                      <span className="ops-nums font-bold text-ink">
                        +{formatVND(selectedVat)}
                      </span>
                    </div>
                    {selectedTable.discountAmount > 0 ? (
                      <div className="flex justify-between text-sage-700">
                        <span>Chiết khấu ({selectedTable.discountLabel}):</span>
                        <span className="ops-nums font-bold">
                          -{formatVND(selectedTable.discountAmount)}
                        </span>
                      </div>
                    ) : null}
                    {selectedTable.depositAmount > 0 ? (
                      <div className="flex justify-between text-primary-600">
                        <span>Trừ tiền cọc đặt bàn:</span>
                        <span className="ops-nums font-bold">
                          -{formatVND(selectedTable.depositAmount)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-baseline justify-between border-t border-sand-300 pt-2.5">
                      <span className="font-extrabold text-ink">KHÁCH CẦN TRẢ:</span>
                      <span className="ops-nums text-2xl font-extrabold text-primary-500">
                        {formatVND(selectedPayable)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Các nút chức năng theo đúng Use Case Diagram */}
                {selectedTable.items.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {/* Hàng nút phụ: Tách/Gộp hóa đơn + Khóa bàn + In tạm tính */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitMergeOpen(true)}
                        className="flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                      >
                        <GitMerge className="h-4 w-4 text-primary-500" />
                        <span>Tách / Gộp Hóa đơn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          selectedTable.status === 'LOCKED'
                            ? unlockTableState(selectedTable.id)
                            : lockTableForSettlement(selectedTable.id)
                        }
                        className="flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                      >
                        {selectedTable.status === 'LOCKED' ? (
                          <>
                            <LockOpen className="h-4 w-4 text-sage-700" />
                            <span>Mở khóa bàn</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 text-primary-500" />
                            <span>Khóa bàn (Lock)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          applyDiscountRule(
                            selectedTable.id,
                            selectedTable.discountAmount > 0
                              ? PRESET_DISCOUNTS[0]
                              : PRESET_DISCOUNTS[1]
                          )
                        }
                        className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                      >
                        <Tag className="h-3.5 w-3.5 text-primary-500" />
                        <span>
                          {selectedTable.discountAmount > 0
                            ? 'Gỡ giảm giá'
                            : 'Giảm giá VIP (-10%)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          printReceiptEscPos(selectedTable.id, 'CASH', selectedPayable)
                        }
                        className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                      >
                        <Printer className="h-3.5 w-3.5 text-primary-500" />
                        <span>In phiếu ESC/POS</span>
                      </button>
                    </div>

                    {/* Nút chính màu đỏ rượu #8C1D2C chuẩn B2-home.png */}
                    <button
                      type="button"
                      onClick={() => handleOpenSettlement(selectedTable.id)}
                      className="mt-1 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-base font-bold text-white shadow-warm transition-all hover:bg-primary-600 active:scale-[0.99]"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Thanh toán &amp; Quyết toán ({formatVND(selectedPayable)})</span>
                    </button>
                  </div>
                ) : null}

                {/* Bản xem nhanh phiếu in ESC/POS vừa xuất */}
                {lastPrintedReceipt ? (
                  <div className="rounded-xl border border-dashed border-sand-400 bg-cream/70 p-3.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>🖨️ Phiếu in nhiệt ESC/POS gần nhất:</span>
                      <span className="font-mono text-[11px] text-primary-600">
                        {lastPrintedReceipt.receiptNo}
                      </span>
                    </div>
                    <p className="mt-1 text-muted">
                      {lastPrintedReceipt.tableLabel} • Tổng thu:{' '}
                      <strong className="ops-nums text-ink">
                        {formatVND(lastPrintedReceipt.totalPaid)}
                      </strong>{' '}
                      • Lúc {lastPrintedReceipt.printedAt}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </main>
      ) : null}

      {activeTab === 'reservation' ? (
        <ReservationView
          tables={tables}
          reservations={reservations}
          initialTab={reservationSubTab}
          onCreateReservation={createReservation}
          onCheckInReservation={(resId) => {
            checkInReservation(resId);
            setActiveTab('pos');
          }}
          onCancelReservation={cancelReservation}
        />
      ) : null}

      {activeTab === 'shift' ? (
        <ShiftSettlementView
          shift={shift}
          currentAttendance={currentAttendance}
          attendanceLogs={attendanceLogs}
          initialTab={shiftSubTab}
          isCashDrawerOpen={isCashDrawerOpen}
          onSettleShift={settleShiftAndBalance}
          onRecordPayout={recordInternalPayout}
          onReopenShiftDemo={reopenShiftDemo}
          onTriggerCashDrawer={(reason) => toggleCashDrawer(reason)}
          onClockIn={clockInAttendance}
          onToggleBreak={toggleBreakAttendance}
          onClockOut={clockOutAttendance}
        />
      ) : null}

      {/* Modal Tách / Gộp Hóa đơn (UC3) */}
      {selectedTable ? (
        <SplitMergeModal
          open={splitMergeOpen}
          onClose={() => setSplitMergeOpen(false)}
          sourceTable={selectedTable}
          allTables={tables}
          onSplitEqual={splitInvoiceEqual}
          onSplitByItems={splitInvoiceByItems}
          onMarkSplitPaid={markSplitPartPaid}
          onClearSplit={clearSplitInvoice}
          onMergeTables={mergeTables}
        />
      ) : null}

      {/* Modal Quyết toán & Thanh toán tại quầy (UC4) */}
      {selectedTable ? (
        <SettlementSheet
          open={settlementOpen}
          onClose={() => setSettlementOpen(false)}
          table={selectedTable}
          onLockTable={lockTableForSettlement}
          onUnlockTable={unlockTableState}
          onApplyDiscount={applyDiscountRule}
          onPrintEscPos={printReceiptEscPos}
          onTriggerCashDrawer={triggerCashDrawerOpening}
          onConfirmSettlement={processCounterSettlement}
        />
      ) : null}

      {/* Toast thông báo phản hồi tức thì */}
      {lastActionToast ? (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white shadow-warm-lg md:bottom-6"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sage-500" />
            <span>{lastActionToast}</span>
          </div>
          <button
            type="button"
            onClick={clearToast}
            className="cursor-pointer rounded p-1 text-sand-300 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
