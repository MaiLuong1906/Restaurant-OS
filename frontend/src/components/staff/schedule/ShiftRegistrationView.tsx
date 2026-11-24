'use client';

import * as React from 'react';
import { DaySchedule, OpenShift, ShiftRegistration } from '@/types';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ShiftRegistrationViewProps {
  days: DaySchedule[];
  selectedDateKey: string;
  openShifts: OpenShift[];
  selectedShiftId: string;
  note: string;
  submitting: boolean;
  successReg: ShiftRegistration | null;
  cancelled: boolean;
  error: string | null;
  onBackToSchedule: () => void;
  onChangeDate: (dateKey: string) => void;
  onSelectShift: (shiftId: string) => void;
  onChangeNote: (note: string) => void;
  onSubmit: () => void;
  onCancelRegistration: (registrationId: string) => void;
  onResetForm: () => void;
}

export function ShiftRegistrationView({
  days,
  selectedDateKey,
  openShifts,
  selectedShiftId,
  note,
  submitting,
  successReg,
  cancelled,
  error,
  onBackToSchedule,
  onChangeDate,
  onSelectShift,
  onChangeNote,
  onSubmit,
  onCancelRegistration,
  onResetForm,
}: ShiftRegistrationViewProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBackToSchedule}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Lịch ca</span>
      </button>

      {!successReg && !cancelled && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-[#2B2118]">Đăng ký ca</h1>
            <p className="text-xs text-[#7A6A58] mt-0.5">
              Chọn ngày và ca muốn đăng ký — luôn cần quản lý duyệt
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn ngày qua danh sách chip cuộn */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
              Chọn ngày muốn đăng ký
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((day) => {
                const isSelected = day.dateKey === selectedDateKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => onChangeDate(day.dateKey)}
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
            {openShifts.length === 0 ? (
              <div className="p-4 bg-white border border-[#E9E4DC] rounded-lg text-center text-sm text-[#7A6A58]">
                Không có ca khả dụng vào ngày đã chọn.
              </div>
            ) : (
              <div className="space-y-2">
                {openShifts.map((shift) => {
                  const isFull = shift.slotsTaken >= shift.slotsTotal;
                  const isSelected = shift.id === selectedShiftId;

                  return (
                    <div
                      key={shift.id}
                      onClick={() => {
                        if (!isFull) onSelectShift(shift.id);
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
                        onChange={() => onSelectShift(shift.id)}
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
              value={note}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Ví dụ: Chỉ làm được đến 21:00"
              className="w-full p-3 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[80px]"
            />
          </div>

          {/* Nút gửi */}
          <button
            type="button"
            disabled={!selectedShiftId || submitting}
            onClick={onSubmit}
            className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
          >
            {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
          </button>
          <p className="text-xs text-[#7A6A58] text-center">
            Đăng ký xong sẽ chuyển sang trạng thái chờ duyệt — quản lý duyệt thì ca mới hiện
            trong lịch của bạn.
          </p>
        </div>
      )}

      {/* Màn hình thành công B7 */}
      {successReg && !cancelled && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#E9E4DC] p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#8C1D2C] mx-auto" />
            <h2 className="text-lg font-bold text-[#2B2118]">Đã gửi đăng ký</h2>
            <p className="text-sm text-[#7A6A58]">Ngày {successReg.dateKey}</p>
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
              onClick={onBackToSchedule}
              className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
            >
              Xem lịch ca
            </button>
            <button
              type="button"
              onClick={() => onCancelRegistration(successReg.id)}
              className="w-full py-3 bg-white border border-[#E9E4DC] hover:border-[#D14B3A] text-[#D14B3A] font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
            >
              Hủy đăng ký
            </button>
            <button
              type="button"
              onClick={onResetForm}
              className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
            >
              Đăng ký ca khác
            </button>
          </div>
        </div>
      )}

      {/* Màn hình đã hủy B7 */}
      {cancelled && (
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
              onClick={onBackToSchedule}
              className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
            >
              Xem lịch ca
            </button>
            <button
              type="button"
              onClick={onResetForm}
              className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
            >
              Đăng ký ca khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
