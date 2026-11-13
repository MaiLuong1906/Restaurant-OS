'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coffee,
  History,
  KeyRound,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  Play,
  Plus,
  RotateCcw,
  ScanFace,
  StickyNote,
  Wallet,
} from 'lucide-react';
import {
  AttendanceMethod,
  CashierAttendanceEntry,
  ShiftSettlementRecord,
} from '@/types';
import {
  SSR_FALLBACK_DATE,
  formatTimeHHMMSS,
  formatVND,
  formatVietnameseFullDate,
} from '@/lib/utils';

interface ShiftSettlementViewProps {
  shift: ShiftSettlementRecord;
  currentAttendance: CashierAttendanceEntry;
  attendanceLogs: CashierAttendanceEntry[];
  initialTab?: 'settlement' | 'attendance';
  isCashDrawerOpen?: boolean;
  onSettleShift: (actualCountedCash: number, discrepancyReason: string) => void;
  onRecordPayout: (amount: number, note: string) => void;
  onReopenShiftDemo: () => void;
  onTriggerCashDrawer: (reason: string) => void;
  onClockIn: (method: AttendanceMethod, pinCode?: string, note?: string) => boolean;
  onToggleBreak: () => void;
  onClockOut: (note?: string) => void;
}

export function ShiftSettlementView({
  shift,
  currentAttendance,
  attendanceLogs,
  initialTab = 'settlement',
  isCashDrawerOpen = false,
  onSettleShift,
  onRecordPayout,
  onReopenShiftDemo,
  onTriggerCashDrawer,
  onClockIn,
  onToggleBreak,
  onClockOut,
}: ShiftSettlementViewProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<'settlement' | 'attendance'>(
    initialTab
  );
  const [now, setNow] = React.useState<Date>(SSR_FALLBACK_DATE);

  React.useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  // Attendance local form state
  const [attendanceMethod, setAttendanceMethod] = React.useState<AttendanceMethod>('PIN');
  const [pinCode, setPinCode] = React.useState<string>('1234');
  const [attendanceNote, setAttendanceNote] = React.useState<string>('');
  const [pinError, setPinError] = React.useState<string | null>(null);

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

  const handleClockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendanceMethod === 'PIN' && pinCode.trim().length < 4) {
      setPinError('Vui lòng nhập đủ mã PIN nhân viên (tối thiểu 4 chữ số).');
      return;
    }
    setPinError(null);
    const ok = onClockIn(attendanceMethod, pinCode, attendanceNote);
    if (ok) setAttendanceNote('');
  };

  const onTimeCount = attendanceLogs.filter((l) => !l.isLate).length;
  const totalBreakAll = attendanceLogs.reduce((sum, l) => sum + l.breakMinutes, 0);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 pb-24 md:px-8 md:pb-8">
      {/* Header + Bộ chuyển tab Kết ca / Chấm công */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Nghiệp vụ Thu ngân • Kết ca &amp; Chấm công Cá nhân
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">
            {activeSubTab === 'attendance'
              ? 'Chấm Công & Theo Dõi Giờ Làm Thu Ngân'
              : 'Đối Soát Tiền Mặt & Kết Ca Thu Ngân'}
          </h1>
        </div>

        <div className="inline-flex shrink-0 self-start rounded-xl border border-sand-200 bg-white p-1 shadow-warm-sm sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('settlement')}
            className={`flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors ${
              activeSubTab === 'settlement'
                ? 'bg-primary-500 text-white shadow-warm-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span>Đối soát &amp; Kết ca</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('attendance')}
            className={`flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors ${
              activeSubTab === 'attendance'
                ? 'bg-primary-500 text-white shadow-warm-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>Chấm công Thu ngân</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'attendance' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cột trái: Thẻ chấm công ca hiện tại */}
          <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-5">
            <div className="flex items-start justify-between gap-3 border-b border-sand-200 pb-4">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="h-5 w-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-ink">{shift.cashierName}</h2>
                  <p className="text-xs text-muted">
                    {shift.shiftName} • {shift.startTime} – {shift.endTime}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  currentAttendance.status === 'WORKING'
                    ? 'bg-sage-100 text-sage-700'
                    : currentAttendance.status === 'ON_BREAK'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sand-200 text-brown-700'
                }`}
              >
                {currentAttendance.status === 'WORKING'
                  ? 'Đang làm việc'
                  : currentAttendance.status === 'ON_BREAK'
                    ? 'Đang nghỉ giữa ca'
                    : currentAttendance.status === 'CHECKED_OUT'
                      ? 'Đã tan ca'
                      : 'Chưa vào ca'}
              </span>
            </div>

            {/* Đồng hồ thời gian thực */}
            <div className="rounded-xl border border-sand-200 bg-cream/70 p-4 text-center">
              <p className="text-xs font-semibold text-muted" suppressHydrationWarning>
                {formatVietnameseFullDate(now)}
              </p>
              <p
                className="ops-nums mt-1 text-3xl font-extrabold tracking-tight text-ink"
                suppressHydrationWarning
              >
                {formatTimeHHMMSS(now)}
              </p>
            </div>

            {/* Thông số ca đang chấm công */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-sand-200 bg-cream/40 p-3">
                <p className="text-xs text-muted">Giờ vào ca (Check-in)</p>
                <p className="ops-nums mt-1 text-lg font-extrabold text-ink">
                  {currentAttendance.checkInTime || '--:--'}
                </p>
              </div>
              <div className="rounded-xl border border-sand-200 bg-cream/40 p-3">
                <p className="text-xs text-muted">Giờ tan ca (Check-out)</p>
                <p className="ops-nums mt-1 text-lg font-extrabold text-ink">
                  {currentAttendance.checkOutTime ?? '--:--'}
                </p>
              </div>
              <div className="rounded-xl border border-sand-200 bg-cream/40 p-3">
                <p className="text-xs text-muted">Nghỉ giữa ca</p>
                <p className="ops-nums mt-1 text-base font-bold text-ink">
                  {currentAttendance.breakMinutes} phút
                </p>
              </div>
              <div className="rounded-xl border border-sand-200 bg-cream/40 p-3">
                <p className="text-xs text-muted">Tình trạng giờ vào</p>
                <p
                  className={`mt-1 text-base font-bold ${
                    currentAttendance.isLate ? 'text-danger-600' : 'text-sage-700'
                  }`}
                >
                  {currentAttendance.isLate
                    ? `Muộn ${currentAttendance.lateMinutes} phút`
                    : 'Đúng giờ'}
                </p>
              </div>
            </div>

            {currentAttendance.status === 'NOT_CHECKED_IN' ||
            currentAttendance.status === 'CHECKED_OUT' ? (
              <form onSubmit={handleClockInSubmit} className="flex flex-col gap-3.5 border-t border-sand-200 pt-4">
                <div>
                  <span className="mb-2 block text-xs font-bold text-ink">
                    Phương thức xác thực chấm công
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAttendanceMethod('PIN')}
                      className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-colors ${
                        attendanceMethod === 'PIN'
                          ? 'border-ink bg-ink text-white'
                          : 'border-sand-300 bg-white text-ink hover:bg-cream'
                      }`}
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>Mã PIN nhân viên</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceMethod('FACE_SCAN')}
                      className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-colors ${
                        attendanceMethod === 'FACE_SCAN'
                          ? 'border-ink bg-ink text-white'
                          : 'border-sand-300 bg-white text-ink hover:bg-cream'
                      }`}
                    >
                      <ScanFace className="h-4 w-4" />
                      <span>Quét khuôn mặt</span>
                    </button>
                  </div>
                </div>

                {attendanceMethod === 'PIN' ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink">
                      Mã PIN chấm công (Demo mặc định: 1234)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="Nhập mã PIN 4–6 số"
                      className="ops-nums min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-base font-bold tracking-widest text-ink outline-none focus:border-primary-500"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-sage-400 bg-sage-50/70 p-3 text-xs text-sage-800">
                    Camera nhận diện khuôn mặt tại quầy Thu ngân đã sẵn sàng xác thực ca mới.
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Ghi chú vào ca (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    placeholder="VD: Nhận bàn giao két tiền ca mới..."
                    className="min-h-11 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-ink outline-none focus:border-primary-500"
                  />
                </div>

                {pinError ? (
                  <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-kds-overdue-bg p-3 text-xs font-bold text-danger-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-colors hover:bg-primary-600"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Chấm công Vào ca mới</span>
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 border-t border-sand-200 pt-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Ghi chú chấm công / bàn giao ca (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    placeholder="VD: Đã bàn giao hóa đơn và tiền lẻ cho ca sau..."
                    className="min-h-11 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-ink outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onToggleBreak}
                    className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${
                      currentAttendance.status === 'ON_BREAK'
                        ? 'border-sage-600 bg-sage-600 text-white hover:bg-sage-700'
                        : 'border-sand-300 bg-cream text-ink hover:bg-cream-dark'
                    }`}
                  >
                    {currentAttendance.status === 'ON_BREAK' ? (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Quay lại làm việc</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="h-4 w-4 text-brown-700" />
                        <span>Nghỉ giữa ca</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClockOut(attendanceNote);
                      setAttendanceNote('');
                    }}
                    className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-bold text-white shadow-warm transition-colors hover:bg-primary-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Chấm công Tan ca</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Thống kê & Bảng lịch sử chấm công */}
          <div className="flex flex-col gap-5 rounded-2xl border border-sand-200 bg-white p-6 shadow-warm lg:col-span-7">
            <div className="flex items-center justify-between border-b border-sand-200 pb-4">
              <div className="flex items-center gap-2.5">
                <History className="h-5 w-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    Lịch sử Chấm Công Cá Nhân ({attendanceLogs.length})
                  </h2>
                  <p className="text-xs text-muted">
                    Ghi nhận giờ vào ca, nghỉ giữa ca và tan ca theo mã nhân viên
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-sand-200 bg-cream/60 p-3.5">
                <p className="text-xs text-muted">Số ca ghi nhận</p>
                <p className="ops-nums mt-1 text-2xl font-extrabold text-ink">
                  {attendanceLogs.length}
                </p>
              </div>
              <div className="rounded-xl border border-sand-200 bg-cream/60 p-3.5">
                <p className="text-xs text-muted">Ca đi đúng giờ</p>
                <p className="ops-nums mt-1 text-2xl font-extrabold text-sage-700">
                  {onTimeCount}/{attendanceLogs.length}
                </p>
              </div>
              <div className="rounded-xl border border-sand-200 bg-cream/60 p-3.5">
                <p className="text-xs text-muted">Tổng nghỉ giữa ca</p>
                <p className="ops-nums mt-1 text-2xl font-extrabold text-ink">
                  {totalBreakAll} phút
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-sand-200 text-[11px] uppercase tracking-wider text-muted">
                    <th className="py-3 pr-3 font-bold">Ngày</th>
                    <th className="py-3 pr-3 font-bold">Ca làm việc</th>
                    <th className="py-3 pr-3 font-bold">Giờ vào</th>
                    <th className="py-3 pr-3 font-bold">Giờ ra</th>
                    <th className="py-3 pr-3 font-bold">Nghỉ ca</th>
                    <th className="py-3 pr-3 font-bold">Hình thức</th>
                    <th className="py-3 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/70">
                  {attendanceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-cream/40">
                      <td className="ops-nums py-3 pr-3 font-bold text-ink">{log.date}</td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-ink">{log.shiftName}</p>
                        {log.note ? (
                          <p className="text-[11px] text-muted">{log.note}</p>
                        ) : null}
                      </td>
                      <td className="ops-nums py-3 pr-3 font-bold text-ink">
                        {log.checkInTime}
                      </td>
                      <td className="ops-nums py-3 pr-3 font-semibold text-muted">
                        {log.checkOutTime ?? '—'}
                      </td>
                      <td className="ops-nums py-3 pr-3 text-muted">{log.breakMinutes}p</td>
                      <td className="py-3 pr-3">
                        <span className="rounded bg-cream px-2 py-0.5 font-semibold text-brown-700">
                          {log.method === 'FACE_SCAN' ? 'Face Scan' : 'Mã PIN'}
                        </span>
                      </td>
                      <td className="py-3">
                        {log.status === 'WORKING' ? (
                          <span className="rounded-md bg-sage-100 px-2 py-0.5 font-bold text-sage-700">
                            Đang trong ca
                          </span>
                        ) : log.status === 'ON_BREAK' ? (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                            Nghỉ giữa ca
                          </span>
                        ) : log.isLate ? (
                          <span className="rounded-md bg-kds-overdue-bg px-2 py-0.5 font-bold text-danger-600">
                            Muộn {log.lateMinutes}p
                          </span>
                        ) : (
                          <span className="rounded-md bg-sand-200 px-2 py-0.5 font-bold text-ink">
                            Hoàn tất • Đúng giờ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
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
                    : 'border-sand-300 bg-cream text-ink hover:bg-cream-dark'
                }`}
              >
                {isCashDrawerOpen ? (
                  <Lock className="h-3.5 w-3.5 text-primary-600" />
                ) : (
                  <LockOpen className="h-3.5 w-3.5 text-primary-500" />
                )}
                <span>{isCashDrawerOpen ? 'Đóng két tiền' : 'Mở két kiểm tiền'}</span>
              </button>
              {shift.status === 'SETTLED' ? (
                <button
                  type="button"
                  onClick={onReopenShiftDemo}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50 px-3 text-xs font-bold text-primary-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Mở lại ca (Demo)</span>
                </button>
              ) : null}
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
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
            <div className="border-b border-sand-200/70 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted">4. Chi nội bộ / Hoàn tiền mặt (−)</span>
                <div className="flex items-center gap-2">
                  {shift.status === 'OPEN' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPayoutError(null);
                        setPayoutOpen((prev) => !prev);
                      }}
                      className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg border border-sand-300 bg-cream px-2.5 py-1 text-xs font-bold text-ink transition-colors hover:bg-cream-dark"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary-500" />
                      <span>{payoutOpen ? 'Đóng' : 'Ghi chi & Note'}</span>
                    </button>
                  ) : null}
                  <span className="ops-nums font-bold text-danger-600">
                    -{formatVND(shift.cashRefundsOrPayouts)}
                  </span>
                </div>
              </div>

              {/* Form thêm phiếu chi nội bộ có note */}
              {payoutOpen && shift.status === 'OPEN' ? (
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-sand-300 bg-cream/70 p-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-ink">
                      Ghi nhận phiếu chi nội bộ mới
                    </span>
                    <div className="flex gap-1.5">
                      {[50000, 100000, 200000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPayoutAmountStr(String(preset))}
                          className="ops-nums cursor-pointer rounded-md border border-sand-300 bg-white px-2 py-1 text-[11px] font-bold text-ink hover:bg-cream-dark"
                        >
                          {formatVND(preset)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className="mb-1 block text-[11px] font-bold text-muted">
                        Số tiền chi (VND) *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={payoutAmountStr}
                        onChange={(e) => setPayoutAmountStr(e.target.value)}
                        placeholder="50000"
                        className="ops-nums min-h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-right text-sm font-bold text-ink outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <label className="mb-1 block text-[11px] font-bold text-muted">
                        Note lý do chi tiền *
                      </label>
                      <input
                        type="text"
                        value={payoutNote}
                        onChange={(e) => setPayoutNote(e.target.value)}
                        placeholder="VD: Mua đá viên bổ sung, mua rau thơm, hoàn tiền..."
                        className="min-h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm text-ink outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {payoutError ? (
                    <p className="font-bold text-danger-600">{payoutError}</p>
                  ) : null}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutOpen(false)}
                      className="min-h-9 cursor-pointer rounded-lg border border-sand-300 bg-white px-3 font-bold text-muted hover:text-ink"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePayout}
                      className="min-h-9 cursor-pointer rounded-lg bg-primary-500 px-4 font-bold text-white shadow-warm-sm hover:bg-primary-600"
                    >
                      Lưu khoản chi &amp; Trừ két
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Danh sách các khoản chi nội bộ kèm note */}
              {shift.payoutLogs.length > 0 ? (
                <div className="mt-2.5 space-y-1.5">
                  {shift.payoutLogs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-sand-200 bg-cream/40 px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brown-700" />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{item.note}</p>
                          <p className="ops-nums text-[11px] text-muted">
                            {item.timestamp} • {item.createdBy}
                          </p>
                        </div>
                      </div>
                      <span className="ops-nums shrink-0 font-bold text-danger-600">
                        -{formatVND(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
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
                    disabled={shift.status === 'SETTLED'}
                    onClick={() => setCountedStr(String(expectedCash))}
                    className="cursor-pointer rounded border border-sand-300 bg-cream px-2 py-0.5 text-[11px] font-bold text-ink hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Khớp 100%
                  </button>
                  <button
                    type="button"
                    disabled={shift.status === 'SETTLED'}
                    onClick={() => setCountedStr(String(expectedCash - 50000))}
                    className="cursor-pointer rounded border border-danger-200 bg-kds-overdue-bg px-2 py-0.5 text-[11px] font-bold text-danger-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Giả lập lệch -50k
                  </button>
                </div>
              </div>
              <input
                id="actual-cash"
                type="text"
                inputMode="numeric"
                disabled={shift.status === 'SETTLED'}
                value={countedStr}
                onChange={(e) => setCountedStr(e.target.value)}
                className="ops-nums min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-right text-lg font-extrabold text-ink outline-none focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-cream/60 disabled:opacity-75"
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

            {shift.status === 'SETTLED' ? (
              <div className="flex flex-col gap-3 rounded-xl border border-sage-200 bg-sage-50/80 p-4">
                <div className="flex items-center justify-between gap-2 text-sm font-bold text-sage-800">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-700" />
                    <span>
                      Ca làm việc đã được chốt đối soát
                      {shift.settledAt ? ` lúc ${shift.settledAt}` : ''}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onReopenShiftDemo}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-400 bg-white px-5 py-3 text-sm font-bold text-primary-600 shadow-warm-sm transition-colors hover:bg-primary-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Mở lại ca làm việc (Điều chỉnh / Đối soát lại)</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-colors hover:bg-primary-600"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Xác nhận Đối soát &amp; Đóng ca Thu ngân</span>
              </button>
            )}
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
      )}
    </div>
  );
}

