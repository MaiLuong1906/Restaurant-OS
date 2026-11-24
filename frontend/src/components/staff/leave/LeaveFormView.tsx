'use client';

import * as React from 'react';
import { LeaveBalance, LeaveRequest, LeaveType } from '@/types';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getLeaveTypeName } from './LeaveListView';

export interface LeaveFormViewProps {
  balance: LeaveBalance | null;
  selectedType: LeaveType | null;
  startDate: string;
  endDate: string;
  reason: string;
  calculatedDays: number;
  quotaAfterApproval: number | null;
  submitting: boolean;
  formError: string | null;
  successReq: LeaveRequest | null;
  onBackToList: () => void;
  onSelectType: (type: LeaveType) => void;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
  onChangeReason: (reason: string) => void;
  onSubmit: () => void;
  onResetForm: () => void;
}

export function LeaveFormView({
  balance,
  selectedType,
  startDate,
  endDate,
  reason,
  calculatedDays,
  quotaAfterApproval,
  submitting,
  formError,
  successReq,
  onBackToList,
  onSelectType,
  onChangeStartDate,
  onChangeEndDate,
  onChangeReason,
  onSubmit,
  onResetForm,
}: LeaveFormViewProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBackToList}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Danh sách đơn</span>
      </button>

      {!successReq ? (
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-[#2B2118]">Xin nghỉ mới</h1>
            <p className="text-xs text-[#7A6A58] mt-0.5">
              Gửi yêu cầu nghỉ để quản lý xem xét.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* BƯỚC 01: LOẠI NGHỈ */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#8C1D2C] uppercase tracking-wider">
              01 · Loại nghỉ
            </p>
            <p className="text-xs text-[#7A6A58]">
              Chọn hình thức nghỉ phù hợp với nhu cầu của bạn.
            </p>

            <div className="space-y-2">
              {[
                {
                  id: 'ANNUAL' as LeaveType,
                  title: 'Phép năm',
                  desc: 'Trừ vào quỹ phép năm hàng năm của bạn.',
                  quotaText: balance ? `Quỹ phép còn ${balance.remainingDays} ngày` : null,
                },
                {
                  id: 'SICK' as LeaveType,
                  title: 'Nghỉ ốm',
                  desc: 'Nghỉ dưỡng bệnh. Không trừ quỹ phép năm.',
                  quotaText: null,
                },
                {
                  id: 'UNPAID' as LeaveType,
                  title: 'Việc riêng',
                  desc: 'Nghỉ không lương giải quyết việc cá nhân.',
                  quotaText: null,
                },
              ].map((item) => {
                const isSelected = selectedType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectType(item.id)}
                    className={`p-3 rounded-lg border min-h-[64px] flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-50/60 border-[#8C1D2C]'
                        : 'bg-white border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[#2B2118]">{item.title}</div>
                      <div className="text-xs text-[#7A6A58] mt-0.5">{item.desc}</div>
                      {isSelected && item.quotaText && (
                        <div className="text-xs font-semibold text-[#8C1D2C] mt-1">
                          {item.quotaText}
                        </div>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="leave-type"
                      checked={isSelected}
                      onChange={() => onSelectType(item.id)}
                      className="w-4 h-4 accent-[#8C1D2C]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 02: THỜI GIAN NGHỈ */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#8C1D2C] uppercase tracking-wider">
              02 · Thời gian nghỉ
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onChangeStartDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A6A58] mb-1">
                  Tới ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onChangeEndDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
                />
              </div>
            </div>

            {/* Card tính toán số ngày / số ca */}
            <div className="bg-white rounded-lg border border-[#E9E4DC] p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7A6A58]">Số ngày nghỉ dự kiến</span>
                <span className="font-semibold text-[#141210]">{calculatedDays} ngày</span>
              </div>
              <div className="flex justify-between border-t border-[#F6F4F0] pt-1">
                <span className="text-[#7A6A58]">Số ca bị ảnh hưởng</span>
                <span className="font-semibold text-[#141210]">{calculatedDays} ca</span>
              </div>
              <div className="flex justify-between border-t border-[#F6F4F0] pt-1">
                <span className="text-[#7A6A58]">Quỹ phép sau khi được duyệt</span>
                <span className="font-semibold text-[#141210]">
                  {selectedType === 'ANNUAL'
                    ? `${quotaAfterApproval} ngày`
                    : 'Không trừ quỹ phép năm'}
                </span>
              </div>
            </div>
          </div>

          {/* BƯỚC 03: LÝ DO XIN NGHỈ */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#8C1D2C] uppercase tracking-wider">
              03 · Lý do xin nghỉ
            </p>
            <label className="block text-xs text-[#7A6A58]">
              Vui lòng mô tả ngắn gọn lý do xin nghỉ.
            </label>
            <textarea
              value={reason}
              maxLength={500}
              onChange={(e) => onChangeReason(e.target.value)}
              placeholder="Nhập lý do xin nghỉ của bạn..."
              className="w-full p-3 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[96px]"
            />
            <div className="flex justify-end text-[11px] text-[#7A6A58]">
              {reason.length} / 500
            </div>
          </div>

          {/* Nút gửi */}
          <button
            type="button"
            disabled={!selectedType || submitting}
            onClick={onSubmit}
            className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
          >
            {submitting ? 'Đang gửi...' : 'Gửi đơn xin nghỉ'}
          </button>
          <p className="text-xs text-[#7A6A58] text-center">
            Gửi xong đơn chuyển sang trạng thái chờ duyệt — quản lý duyệt thì quỹ phép mới trừ.
          </p>
        </div>
      ) : (
        /* Màn hình thành công B10 */
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#E9E4DC] p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#8C1D2C] mx-auto" />
            <h2 className="text-lg font-bold text-[#2B2118]">Đã gửi đơn xin nghỉ</h2>
            <p className="text-sm text-[#7A6A58]">
              {getLeaveTypeName(successReq.type)} · {successReq.startDate} – {successReq.endDate} ·{' '}
              {successReq.calendarDays} ngày · {successReq.affectedShifts} ca
            </p>
            <div>
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                Chờ duyệt
              </span>
            </div>
            <p className="text-xs text-[#7A6A58]">
              Đơn đã được chuyển đến quản lý để phê duyệt.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onBackToList}
              className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
            >
              Xem danh sách đơn
            </button>
            <button
              type="button"
              onClick={onResetForm}
              className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
            >
              Xin nghỉ thêm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
