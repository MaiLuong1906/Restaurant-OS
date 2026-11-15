'use client';

import * as React from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Phone,
  SearchCheck,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  CashierTable,
  CashierTableArea,
  PaymentMethodType,
  TableReservation,
} from '@/types';
import {
  SSR_FALLBACK_DATE,
  formatIsoDate,
  formatIsoToShortVN,
  formatTimeHHMM,
  formatVND,
  getDateRelativeLabel,
  getUpcomingTimeSlot,
  isPastReservationDateTime,
  resolveReservationTargetDate,
} from '@/lib/utils';

interface ReservationModalProps {
  tables: CashierTable[];
  reservations: TableReservation[];
  initialTab?: 'create' | 'checkin';
  onCreateReservation: (input: {
    customerName: string;
    phone: string;
    partySize: number;
    reservedTime: string;
    reservedDate: string;
    area: CashierTableArea;
    tableId: string;
    depositAmount: number;
    depositMethod: PaymentMethodType;
    note?: string;
  }) => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
}

const AREAS: CashierTableArea[] = ['Sảnh Tầng 1', 'Tầng 2 VIP', 'Sân vườn'];
const DEPOSIT_PRESETS = [0, 200000, 300000, 500000];
const HOURS_24 = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES_STEP_5 = Array.from({ length: 12 }, (_, idx) =>
  String(idx * 5).padStart(2, '0')
);

