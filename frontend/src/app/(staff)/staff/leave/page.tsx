'use client';

import * as React from 'react';
import { staffLeavePayrollService } from '@/services/staffLeavePayrollService';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/types';
import { addDays, parseDateKey } from '@/lib/dateKey';
import { formatIsoDate, generateIdempotencyKey } from '@/lib/utils';
import { LeaveListView } from '@/components/staff/leave/LeaveListView';
import { LeaveFormView } from '@/components/staff/leave/LeaveFormView';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function getDefaultDateRange(): { start: string; end: string } {
  const todayKey = formatIsoDate(new Date());
  return {
    start: todayKey,
    end: addDays(todayKey, 1),
  };
}

export default function LeavePage() {
  // Navigation / Views: 'B9' (Danh sách đơn) | 'B10' (Form xin nghỉ)
  const [view, setView] = React.useState<'B9' | 'B10'>('B9');

  // B9 states
  const [balance, setBalance] = React.useState<LeaveBalance | null>(null);
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [filter, setFilter] = React.useState<LeaveStatus | 'ALL'>('ALL');
  const [, setLoading] = React.useState<boolean>(true);
  const [, setError] = React.useState<string | null>(null);

  // Modal xác nhận rút đơn & Toast thông báo
  const [withdrawTargetId, setWithdrawTargetId] = React.useState<string | null>(null);
  const [withdrawing, setWithdrawing] = React.useState<boolean>(false);
  const [toast, setToast] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // B10 Form states (3 bước) — khởi tạo ngày mặc định theo ngày hiện tại
  const [selectedType, setSelectedType] = React.useState<LeaveType | null>(null);
  const [startDate, setStartDate] = React.useState<string>(() => getDefaultDateRange().start);
  const [endDate, setEndDate] = React.useState<string>(() => getDefaultDateRange().end);
  const [reason, setReason] = React.useState<string>('');
  const [leaveIdempotencyKey, setLeaveIdempotencyKey] = React.useState<string>(() =>
    generateIdempotencyKey()
  );
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successReq, setSuccessReq] = React.useState<LeaveRequest | null>(null);

  const showToast = React.useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [b, reqs] = await Promise.all([
        staffLeavePayrollService.getLeaveBalance(),
        staffLeavePayrollService.getLeaveRequests(),
      ]);
      setBalance(b);
      setRequests(reqs);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải thông tin đơn nghỉ');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Tính live calendarDays và affectedShifts
  const calculatedDays = React.useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    try {
      const s = parseDateKey(startDate);
      const e = parseDateKey(endDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  // Dự kiến quota sau duyệt (chỉ khi chọn ANNUAL)
  const quotaAfterApproval = React.useMemo(() => {
    if (!balance || selectedType !== 'ANNUAL') return null;
    return Math.max(0, balance.remainingDays - calculatedDays);
  }, [balance, selectedType, calculatedDays]);

  // Mở form B10: sinh idempotencyKey 1 lần cho phiên thao tác
  const handleOpenForm = () => {
    const defaults = getDefaultDateRange();
    setView('B10');
    setSelectedType(null);
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setReason('');
    setFormError(null);
    setSuccessReq(null);
    setLeaveIdempotencyKey(generateIdempotencyKey());
  };

  const handleSelectType = (type: LeaveType) => {
    setSelectedType((prev) => {
      if (prev !== type) {
        setLeaveIdempotencyKey(generateIdempotencyKey());
      }
      return type;
    });
    setFormError(null);
  };

  const handleChangeStartDate = (newStart: string) => {
    setStartDate(newStart);
    setLeaveIdempotencyKey(generateIdempotencyKey());
  };

  const handleChangeEndDate = (newEnd: string) => {
    setEndDate(newEnd);
    setLeaveIdempotencyKey(generateIdempotencyKey());
  };

  // Gửi đơn xin nghỉ: dùng lại leaveIdempotencyKey cho mọi lần retry của cùng 1 thao tác
  const handleSubmitLeave = async () => {
    if (!selectedType) {
      setFormError('Vui lòng chọn loại nghỉ để tiếp tục.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Vui lòng chọn ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (endDate < startDate) {
      setFormError('Ngày kết thúc không được trước ngày bắt đầu.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Vui lòng nhập lý do xin nghỉ.');
      return;
    }
    if (selectedType === 'ANNUAL' && balance && calculatedDays > balance.remainingDays) {
      setFormError(
        `Số ngày nghỉ (${calculatedDays} ngày) vượt quá quỹ phép năm còn lại (${balance.remainingDays} ngày).`
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const newReq = await staffLeavePayrollService.createLeaveRequest({
        type: selectedType,
        startDate,
        endDate,
        reason: reason.trim(),
        idempotencyKey: leaveIdempotencyKey,
      });
      setSuccessReq(newReq);
      loadData();
    } catch (err) {
      setFormError((err as Error).message || 'Không thể gửi đơn xin nghỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestWithdraw = (id: string) => {
    setWithdrawTargetId(id);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawTargetId || withdrawing) return;
    setWithdrawing(true);
    try {
      await staffLeavePayrollService.withdrawLeaveRequest({ id: withdrawTargetId });
      setWithdrawTargetId(null);
      showToast('success', 'Đã rút đơn xin nghỉ thành công.');
      loadData();
    } catch (err) {
      setWithdrawTargetId(null);
      showToast('error', (err as Error).message || 'Không thể rút đơn xin nghỉ.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Toast thông báo chuẩn UI */}
        {toast && (
          <div
            role="status"
            className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 shadow-xs ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-[#D14B3A]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#D14B3A] shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {view === 'B9' && (
          <LeaveListView
            balance={balance}
            requests={requests}
            filter={filter}
            onChangeFilter={setFilter}
            onOpenForm={handleOpenForm}
            onWithdraw={handleRequestWithdraw}
          />
        )}

        {view === 'B10' && (
          <LeaveFormView
            balance={balance}
            selectedType={selectedType}
            startDate={startDate}
            endDate={endDate}
            reason={reason}
            calculatedDays={calculatedDays}
            quotaAfterApproval={quotaAfterApproval}
            submitting={submitting}
            formError={formError}
            successReq={successReq}
            onBackToList={() => setView('B9')}
            onSelectType={handleSelectType}
            onChangeStartDate={handleChangeStartDate}
            onChangeEndDate={handleChangeEndDate}
            onChangeReason={setReason}
            onSubmit={handleSubmitLeave}
            onResetForm={handleOpenForm}
          />
        )}

        {/* Modal xác nhận rút đơn chuẩn UI (thay thế confirm/alert trình duyệt) */}
        {withdrawTargetId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <div className="w-full max-w-sm rounded-xl bg-white border border-[#E9E4DC] p-5 shadow-lg space-y-4">
              <div>
                <h2 id="withdraw-modal-title" className="text-base font-bold text-[#2B2118]">
                  Xác nhận rút đơn xin nghỉ
                </h2>
                <p className="text-xs text-[#7A6A58] mt-1">
                  Bạn có chắc chắn muốn rút đơn xin nghỉ này? Đơn sau khi rút sẽ chuyển sang trạng
                  thái Đã rút đơn.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={withdrawing}
                  onClick={() => setWithdrawTargetId(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E9E4DC] bg-white text-[#2B2118] hover:bg-[#F6F4F0] min-h-[44px]"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={withdrawing}
                  onClick={handleConfirmWithdraw}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#D14B3A] hover:bg-red-700 text-white min-h-[44px] disabled:opacity-50"
                >
                  {withdrawing ? 'Đang rút...' : 'Xác nhận rút đơn'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
