'use client';

import * as React from 'react';
import {
  WeekSchedule,
  ScheduleSummary,
  DaySchedule,
  OpenShift,
} from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WeekScheduleViewProps {
  schedule: WeekSchedule | null;
  summary: ScheduleSummary | null;
  selectedDateKey: string;
  selectedDay?: DaySchedule;
  onSelectDate: (dateKey: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onOpenRegister: (dateKey?: string, presetShiftId?: string) => void;
  onOpenSwap: (presetShiftId?: string) => void;
  onCancelRegistration: (registrationId: string) => void;
}

export function WeekScheduleView({
  schedule,
  summary,
  selectedDateKey,
  selectedDay,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onOpenRegister,
  onOpenSwap,
  onCancelRegistration,
}: WeekScheduleViewProps) {
  return (
    <div className="space-y-4">
      {/* Header B6 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#2B2118]">Lịch ca</h1>
          <p className="text-xs text-[#7A6A58] mt-0.5">
            Ca của bạn và ca trống có thể đăng ký
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenSwap()}
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
          onClick={onPrevWeek}
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
          onClick={onNextWeek}
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
                onClick={() => onSelectDate(day.dateKey)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg min-h-[58px] transition-all border ${
                  isSelected
                    ? 'bg-[#8C1D2C] text-white border-[#8C1D2C] shadow-xs'
                    : 'bg-white text-[#2B2118] border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                }`}
              >
                <span className="text-xs font-medium opacity-80">{day.weekdayLabel}</span>
                <span className="text-sm font-bold mt-0.5">{day.dayNumber}</span>
                <div className="flex items-center gap-1 mt-1 h-2">
                  {hasOwn && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#2B2118]'
                      }`}
                      title="Ca của bạn"
                    />
                  )}
                  {hasPending && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300' : 'bg-amber-500'
                      }`}
                      title="Chờ duyệt"
                    />
                  )}
                  {hasOpen && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full border ${
                        isSelected ? 'border-white' : 'border-[#7A6A58]'
                      }`}
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
              onClick={() => onOpenRegister(selectedDay.dateKey)}
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
                      onClick={() => onOpenSwap(shift.id)}
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
          {(selectedDay.registrations.some((r) => r.status === 'PENDING') ||
            selectedDay.swaps.some(
              (s) => s.status === 'PENDING_PEER' || s.status === 'PENDING_MANAGER'
            )) && (
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
                        onClick={() => onCancelRegistration(reg.id)}
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
                {selectedDay.openShifts.map((open: OpenShift) => {
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
                          onClick={() => onOpenRegister(selectedDay.dateKey, open.id)}
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
  );
}