export function ReservationView({
  tables,
  reservations,
  initialTab = 'create',
  onCreateReservation,
  onCheckInReservation,
  onCancelReservation,
}: ReservationModalProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<'create' | 'checkin'>(initialTab);

  React.useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const [now, setNow] = React.useState<Date>(SSR_FALLBACK_DATE);
  const [reservedTime, setReservedTime] = React.useState<string>(() =>
    getUpcomingTimeSlot(30, SSR_FALLBACK_DATE)
  );
  const [selectedIsoDate, setSelectedIsoDate] = React.useState<string>(() =>
    formatIsoDate(SSR_FALLBACK_DATE)
  );
  const [autoShiftNotice, setAutoShiftNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    const liveNow = new Date();
    const initialSlot = getUpcomingTimeSlot(30, liveNow);
    const initialTarget = resolveReservationTargetDate(initialSlot, liveNow);
    setNow(liveNow);
    setReservedTime(initialSlot);
    setSelectedIsoDate(initialTarget.isoDate);
    if (initialTarget.isTomorrow) {
      setAutoShiftNotice(
        `Khung giờ gần nhất (${initialSlot}) đã qua nửa đêm nên ngày nhận bàn được chuyển sang ngày mai (${initialTarget.reservedDate}).`
      );
    }
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Form states for UC1: Create Table Reservation
  const [customerName, setCustomerName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [partySize, setPartySize] = React.useState<number>(4);
  const [area, setArea] = React.useState<CashierTableArea>('Sảnh Tầng 1');

  const todayIso = React.useMemo(() => formatIsoDate(now), [now]);
  const reservedDate = React.useMemo(
    () => formatIsoToShortVN(selectedIsoDate),
    [selectedIsoDate]
  );
  const dateRelativeLabel = React.useMemo(
    () => getDateRelativeLabel(selectedIsoDate, now),
    [selectedIsoDate, now]
  );

  const handleTimeChange = (nextTime: string) => {
    const freshNow = new Date();
    const freshTodayIso = formatIsoDate(freshNow);
    setReservedTime(nextTime);

    if (
      selectedIsoDate === freshTodayIso &&
      isPastReservationDateTime(freshTodayIso, nextTime, freshNow)
    ) {
      const tomorrowTarget = resolveReservationTargetDate(nextTime, freshNow);
      setSelectedIsoDate(tomorrowTarget.isoDate);
      setAutoShiftNotice(
        `Khung giờ ${nextTime} đã qua so với giờ hiện tại (${formatTimeHHMM(
          freshNow
        )}) — ngày nhận bàn tự động chuyển sang ngày mai (${tomorrowTarget.reservedDate}).`
      );
      return;
    }

    setAutoShiftNotice(null);
  };

  const handleDateChange = (rawIso: string) => {
    if (!rawIso) return;
    const freshNow = new Date();
    const freshTodayIso = formatIsoDate(freshNow);
    const clampedIso = rawIso < freshTodayIso ? freshTodayIso : rawIso;

    if (
      clampedIso === freshTodayIso &&
      isPastReservationDateTime(freshTodayIso, reservedTime, freshNow)
    ) {
      const nextUpcoming = getUpcomingTimeSlot(15, freshNow);
      if (!isPastReservationDateTime(freshTodayIso, nextUpcoming, freshNow)) {
        setSelectedIsoDate(freshTodayIso);
        setReservedTime(nextUpcoming);
        setAutoShiftNotice(
          `Giờ ${reservedTime} đã qua trong hôm nay (${formatTimeHHMM(
            freshNow
          )}) — đã tự chỉnh sang ${nextUpcoming} hôm nay.`
        );
      } else {
        const tomorrowTarget = resolveReservationTargetDate(nextUpcoming, freshNow);
        setSelectedIsoDate(tomorrowTarget.isoDate);
        setReservedTime(nextUpcoming);
        setAutoShiftNotice(
          `Đã gần cuối ngày (${formatTimeHHMM(
            freshNow
          )}), không còn khung giờ hợp lệ trong hôm nay — giữ ngày nhận bàn sang ngày mai (${tomorrowTarget.reservedDate}).`
        );
      }
      return;
    }

    setSelectedIsoDate(clampedIso);
    setAutoShiftNotice(null);
  };

  const [selectedHourRaw, selectedMinRaw] = reservedTime.split(':');
  const selectedHour = HOURS_24.includes(selectedHourRaw) ? selectedHourRaw : '19';
  const snappedMinNum = Math.floor((Number(selectedMinRaw) || 0) / 5) * 5;
  const selectedMinute = String(snappedMinNum).padStart(2, '0');
  const [collectDeposit, setCollectDeposit] = React.useState(true);
  const [depositAmount, setDepositAmount] = React.useState<number>(200000);
  const [depositMethod, setDepositMethod] = React.useState<PaymentMethodType>('VIETQR');
  const [note, setNote] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  // <<include>> Check Table Availability
  const availableTables = React.useMemo(
    () =>
      tables.filter(
        (t) => t.area === area && t.seats >= partySize && t.status === 'IDLE'
      ),
    [tables, area, partySize]
  );

  // Fallback: all idle tables across areas if current area has none
  const allIdleTablesWithSeats = React.useMemo(
    () => tables.filter((t) => t.seats >= partySize && t.status === 'IDLE'),
    [tables, partySize]
  );

  const [selectedTableId, setSelectedTableId] = React.useState<string>('');

  React.useEffect(() => {
    if (availableTables.length > 0) {
      if (!availableTables.some((t) => t.id === selectedTableId)) {
        setSelectedTableId(availableTables[0].id);
      }
    } else if (allIdleTablesWithSeats.length > 0) {
      setSelectedTableId(allIdleTablesWithSeats[0].id);
    } else {
      setSelectedTableId('');
    }
  }, [availableTables, allIdleTablesWithSeats, selectedTableId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(reservedTime)) {
      setFormError('Vui lòng chọn khung giờ nhận bàn hợp lệ (HH:mm).');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Vui lòng nhập họ tên khách đặt bàn.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (!selectedTableId) {
      setFormError('Không còn bàn trống phù hợp số lượng khách. Hãy chọn khu vực khác.');
      return;
    }

    const freshNow = new Date();
    if (isPastReservationDateTime(selectedIsoDate, reservedTime, freshNow)) {
      setFormError(
        'Thời gian nhận bàn đã qua so với hiện tại. Vui lòng chọn ngày hoặc khung giờ trong tương lai.'
      );
      return;
    }

    const chosenTable = tables.find((t) => t.id === selectedTableId);
    setFormError(null);
    onCreateReservation({
      customerName,
      phone,
      partySize,
      reservedTime,
      reservedDate: formatIsoToShortVN(selectedIsoDate),
      area: chosenTable?.area ?? area,
      tableId: selectedTableId,
      depositAmount: collectDeposit ? depositAmount : 0,
      depositMethod,
      note,
    });

    setCustomerName('');
    setPhone('');
    setNote('');
    setActiveSubTab('checkin');
  };

  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 pb-24 md:px-8 md:pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Nghiệp vụ Thu ngân • Đặt bàn & Check-in
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">
            Quản lý Đặt Bàn & Nhận Bàn Đặt Trước
          </h1>
        </div>

        {/* Bộ chuyển đổi giữa UC1 (Tạo đặt bàn) và UC2 (Check-in bàn đặt) */}
        <div className="inline-flex shrink-0 rounded-xl border border-sand-200 bg-white p-1 shadow-warm-sm">
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors ${
              activeSubTab === 'create'
                ? 'bg-primary-500 text-white shadow-warm-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <CalendarPlus className="h-4 w-4 shrink-0" />
            <span>Tạo đặt bàn & Thu cọc</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('checkin')}
            className={`flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors ${
              activeSubTab === 'checkin'
                ? 'bg-primary-500 text-white shadow-warm-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Check-in bàn đặt ({confirmedCount})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'create' ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          {/* Cột trái: Kiểm tra bàn trống (<<include>> Check Table Availability) + Thông tin khách */}
          <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-7">
            <div className="flex items-center gap-2.5 border-b border-sand-200/80 pb-4">
              <SearchCheck className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-bold text-ink">
                1. Kiểm tra bàn trống
              </h2>
            </div>

            {/* Hàng 1: Số lượng khách & Khu vực ưu tiên */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-2 block text-xs font-bold text-ink">
                  Số lượng khách
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`ops-nums flex h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded-xl border px-1.5 text-xs font-bold transition-colors sm:text-sm ${
                        partySize === num
                          ? 'border-ink bg-ink text-white'
                          : 'border-sand-300 bg-cream/60 text-ink hover:bg-cream-dark'
                      }`}
                    >
                      {num} người
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 block text-xs font-bold text-ink">
                  Khu vực ưu tiên
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setArea(a)}
                      className={`flex h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded-xl border px-2 text-xs font-bold transition-colors ${
                        area === a
                          ? 'border-ink bg-ink text-white'
                          : 'border-sand-300 bg-white text-ink hover:bg-cream'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hàng 2: Ngày nhận bàn & Giờ nhận bàn tự chọn 24h */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col">
                  <label
                    htmlFor="reservation-custom-date"
                    className="mb-2 block text-xs font-bold text-ink"
                  >
                    Ngày nhận bàn
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="reservation-custom-date"
                      type="date"
                      min={todayIso}
                      value={selectedIsoDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="ops-nums h-12 min-w-0 flex-1 cursor-pointer rounded-xl border border-sand-300 bg-white px-3 text-sm font-extrabold text-ink outline-none focus:border-primary-500"
                    />
                    <span
                      suppressHydrationWarning
                      className={`flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border px-3 text-xs font-bold ${
                        dateRelativeLabel === 'Hôm nay'
                          ? 'border-sage-200 bg-sage-100 text-sage-700'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {dateRelativeLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label
                    htmlFor="reservation-custom-hour"
                    className="mb-2 block text-xs font-bold text-ink"
                    suppressHydrationWarning
                  >
                    Giờ nhận bàn tự chọn 24h ({reservedDate})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      id="reservation-custom-hour"
                      aria-label="Chọn giờ (24h)"
                      value={selectedHour}
                      onChange={(e) => handleTimeChange(`${e.target.value}:${selectedMinute}`)}
                      className="ops-nums h-12 min-w-0 flex-1 cursor-pointer rounded-xl border border-sand-300 bg-white px-2.5 text-sm font-extrabold text-ink outline-none focus:border-primary-500"
                    >
                      {HOURS_24.map((hh) => (
                        <option key={hh} value={hh}>
                          {hh} giờ
                        </option>
                      ))}
                    </select>

                    <span className="font-extrabold text-muted">:</span>

                    <select
                      id="reservation-custom-minute"
                      aria-label="Chọn phút (bước 5 phút)"
                      value={selectedMinute}
                      onChange={(e) => handleTimeChange(`${selectedHour}:${e.target.value}`)}
                      className="ops-nums h-12 min-w-0 flex-1 cursor-pointer rounded-xl border border-sand-300 bg-white px-2.5 text-sm font-extrabold text-ink outline-none focus:border-primary-500"
                    >
                      {MINUTES_STEP_5.map((mm) => (
                        <option key={mm} value={mm}>
                          {mm} phút
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {autoShiftNotice ? (
                <div
                  className="flex items-center gap-2 rounded-xl border border-amber-300/70 bg-amber-50/80 px-3.5 py-2 text-xs font-medium text-amber-900"
                  suppressHydrationWarning
                >
                  <Clock className="h-4 w-4 shrink-0 text-amber-700" />
                  <span>{autoShiftNotice}</span>
                </div>
              ) : null}
            </div>

            {/* Kết quả kiểm tra bàn trống */}
            <div className="rounded-xl border border-sand-200 bg-cream/60 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-ink">
                  Bàn trống khả dụng cho ≥ {partySize} khách ({availableTables.length} bàn tại {area}):
                </span>
                <span className="text-xs font-semibold text-sage-700">
                  ● Sẵn sàng đặt
                </span>
              </div>

              {availableTables.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {availableTables.map((t) => {
                    const isPicked = selectedTableId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTableId(t.id)}
                        className={`flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${
                          isPicked
                            ? 'border-2 border-primary-500 bg-white shadow-warm'
                            : 'border-sand-300 bg-white/80 hover:border-ink'
                        }`}
                      >
                        <span className="ops-nums text-sm font-extrabold text-ink">
                          {t.label}
                        </span>
                        <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[10px] font-bold text-sage-700">
                          Trống
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-sand-300 bg-white p-4 text-xs text-muted">
                  Khu vực <strong>{area}</strong> hiện không còn bàn trống ≥ {partySize} ghế.
                  {allIdleTablesWithSeats.length > 0 ? (
                    <div className="mt-2">
                      <p className="font-bold text-ink">
                        Gợi ý bàn trống đủ chỗ ở khu vực khác:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {allIdleTablesWithSeats.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setArea(t.area);
                              setSelectedTableId(t.id);
                            }}
                            className="cursor-pointer rounded-lg border border-primary-400 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-600"
                          >
                            Chọn {t.label} ({t.seats} ghế • {t.area})
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Thông tin khách đặt bàn */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Họ tên khách hàng *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="VD: Lê Hoàng Nam"
                  className="min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-ink outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0912 345 678"
                  className="ops-nums min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-ink outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Ghi chú đặc biệt (Dị ứng, ghế trẻ em, VIP...)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Dị ứng đậu phộng, cần ghế em bé..."
                className="min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-ink outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Cột phải: Thu tiền cọc đặt bàn (<<extend>> Collect Booking Deposit) & Xác nhận */}
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-sand-200/80 pb-4">
                <Wallet className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-bold text-ink">
                  2. Thu tiền cọc
                </h2>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-sand-200 bg-cream/60 p-3.5">
                <p className="text-sm font-bold text-ink">Yêu cầu thu tiền đặt cọc</p>
                <input
                  type="checkbox"
                  checked={collectDeposit}
                  onChange={(e) => setCollectDeposit(e.target.checked)}
                  className="h-5 w-5 accent-[#8C1D2C]"
                />
              </label>

              {collectDeposit ? (
                <div className="flex flex-col gap-4 rounded-xl border border-sand-200 bg-cream/40 p-4">
                  <div>
                    <span className="mb-2 block text-xs font-bold text-ink">
                      Mức tiền cọc (VND số nguyên)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {DEPOSIT_PRESETS.filter((v) => v > 0).map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`ops-nums min-h-11 cursor-pointer rounded-xl border px-3 text-xs font-bold transition-colors ${
                            depositAmount === amt
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-sand-300 bg-white text-ink hover:bg-cream'
                          }`}
                        >
                          {formatVND(amt)}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      step={50000}
                      min={0}
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(Math.max(0, Math.round(Number(e.target.value) || 0)))
                      }
                      className="ops-nums mt-2.5 min-h-11 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm font-bold text-ink outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-xs font-bold text-ink">
                      Phương thức thu cọc
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'VIETQR', label: 'Chuyển khoản QR' },
                          { id: 'CASH', label: 'Tiền mặt' },
                          { id: 'CARD', label: 'Thẻ POS' },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setDepositMethod(m.id)}
                          className={`min-h-11 cursor-pointer rounded-xl border px-2 text-xs font-bold transition-colors ${
                            depositMethod === m.id
                              ? 'border-ink bg-ink text-white'
                              : 'border-sand-300 bg-white text-ink hover:bg-cream'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Tóm tắt phiếu đặt bàn */}
              <div className="rounded-xl border border-sand-200 bg-cream p-4 text-sm">
                <p className="font-bold text-ink">Tóm tắt phiếu đặt bàn</p>
                <div className="mt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Bàn được gán:</span>
                    <span className="font-bold text-ink">
                      {tables.find((t) => t.id === selectedTableId)?.label ?? 'Chưa chọn'} (
                      {area})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Thời gian & Số khách:</span>
                    <span className="ops-nums font-bold text-ink" suppressHydrationWarning>
                      {reservedTime} ({reservedDate} • {dateRelativeLabel}) • {partySize} khách
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-sand-200 pt-1.5">
                    <span className="text-muted">Tiền cọc thu trước:</span>
                    <span className="ops-nums text-sm font-extrabold text-primary-500">
                      {formatVND(collectDeposit ? depositAmount : 0)}
                    </span>
                  </div>
                </div>
              </div>

              {formError ? (
                <p className="rounded-lg border border-danger-200 bg-kds-overdue-bg px-3 py-2 text-xs font-bold text-danger-600">
                  {formError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-colors hover:bg-primary-600"
            >
              <CalendarPlus className="h-5 w-5" />
              <span>Xác nhận Đặt Bàn & Lưu Cọc</span>
            </button>
          </div>
        </form>
      ) : (
        /* UC2: Check-in Reserved Table */
        <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-warm">
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-sand-200/80 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-ink">
                Danh sách Đặt Bàn Trước
              </h2>
              <p className="text-xs text-muted">
                Khi khách đến, bấm Check-in để mở bàn ngay và tự động chuyển tiền cọc vào hóa đơn bàn
              </p>
            </div>
            <span className="ops-nums rounded-lg bg-sage-100 px-3 py-1.5 text-xs font-bold text-sage-700">
              {confirmedCount} lịch chờ khách đến
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reservations.map((res) => {
              const isConfirmed = res.status === 'CONFIRMED';
              const isCheckedIn = res.status === 'CHECKED_IN';
              return (
                <div
                  key={res.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    isConfirmed
                      ? 'border-sand-300 bg-cream/40 shadow-warm-sm'
                      : 'border-sand-200 bg-white opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="ops-nums inline-block rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white">
                          {res.tableLabel} • {res.area}
                        </span>
                        <h3 className="mt-2 text-lg font-bold text-ink">
                          {res.customerName}
                        </h3>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          isConfirmed
                            ? 'bg-honey-500/20 text-brown-900'
                            : isCheckedIn
                            ? 'bg-sage-100 text-sage-700'
                            : 'bg-danger-200 text-danger-600'
                        }`}
                      >
                        {isConfirmed
                          ? 'Chờ Check-in'
                          : isCheckedIn
                          ? 'Đã nhận bàn'
                          : 'Đã hủy'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-ink" />
                        <strong className="ops-nums text-ink">{res.phone}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-ink" />
                        <strong className="ops-nums text-ink">{res.partySize} khách</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-ink" />
                        <strong className="ops-nums text-ink">
                          {res.reservedTime} ({res.reservedDate})
                        </strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-primary-500" />
                        <span>
                          Cọc:{' '}
                          <strong className="ops-nums text-primary-500">
                            {formatVND(res.depositAmount)}
                          </strong>
                        </span>
                      </span>
                    </div>

                    {res.note ? (
                      <p className="mt-3 rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs text-ink">
                        📌 Ghi chú: {res.note}
                      </p>
                    ) : null}
                  </div>

                  {isConfirmed ? (
                    <div className="mt-4 flex gap-2 border-t border-sand-200 pt-4">
                      <button
                        type="button"
                        onClick={() => onCheckInReservation(res.id)}
                        className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-xs font-bold text-white shadow-warm transition-colors hover:bg-primary-600"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Check-in Nhận Bàn Ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancelReservation(res.id)}
                        className="flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-danger-200 bg-white px-3.5 text-xs font-bold text-danger-600 transition-colors hover:bg-kds-overdue-bg"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

