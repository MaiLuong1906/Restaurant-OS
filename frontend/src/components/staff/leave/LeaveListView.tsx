'use client';

import * as React from 'react';
import { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from '@/types';

export interface LeaveListViewProps {
  balance: LeaveBalance | null;
  requests: LeaveRequest[];
  filter: LeaveStatus | 'ALL';
  onChangeFilter: (filter: LeaveStatus | 'ALL') => void;
  onOpenForm: () => void;
  onWithdraw: (id: string) => void;
}

export function getLeaveTypeName(type: LeaveType): string {
  switch (type) {
    case 'ANNUAL':
      return 'Phép năm';
    case 'SICK':
      return 'Nghỉ ốm';
    case 'UNPAID':
      return 'Việc riêng';
    default:
      return type;
  }
}

function getStatusBadge(status: LeaveStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
          Chờ duyệt
        </span>
      );
    case 'APPROVED':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
          Đã duyệt
        </span>
      );
    case 'REJECTED':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-[#D14B3A] rounded-full">
          Từ chối
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-[#7A6A58] rounded-full">
          Đã rút đơn
        </span>
      );
  }
}

export function LeaveListView({
  balance,
  requests,
  filter,
  onChangeFilter,
  onOpenForm,
  onWithdraw,
}: LeaveListViewProps) {
  const filteredRequests = React.useMemo(
    () =>
      requests.filter((r) => {
        if (filter === 'ALL') return true;
        return r.status === filter;
      }),
    [requests, filter]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2B2118]">Đơn xin nghỉ</h1>
          <p className="text-xs text-[#7A6A58] mt-0.5">Đơn của bạn và trạng thái duyệt</p>
        </div>
        <button
          type="button"
          onClick={onOpenForm}
          className="px-4 py-2 bg-[#8C1D2C] hover:bg-[#6F1623] text-white text-sm font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
        >
          Xin nghỉ mới
        </button>
      </div>

      {/* Quỹ phép năm card */}
      <div className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-[#2B2118]">Quỹ phép năm 2026</h2>
        <div className="text-2xl font-bold text-[#8C1D2C] mt-1">
          Còn {balance ? balance.remainingDays : '—'} ngày
        </div>
        <p className="text-xs text-[#7A6A58] mt-1">
          {balance
            ? `Đã dùng ${balance.usedDays} / ${balance.totalDays} ngày · ${balance.pendingRequestsCount} đơn đang chờ duyệt`
            : 'Đang tải...'}
        </p>
      </div>

      {/* Thanh lọc trạng thái */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'PENDING', label: 'Chờ duyệt' },
          { id: 'APPROVED', label: 'Đã duyệt' },
          { id: 'REJECTED', label: 'Từ chối' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChangeFilter(f.id as LeaveStatus | 'ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[40px] shrink-0 border transition-all ${
              filter === f.id
                ? 'bg-[#8C1D2C] text-white border-[#8C1D2C]'
                : 'bg-white text-[#2B2118] border-[#E9E4DC] hover:border-[#8C1D2C]/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E9E4DC] p-8 text-center space-y-3">
          <h2 className="text-base font-bold text-[#2B2118]">Bạn chưa có đơn xin nghỉ nào</h2>
          <p className="text-xs text-[#7A6A58]">
            Gửi đơn mới khi cần nghỉ phép, nghỉ ốm hoặc việc riêng.
          </p>
          <button
            type="button"
            onClick={onOpenForm}
            className="px-4 py-2 bg-[#8C1D2C] hover:bg-[#6F1623] text-white text-sm font-semibold rounded-lg min-h-[48px] transition-colors"
          >
            Xin nghỉ mới
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-lg border border-[#E9E4DC] p-4 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#2B2118]">
                  {getLeaveTypeName(req.type)}
                </span>
                {getStatusBadge(req.status)}
              </div>
              <div className="text-xs text-[#7A6A58]">
                {req.startDate} {req.startDate !== req.endDate ? `– ${req.endDate}` : ''} ·{' '}
                {req.calendarDays || 1} ngày ({req.affectedShifts || 1} ca làm việc)
              </div>
              <div className="text-xs text-[#141210] bg-[#F6F4F0] p-2 rounded-md">
                Lý do: {req.reason}
              </div>
              {req.status === 'PENDING' && (
                <div className="pt-2 flex justify-end border-t border-[#F6F4F0]">
                  <button
                    type="button"
                    onClick={() => onWithdraw(req.id)}
                    className="text-xs font-semibold text-[#D14B3A] hover:underline min-h-[36px] flex items-center"
                  >
                    Rút đơn
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
