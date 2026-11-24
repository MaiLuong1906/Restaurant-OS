'use client';

import * as React from 'react';
import { staffLeavePayrollService } from '@/services/staffLeavePayrollService';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/types';
import { parseDateKey } from '@/lib/dateKey';
import { generateIdempotencyKey } from '@/lib/utils';
import { LeaveListView } from '@/components/staff/leave/LeaveListView';
import { LeaveFormView } from '@/components/staff/leave/LeaveFormView';

export default function LeavePage() {
  // Navigation / Views: 'B9' (Danh sách đơn) | 'B10' (Form xin nghỉ)
  const [view, setView] = React.useState<'B9' | 'B10'>('B9');

  // B9 states
  const [balance, setBalance] = React.useState<LeaveBalance | null>(null);
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [filter, setFilter] = React.useState<LeaveStatus | 'ALL'>('ALL');
  const [, setLoading] = React.useState<boolean>(true);
  const [, setError] = React.useState<string | null>(null);

  // B10 Form states (3 bước)
  const [selectedType, setSelectedType] = React.useState<LeaveType | null>(null);
  const [startDate, setStartDate] = React.useState<string>('2026-11-16');
  const [endDate, setEndDate] = React.useState<string>('2026-11-17');
  const [reason, setReason] = React.useState<string>('');
  const [leaveIdempotencyKey, setLeaveIdempotencyKey] = React.useState<string>(() =>
    generateIdempotencyKey()
  );
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successReq, setSuccessReq] = React.useState<LeaveRequest | null>(null);

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
    setView('B10');
    setSelectedType(null);
    setStartDate('2026-11-16');
    setEndDate('2026-11-17');
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

  const handleWithdraw = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn rút đơn xin nghỉ này?')) return;
    try {
      await staffLeavePayrollService.withdrawLeaveRequest({ id });
      loadData();
    } catch (err) {
      alert((err as Error).message || 'Không thể rút đơn xin nghỉ');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {view === 'B9' && (
          <LeaveListView
            balance={balance}
            requests={requests}
            filter={filter}
            onChangeFilter={setFilter}
            onOpenForm={handleOpenForm}
            onWithdraw={handleWithdraw}
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
      </div>
    </div>
  );
}
