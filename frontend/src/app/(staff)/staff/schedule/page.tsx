'use client';

import * as React from 'react';
import Link from 'next/link';
import { staffService } from '@/services/mock/mockStaffService';
import {
  WeekSchedule,
  ScheduleSummary,
  DaySchedule,
  OpenShift,
  Shift,
  SwapPeerCandidate,
  ShiftRegistration,
  ShiftSwapRequest,
} from '@/types';
import { addDays, getStartOfWeekMonday } from '@/lib/dateKey';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  ArrowRightLeft,
  X,
  Send,
} from 'lucide-react';

export default function SchedulePage() {
  // Navigation / Views: 'B6' (Lịch ca) | 'B7' (Đăng ký ca) | 'B8' (Đổi ca)
  const [view, setView] = React.useState<'B6' | 'B7' | 'B8'>('B6');

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = React.useState<string>(() =>
    getStartOfWeekMonday(new Date())
  );
  const [selectedDateKey, setSelectedDateKey] = React.useState<string>('');
  const [schedule, setSchedule] = React.useState<WeekSchedule | null>(null);
  const [summary, setSummary] = React.useState<ScheduleSummary | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // B7 states
  const [b7SelectedDateKey, setB7SelectedDateKey] = React.useState<string>('');
  const [b7OpenShifts, setB7OpenShifts] = React.useState<OpenShift[]>([]);
  const [b7SelectedShiftId, setB7SelectedShiftId] = React.useState<string>('');
  const [b7Note, setB7Note] = React.useState<string>('');
  const [b7Submitting, setB7Submitting] = React.useState<boolean>(false);
  const [b7SuccessReg, setB7SuccessReg] = React.useState<ShiftRegistration | null>(null);
  const [b7Cancelled, setB7Cancelled] = React.useState<boolean>(false);
  const [b7Error, setB7Error] = React.useState<string | null>(null);

  // B8 states
  const [b8OwnShifts, setB8OwnShifts] = React.useState<Shift[]>([]);
  const [b8SelectedOwnShiftId, setB8SelectedOwnShiftId] = React.useState<string>('');
  const [b8Peers, setB8Peers] = React.useState<SwapPeerCandidate[]>([]);
  const [b8Search, setB8Search] = React.useState<string>('');
  const [b8SelectedPeerId, setB8SelectedPeerId] = React.useState<string>('');
  const [b8Reason, setB8Reason] = React.useState<string>('');
  const [b8Submitting, setB8Submitting] = React.useState<boolean>(false);
  const [b8SuccessSwap, setB8SuccessSwap] = React.useState<ShiftSwapRequest | null>(null);
  const [b8Error, setB8Error] = React.useState<string | null>(null);

  const loadData = React.useCallback(async (weekStart: string) => {
    try {
      setLoading(true);
      setError(null);
      const [sched, sum] = await Promise.all([
        staffService.getWeekSchedule(weekStart),
        staffService.getScheduleSummary(weekStart),
      ]);
      setSchedule(sched);
      setSummary(sum);

      // Mặc định chọn ngày đầu tuần nếu chưa chọn
      setSelectedDateKey((prev) => {
        const exists = sched.days.some((d) => d.dateKey === prev);
        return exists ? prev : sched.days[0].dateKey;
      });
    } catch (err) {
      setError((err as Error).message || 'Không thể tải lịch ca làm việc');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData(currentWeekStart);
  }, [currentWeekStart, loadData]);

  // Handle tuần trước / tuần sau
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  // Mở màn hình B7 (Đăng ký ca)
  const handleOpenB7 = async (initialDateKey?: string) => {
    const targetDate = initialDateKey || selectedDateKey || currentWeekStart;
    setB7SelectedDateKey(targetDate);
    setB7Note('');
    setB7SuccessReg(null);
    setB7Cancelled(false);
    setB7Error(null);
    setView('B7');

    try {
      const openList = await staffService.listOpenShifts(targetDate);
      setB7OpenShifts(openList);
      const firstAvailable = openList.find((s) => s.slotsTaken < s.slotsTotal);
      setB7SelectedShiftId(firstAvailable ? firstAvailable.id : '');
    } catch {
      setB7OpenShifts([]);
    }
  };

  // Đổi ngày trong form B7
  const handleB7ChangeDate = async (newDateKey: string) => {
    setB7SelectedDateKey(newDateKey);
    setB7Error(null);
    try {
      const openList = await staffService.listOpenShifts(newDateKey);
      setB7OpenShifts(openList);
      const firstAvailable = openList.find((s) => s.slotsTaken < s.slotsTotal);
      setB7SelectedShiftId(firstAvailable ? firstAvailable.id : '');
    } catch {
      setB7OpenShifts([]);
    }
  };

  // Gửi đăng ký ca B7
  const handleSubmitB7 = async () => {
    if (!b7SelectedShiftId || b7Submitting) return;
    setB7Submitting(true);
    setB7Error(null);
    try {
      const reg = await staffService.registerShift({
        openShiftId: b7SelectedShiftId,
        dateKey: b7SelectedDateKey,
        note: b7Note.trim() || undefined,
        idempotencyKey: `reg-${b7SelectedShiftId}-${Date.now()}`,
      });
      setB7SuccessReg(reg);
      // Reload dữ liệu nền
      loadData(currentWeekStart);
    } catch (err) {
      setB7Error((err as Error).message || 'Không thể đăng ký ca');
    } finally {
      setB7Submitting(false);
    }
  };

  // Hủy đăng ký ca B7 (khi còn PENDING)
  const handleCancelRegistration = async (registrationId: string) => {
    try {
      await staffService.cancelRegistration({ registrationId });
      setB7Cancelled(true);
      loadData(currentWeekStart);
    } catch (err) {
      alert((err as Error).message || 'Không thể hủy đăng ký ca');
    }
  };

  // Mở màn hình B8 (Đổi ca)
  const handleOpenB8 = async (presetShiftId?: string) => {
    setView('B8');
    setB8Error(null);
    setB8SuccessSwap(null);
    setB8Reason('');
    setB8Search('');

    try {
      const [allShifts, peers] = await Promise.all([
        staffService.getMySchedule(),
        staffService.listSwapPeers(),
      ]);
      setB8OwnShifts(allShifts);
      setB8Peers(peers);
      setB8SelectedOwnShiftId(presetShiftId || (allShifts.length > 0 ? allShifts[0].id : ''));
      setB8SelectedPeerId('');
    } catch {
      setB8OwnShifts([]);
      setB8Peers([]);
    }
  };

  // Gửi đổi ca B8
  const handleSubmitB8 = async () => {
    if (!b8SelectedOwnShiftId || !b8SelectedPeerId || b8Submitting) return;
    setB8Submitting(true);
    setB8Error(null);

    try {
      const swap = await staffService.createShiftSwap({
        requesterShiftId: b8SelectedOwnShiftId,
        peerId: b8SelectedPeerId,
        reason: b8Reason.trim() || undefined,
        idempotencyKey: `swap-${b8SelectedOwnShiftId}-${Date.now()}`,
      });
      setB8SuccessSwap(swap);
      loadData(currentWeekStart);
    } catch (err) {
      setB8Error((err as Error).message || 'Không thể tạo yêu cầu đổi ca');
    } finally {
      setB8Submitting(false);
    }
  };

  const selectedDay = schedule?.days.find((d) => d.dateKey === selectedDateKey);

  // Lọc peers theo search
  const filteredPeers = b8Peers.filter(
    (p) =>
      p.staffName.toLowerCase().includes(b8Search.toLowerCase()) ||
      p.shiftTitle.toLowerCase().includes(b8Search.toLowerCase()) ||
      p.zone.toLowerCase().includes(b8Search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      {/* ===================== B6: LỊCH CA ===================== */}
      {view === 'B6' && (
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
          {/* Nút back về Trang chủ */}
          <div>
            <Link
              href="/staff"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-[#2B2118]" />
              <span>Trang chủ</span>
            </Link>
          </div>

          {/* Header B6 */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#2B2118]">Lịch ca</h1>
              <p className="text-xs text-[#7A6A58] mt-0.5">Ca của bạn và ca trống có thể đăng ký</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenB8()}
              className="px-4 py-2 bg-[#8C1D2C] hover:bg-[#6F1623] text-white text-sm font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
            >
              Đổi ca
            </button>
          </div>

          {/* Card tóm tắt tuần */}
          <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-2 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-[#7A6A58]">Ca của bạn tuần này</span>
              <span className="font-semibold text-[#141210]">
                {summary ? `${summary.shiftsThisWeek} ca · ${summary.hoursThisWeek} giờ` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-[#F6F4F0]">
              <span className="text-[#7A6A58]">Ca trống có thể đăng ký</span>
              <span className="font-semibold text-[#141210]">
                {summary ? `${summary.openShiftsThisWeek} ca` : '—'}
              </span>
            </div>
            {summary && (summary.pendingRegistrations > 0 || summary.pendingSwaps > 0) && (
              <div className="flex justify-between items-center py-1 border-t border-[#F6F4F0] text-[#8C1D2C]">
                <span>Đang chờ duyệt</span>
                <span className="font-semibold">
                  {summary.pendingRegistrations + summary.pendingSwaps} ca
                </span>
              </div>
            )}
          </div>

          {/* Điều hướng tuần */}
          <div className="flex items-center justify-between bg-white border border-[#E9E4DC] rounded-lg p-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              aria-label="Tuần trước"
              className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-md hover:bg-[#F6F4F0] text-[#2B2118]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-[#2B2118]">
              {schedule?.weekLabel || 'Đang tải...'}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              aria-label="Tuần sau"
              className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-md hover:bg-[#F6F4F0] text-[#2B2118]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Thanh chọn 7 ngày (Day strip) */}
          <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1">
              {schedule?.days.map((day) => {
                const isSelected = day.dateKey === selectedDateKey;
                const hasOwn = day.myShifts.length > 0;
                const hasPending =
                  day.registrations.some((r) => r.status === 'PENDING') ||
                  day.swaps.some(
                    (s) => s.status === 'PENDING_PEER' || s.status === 'PENDING_MANAGER'
                  );
                const hasOpen = day.openShifts.some((o) => o.slotsTaken < o.slotsTotal);

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg min-h-[58px] transition-all border ${
                      isSelected
                        ? 'bg-[#8C1D2C] text-white border-[#8C1D2C] shadow-xs'
                        : 'bg-white text-[#2B2118] border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                    }`}
                  >
                    <span className="text-xs font-medium opacity-80">{day.weekdayLabel}</span>
                    <span className="text-sm font-bold mt-0.5">{day.dayNumber}</span>
                    {/* Dấu chấm trạng thái */}
                    <div className="flex items-center gap-1 mt-1 h-2">
                      {hasOwn && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#2B2118]'}`}
                          title="Ca của bạn"
                        />
                      )}
                      {hasPending && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`}
                          title="Chờ duyệt"
                        />
                      )}
                      {hasOpen && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full border ${isSelected ? 'border-white' : 'border-[#7A6A58]'}`}
                          title="Ca trống"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#7A6A58] text-center pt-1">
              ● Ca của bạn &nbsp; ◐ Chờ duyệt &nbsp; ○ Ca trống
            </p>
          </div>

          {/* Chi tiết ngày đang chọn */}
          {selectedDay && (
            <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F6F4F0] pb-2">
                <h2 className="text-base font-bold text-[#2B2118]">{selectedDay.fullDateLabel}</h2>
                <button
                  type="button"
                  onClick={() => handleOpenB7(selectedDay.dateKey)}
                  className="text-xs font-semibold text-[#8C1D2C] hover:underline min-h-[36px] flex items-center"
                >
                  + Đăng ký ca
                </button>
              </div>

              {/* Ca của tôi trong ngày */}
              <div>
                <h3 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                  Ca làm việc của bạn
                </h3>
                {selectedDay.myShifts.length === 0 ? (
                  <p className="text-sm text-[#7A6A58] italic py-1">Không có ca làm việc</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.myShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#F6F4F0] border border-[#E9E4DC]"
                      >
                        <div>
                          <div className="font-semibold text-sm text-[#2B2118]">
                            {shift.startTime} – {shift.endTime}
                          </div>
                          <div className="text-xs text-[#7A6A58] mt-0.5">
                            {shift.zone || 'Khu vực bếp'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenB8(shift.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E9E4DC] hover:border-[#8C1D2C] text-[#8C1D2C] rounded-md min-h-[40px] flex items-center transition-colors"
                        >
                          Đổi ca
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ca đang chờ duyệt (đăng ký hoặc đổi) */}
              {(selectedDay.registrations.length > 0 || selectedDay.swaps.length > 0) && (
                <div className="pt-2 border-t border-[#F6F4F0]">
                  <h3 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                    Yêu cầu chờ duyệt
                  </h3>
                  <div className="space-y-2">
                    {selectedDay.registrations
                      .filter((r) => r.status === 'PENDING')
                      .map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-amber-50/60 border border-amber-200"
                        >
                          <div>
                            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded mb-1">
                              Đăng ký ca · Chờ duyệt
                            </span>
                            <div className="text-xs text-[#7A6A58]">
                              Ghi chú: {reg.note || 'Không có'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelRegistration(reg.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#D14B3A] hover:bg-red-50 rounded-md min-h-[40px] flex items-center"
                          >
                            Hủy
                          </button>
                        </div>
                      ))}

                    {selectedDay.swaps
                      .filter((s) => s.status === 'PENDING_PEER' || s.status === 'PENDING_MANAGER')
                      .map((sw) => (
                        <div
                          key={sw.id}
                          className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-blue-900">
                              Đổi ca ·{' '}
                              {sw.status === 'PENDING_PEER'
                                ? 'Chờ người nhận xác nhận'
                                : 'Chờ quản lý duyệt'}
                            </span>
                            <span className="text-[#7A6A58]">Không thể hủy</span>
                          </div>
                          <p className="text-[#7A6A58]">Lý do: {sw.reason || '—'}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Ca trống có thể đăng ký trong ngày */}
              <div className="pt-2 border-t border-[#F6F4F0]">
                <h3 className="text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                  Ca trống mở đăng ký
                </h3>
                {selectedDay.openShifts.length === 0 ? (
                  <p className="text-sm text-[#7A6A58] italic py-1">Không có ca trống trong ngày</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.openShifts.map((open) => {
                      const isFull = open.slotsTaken >= open.slotsTotal;
                      return (
                        <div
                          key={open.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-[#E9E4DC] hover:border-[#8C1D2C]/40 bg-white"
                        >
                          <div>
                            <div className="font-semibold text-sm text-[#2B2118]">
                              {open.title}: {open.startTime} – {open.endTime}
                            </div>
                            <div className="text-xs text-[#7A6A58] mt-0.5">
                              {open.zone} ·{' '}
                              {isFull ? (
                                <span className="text-[#D14B3A] font-semibold">Đã đủ người</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">
                                  Còn {open.slotsTotal - open.slotsTaken} chỗ
                                </span>
                              )}
                            </div>
                          </div>
                          {!isFull && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenB7(selectedDay.dateKey);
                                setB7SelectedShiftId(open.id);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#8C1D2C] hover:bg-[#6F1623] text-white rounded-md min-h-[40px] flex items-center transition-colors"
                            >
                              Đăng ký
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== B7: ĐĂNG KÝ CA ===================== */}
      {view === 'B7' && (
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
          <button
            type="button"
            onClick={() => setView('B6')}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Lịch ca</span>
          </button>

          {!b7SuccessReg && !b7Cancelled && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-[#2B2118]">Đăng ký ca</h1>
                <p className="text-xs text-[#7A6A58] mt-0.5">
                  Chọn ngày và ca muốn đăng ký — luôn cần quản lý duyệt
                </p>
              </div>

              {b7Error && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{b7Error}</span>
                </div>
              )}

              {/* Chọn ngày qua danh sách chip cuộn */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                  Chọn ngày muốn đăng ký
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {schedule?.days.map((day) => {
                    const isSelected = day.dateKey === b7SelectedDateKey;
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => handleB7ChangeDate(day.dateKey)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold min-h-[48px] shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[#8C1D2C] text-white border-[#8C1D2C]'
                            : 'bg-white text-[#2B2118] border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                        }`}
                      >
                        {day.weekdayLabel}, {day.dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Danh sách ca trống của ngày đó */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                  Chọn ca
                </label>
                {b7OpenShifts.length === 0 ? (
                  <div className="p-4 bg-white border border-[#E9E4DC] rounded-lg text-center text-sm text-[#7A6A58]">
                    Không có ca khả dụng vào ngày đã chọn.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {b7OpenShifts.map((shift) => {
                      const isFull = shift.slotsTaken >= shift.slotsTotal;
                      const isSelected = shift.id === b7SelectedShiftId;

                      return (
                        <div
                          key={shift.id}
                          onClick={() => {
                            if (!isFull) setB7SelectedShiftId(shift.id);
                          }}
                          className={`p-3 rounded-lg border min-h-[56px] flex items-center justify-between cursor-pointer transition-all ${
                            isFull
                              ? 'bg-gray-100 border-[#E9E4DC] opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'bg-red-50/60 border-[#8C1D2C]'
                                : 'bg-white border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-[#2B2118]">
                              {shift.title}: {shift.startTime} – {shift.endTime}
                            </div>
                            <div className="text-xs text-[#7A6A58] mt-0.5">
                              {shift.zone} ·{' '}
                              {isFull ? (
                                <span className="text-[#D14B3A] font-semibold">Đã đủ người</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">
                                  Còn {shift.slotsTotal - shift.slotsTaken} chỗ
                                </span>
                              )}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="b7-shift"
                            checked={isSelected}
                            disabled={isFull}
                            onChange={() => setB7SelectedShiftId(shift.id)}
                            className="w-4 h-4 accent-[#8C1D2C]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={b7Note}
                  onChange={(e) => setB7Note(e.target.value)}
                  placeholder="Ví dụ: Chỉ làm được đến 21:00"
                  className="w-full p-3 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[80px]"
                />
              </div>

              {/* Nút gửi */}
              <button
                type="button"
                disabled={!b7SelectedShiftId || b7Submitting}
                onClick={handleSubmitB7}
                className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
              >
                {b7Submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
              </button>
              <p className="text-xs text-[#7A6A58] text-center">
                Đăng ký xong sẽ chuyển sang trạng thái chờ duyệt — quản lý duyệt thì ca mới hiện
                trong lịch của bạn.
              </p>
            </div>
          )}

          {/* Màn hình thành công B7 */}
          {b7SuccessReg && !b7Cancelled && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-[#E9E4DC] p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#8C1D2C] mx-auto" />
                <h2 className="text-lg font-bold text-[#2B2118]">Đã gửi đăng ký</h2>
                <p className="text-sm text-[#7A6A58]">Ngày {b7SuccessReg.dateKey}</p>
                <div>
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                    Chờ duyệt
                  </span>
                </div>
                <p className="text-xs text-[#7A6A58]">
                  Yêu cầu đã được gửi đến quản lý để phê duyệt.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setView('B6')}
                  className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
                >
                  Xem lịch ca
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelRegistration(b7SuccessReg.id)}
                  className="w-full py-3 bg-white border border-[#E9E4DC] hover:border-[#D14B3A] text-[#D14B3A] font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
                >
                  Hủy đăng ký
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenB7()}
                  className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Đăng ký ca khác
                </button>
              </div>
            </div>
          )}

          {/* Màn hình đã hủy B7 */}
          {b7Cancelled && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-[#E9E4DC] p-6 text-center space-y-3">
                <h2 className="text-lg font-bold text-[#2B2118]">Đã hủy đăng ký</h2>
                <p className="text-sm text-[#7A6A58]">
                  Ca trống đã trở lại cho người khác đăng ký.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setView('B6')}
                  className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
                >
                  Xem lịch ca
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenB7()}
                  className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Đăng ký ca khác
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== B8: ĐỔI CA ===================== */}
      {view === 'B8' && (
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
          <button
            type="button"
            onClick={() => setView('B6')}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Lịch ca</span>
          </button>

          {!b8SuccessSwap ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-[#2B2118]">Đổi ca</h1>
                <p className="text-xs text-[#7A6A58] mt-0.5">
                  Người nhận xác nhận trước, sau đó quản lý duyệt
                </p>
              </div>

              {b8Error && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{b8Error}</span>
                </div>
              )}

              {/* Ca của tôi muốn đổi */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                  Ca của tôi muốn đổi
                </label>
                {b8OwnShifts.length === 0 ? (
                  <div className="p-4 bg-white border border-[#E9E4DC] rounded-lg text-sm text-[#7A6A58]">
                    Bạn không có ca làm việc nào sắp tới để đổi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {b8OwnShifts.map((shift) => {
                      const isSelected = shift.id === b8SelectedOwnShiftId;
                      return (
                        <div
                          key={shift.id}
                          onClick={() => setB8SelectedOwnShiftId(shift.id)}
                          className={`p-3 rounded-lg border min-h-[52px] flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-red-50/60 border-[#8C1D2C]'
                              : 'bg-white border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-[#2B2118]">
                              {shift.date} · {shift.startTime} – {shift.endTime}
                            </div>
                            <div className="text-xs text-[#7A6A58] mt-0.5">
                              {shift.zone || 'Khu vực bếp'}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="b8-own-shift"
                            checked={isSelected}
                            onChange={() => setB8SelectedOwnShiftId(shift.id)}
                            className="w-4 h-4 accent-[#8C1D2C]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Đổi với nhân viên */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
                  Đổi với nhân viên
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-[#7A6A58] absolute left-3 top-3.5" />
                  <input
                    type="search"
                    value={b8Search}
                    onChange={(e) => setB8Search(e.target.value)}
                    placeholder="Tìm theo tên…"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
                  />
                </div>

                {filteredPeers.length === 0 ? (
                  <div className="p-4 bg-white border border-[#E9E4DC] rounded-lg text-center text-sm text-[#7A6A58]">
                    Không tìm thấy nhân viên phù hợp.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPeers.map((peer) => {
                      const isSelected = peer.staffId === b8SelectedPeerId;
                      return (
                        <div
                          key={peer.staffId}
                          onClick={() => setB8SelectedPeerId(peer.staffId)}
                          className={`p-3 rounded-lg border min-h-[56px] flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-red-50/60 border-[#8C1D2C]'
                              : 'bg-white border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-[#2B2118]">
                              {peer.staffName} · {peer.shiftTitle}
                            </div>
                            <div className="text-xs text-[#7A6A58] mt-0.5">
                              {peer.shiftDate} · {peer.shiftTime} · {peer.zone}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="b8-peer"
                            checked={isSelected}
                            onChange={() => setB8SelectedPeerId(peer.staffId)}
                            className="w-4 h-4 accent-[#8C1D2C]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lý do */}
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-1">
                  Lý do
                </label>
                <textarea
                  value={b8Reason}
                  onChange={(e) => setB8Reason(e.target.value)}
                  placeholder="Ví dụ: việc gia đình"
                  className="w-full p-3 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[80px]"
                />
              </div>

              {/* Nút gửi đổi ca */}
              <button
                type="button"
                disabled={!b8SelectedOwnShiftId || !b8SelectedPeerId || b8Submitting}
                onClick={handleSubmitB8}
                className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
              >
                {b8Submitting ? 'Đang gửi...' : 'Gửi yêu cầu đổi ca'}
              </button>
              <p className="text-xs text-[#7A6A58] text-center">
                Chọn ca của bạn và người muốn đổi thì mới gửi được.
              </p>
            </div>
          ) : (
            /* Chi tiết yêu cầu sau khi gửi */
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#2B2118]">Yêu cầu của tôi</h2>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                    Chờ người nhận xác nhận
                  </span>
                </div>

                <div className="space-y-2 text-sm border-t border-[#F6F4F0] pt-2">
                  <div className="flex justify-between py-1">
                    <span className="text-[#7A6A58]">Lý do</span>
                    <span className="font-medium text-[#141210]">{b8SuccessSwap.reason || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
                    <span className="text-[#7A6A58]">Thời gian gửi</span>
                    <span className="font-medium text-[#141210]">Vừa xong</span>
                  </div>
                </div>

                <p className="text-xs text-[#7A6A58] pt-2 border-t border-[#F6F4F0]">
                  Người nhận xác nhận thì yêu cầu sẽ được chuyển đến quản lý để phê duyệt.
                </p>
                <p className="text-xs text-[#D14B3A] font-medium">
                  Muốn hủy yêu cầu này thì gặp quản lý.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setView('B6')}
                  className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
                >
                  Xem lịch ca
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenB8()}
                  className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Đổi ca khác
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
