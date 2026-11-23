'use client';

import * as React from 'react';
import { staffScheduleService } from '@/services/staffScheduleService';
import {
  WeekSchedule,
  ScheduleSummary,
  OpenShift,
  Shift,
  SwapPeerCandidate,
  ShiftRegistration,
  ShiftSwapRequest,
} from '@/types';
import { addDays, getStartOfWeekMonday } from '@/lib/dateKey';
import { generateIdempotencyKey } from '@/lib/utils';
import { WeekScheduleView } from '@/components/staff/schedule/WeekScheduleView';
import { ShiftRegistrationView } from '@/components/staff/schedule/ShiftRegistrationView';
import { ShiftSwapView } from '@/components/staff/schedule/ShiftSwapView';

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
  const [, setLoading] = React.useState<boolean>(true);
  const [, setError] = React.useState<string | null>(null);

  // B7 states
  const [b7SelectedDateKey, setB7SelectedDateKey] = React.useState<string>('');
  const [b7OpenShifts, setB7OpenShifts] = React.useState<OpenShift[]>([]);
  const [b7SelectedShiftId, setB7SelectedShiftId] = React.useState<string>('');
  const [b7Note, setB7Note] = React.useState<string>('');
  const [b7IdempotencyKey, setB7IdempotencyKey] = React.useState<string>(() =>
    generateIdempotencyKey()
  );
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
  const [b8IdempotencyKey, setB8IdempotencyKey] = React.useState<string>(() =>
    generateIdempotencyKey()
  );
  const [b8Submitting, setB8Submitting] = React.useState<boolean>(false);
  const [b8SuccessSwap, setB8SuccessSwap] = React.useState<ShiftSwapRequest | null>(null);
  const [b8Error, setB8Error] = React.useState<string | null>(null);

  const loadData = React.useCallback(async (weekStart: string) => {
    try {
      setLoading(true);
      setError(null);
      const [sched, sum] = await Promise.all([
        staffScheduleService.getWeekSchedule(weekStart),
        staffScheduleService.getScheduleSummary(weekStart),
      ]);
      setSchedule(sched);
      setSummary(sum);

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

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  // Chọn ca trong B7: sinh mới idempotencyKey khi đổi sang ca khác
  const handleSelectB7Shift = (shiftId: string) => {
    setB7SelectedShiftId((prev) => {
      if (prev !== shiftId) {
        setB7IdempotencyKey(generateIdempotencyKey());
      }
      return shiftId;
    });
  };

  // Mở màn hình B7 (Đăng ký ca): sinh key 1 lần cho phiên thao tác
  const handleOpenB7 = async (initialDateKey?: string, presetShiftId?: string) => {
    const targetDate = initialDateKey || selectedDateKey || currentWeekStart;
    setB7SelectedDateKey(targetDate);
    setB7Note('');
    setB7SuccessReg(null);
    setB7Cancelled(false);
    setB7Error(null);
    setB7IdempotencyKey(generateIdempotencyKey());
    setView('B7');

    try {
      const openList = await staffScheduleService.listOpenShifts(targetDate);
      setB7OpenShifts(openList);
      if (presetShiftId && openList.some((s) => s.id === presetShiftId && s.slotsTaken < s.slotsTotal)) {
        setB7SelectedShiftId(presetShiftId);
      } else {
        const firstAvailable = openList.find((s) => s.slotsTaken < s.slotsTotal);
        setB7SelectedShiftId(firstAvailable ? firstAvailable.id : '');
      }
    } catch {
      setB7OpenShifts([]);
    }
  };

  // Đổi ngày trong form B7: sinh mới idempotencyKey cho lựa chọn ngày/ca mới
  const handleB7ChangeDate = async (newDateKey: string) => {
    setB7SelectedDateKey(newDateKey);
    setB7Error(null);
    setB7IdempotencyKey(generateIdempotencyKey());
    try {
      const openList = await staffScheduleService.listOpenShifts(newDateKey);
      setB7OpenShifts(openList);
      const firstAvailable = openList.find((s) => s.slotsTaken < s.slotsTotal);
      setB7SelectedShiftId(firstAvailable ? firstAvailable.id : '');
    } catch {
      setB7OpenShifts([]);
    }
  };

  // Gửi đăng ký ca B7: dùng lại b7IdempotencyKey cho mọi lần thử lại của cùng 1 thao tác
  const handleSubmitB7 = async () => {
    if (!b7SelectedShiftId || b7Submitting) return;
    setB7Submitting(true);
    setB7Error(null);
    try {
      const reg = await staffScheduleService.registerShift({
        openShiftId: b7SelectedShiftId,
        dateKey: b7SelectedDateKey,
        note: b7Note.trim() || undefined,
        idempotencyKey: b7IdempotencyKey,
      });
      setB7SuccessReg(reg);
      loadData(currentWeekStart);
    } catch (err) {
      setB7Error((err as Error).message || 'Không thể đăng ký ca');
    } finally {
      setB7Submitting(false);
    }
  };

  // Hủy đăng ký ca B7
  const handleCancelRegistration = async (registrationId: string) => {
    try {
      await staffScheduleService.cancelRegistration({ registrationId });
      setB7Cancelled(true);
      loadData(currentWeekStart);
    } catch (err) {
      setB7Error((err as Error).message || 'Không thể hủy đăng ký ca');
    }
  };

  // Chọn ca của tôi hoặc người nhận trong B8: sinh mới idempotencyKey khi đổi đối tượng
  const handleSelectB8OwnShift = (shiftId: string) => {
    setB8SelectedOwnShiftId((prev) => {
      if (prev !== shiftId) {
        setB8IdempotencyKey(generateIdempotencyKey());
      }
      return shiftId;
    });
  };

  const handleSelectB8Peer = (peerId: string) => {
    setB8SelectedPeerId((prev) => {
      if (prev !== peerId) {
        setB8IdempotencyKey(generateIdempotencyKey());
      }
      return peerId;
    });
  };

  // Mở màn hình B8 (Đổi ca): sinh key 1 lần cho phiên thao tác
  const handleOpenB8 = async (presetShiftId?: string) => {
    setView('B8');
    setB8Error(null);
    setB8SuccessSwap(null);
    setB8Reason('');
    setB8Search('');
    setB8IdempotencyKey(generateIdempotencyKey());

    try {
      const [allShifts, peers] = await Promise.all([
        staffScheduleService.getMySchedule(),
        staffScheduleService.listSwapPeers(),
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

  // Gửi đổi ca B8: dùng lại b8IdempotencyKey cho mọi lần thử lại của cùng 1 thao tác
  const handleSubmitB8 = async () => {
    if (!b8SelectedOwnShiftId || !b8SelectedPeerId || b8Submitting) return;
    setB8Submitting(true);
    setB8Error(null);

    try {
      const swap = await staffScheduleService.createShiftSwap({
        requesterShiftId: b8SelectedOwnShiftId,
        peerId: b8SelectedPeerId,
        reason: b8Reason.trim() || undefined,
        idempotencyKey: b8IdempotencyKey,
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

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Thanh chuyển nhanh 3 phân hệ B6 / B7 / B8 */}
        <div
          role="tablist"
          aria-label="Phân hệ lịch ca"
          className="grid grid-cols-3 gap-1.5 bg-white border border-[#E9E4DC] rounded-xl p-1 shadow-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'B6'}
            onClick={() => setView('B6')}
            className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              view === 'B6'
                ? 'bg-[#8C1D2C] text-white shadow-xs'
                : 'text-[#2B2118] hover:bg-[#F6F4F0]'
            }`}
          >
            Lịch ca
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'B7'}
            onClick={() => handleOpenB7()}
            className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              view === 'B7'
                ? 'bg-[#8C1D2C] text-white shadow-xs'
                : 'text-[#2B2118] hover:bg-[#F6F4F0]'
            }`}
          >
            Đăng ký ca
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'B8'}
            onClick={() => handleOpenB8()}
            className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              view === 'B8'
                ? 'bg-[#8C1D2C] text-white shadow-xs'
                : 'text-[#2B2118] hover:bg-[#F6F4F0]'
            }`}
          >
            Đổi ca
          </button>
        </div>

        {/* ===================== B6: LỊCH CA ===================== */}
        {view === 'B6' && (
          <WeekScheduleView
            schedule={schedule}
            summary={summary}
            selectedDateKey={selectedDateKey}
            selectedDay={selectedDay}
            onSelectDate={setSelectedDateKey}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onOpenRegister={handleOpenB7}
            onOpenSwap={handleOpenB8}
            onCancelRegistration={handleCancelRegistration}
          />
        )}

        {/* ===================== B7: ĐĂNG KÝ CA ===================== */}
        {view === 'B7' && (
          <ShiftRegistrationView
            days={schedule?.days || []}
            selectedDateKey={b7SelectedDateKey}
            openShifts={b7OpenShifts}
            selectedShiftId={b7SelectedShiftId}
            note={b7Note}
            submitting={b7Submitting}
            successReg={b7SuccessReg}
            cancelled={b7Cancelled}
            error={b7Error}
            onBackToSchedule={() => setView('B6')}
            onChangeDate={handleB7ChangeDate}
            onSelectShift={handleSelectB7Shift}
            onChangeNote={setB7Note}
            onSubmit={handleSubmitB7}
            onCancelRegistration={handleCancelRegistration}
            onResetForm={() => handleOpenB7()}
          />
        )}

        {/* ===================== B8: ĐỔI CA ===================== */}
        {view === 'B8' && (
          <ShiftSwapView
            ownShifts={b8OwnShifts}
            selectedOwnShiftId={b8SelectedOwnShiftId}
            peers={b8Peers}
            search={b8Search}
            selectedPeerId={b8SelectedPeerId}
            reason={b8Reason}
            submitting={b8Submitting}
            successSwap={b8SuccessSwap}
            error={b8Error}
            onBackToSchedule={() => setView('B6')}
            onSelectOwnShift={handleSelectB8OwnShift}
            onChangeSearch={setB8Search}
            onSelectPeer={handleSelectB8Peer}
            onChangeReason={setB8Reason}
            onSubmit={handleSubmitB8}
            onResetForm={() => handleOpenB8()}
          />
        )}
      </div>
    </div>
  );
}
