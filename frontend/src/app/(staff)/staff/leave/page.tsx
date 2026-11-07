'use client';

import * as React from 'react';
import Link from 'next/link';
import { staffService } from '@/services/mock/mockStaffService';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/types';
import { parseDateKey } from '@/lib/dateKey';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react';

export default function LeavePage() {
  // Navigation / Views: 'B9' (Danh sách đơn) | 'B10' (Form xin nghỉ)
  const [view, setView] = React.useState<'B9' | 'B10'>('B9');

  // B9 states
  const [balance, setBalance] = React.useState<LeaveBalance | null>(null);
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [filter, setFilter] = React.useState<LeaveStatus | 'ALL'>('ALL');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // B10 Form states (3 bước)
  const [selectedType, setSelectedType] = React.useState<LeaveType | null>(null);
  const [startDate, setStartDate] = React.useState<string>('2026-11-16');
  const [endDate, setEndDate] = React.useState<string>('2026-11-17');
  const [reason, setReason] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successReq, setSuccessReq] = React.useState<LeaveRequest | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [b, reqs] = await Promise.all([
        staffService.getLeaveBalance(),
        staffService.getLeaveRequests(),
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

  const handleOpenForm = () => {
    setView('B10');
    setSelectedType(null); // Không chọn sẵn theo quyết định locked
    setStartDate('2026-11-16');
    setEndDate('2026-11-17');
    setReason('');
    setFormError(null);
    setSuccessReq(null);
  };

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
      const newReq = await staffService.createLeaveRequest({
        type: selectedType,
        startDate,
        endDate,
        reason: reason.trim(),
        idempotencyKey: `leave-${Date.now()}`,
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
      await staffService.withdrawLeaveRequest({ id });
      loadData();
    } catch (err) {
      alert((err as Error).message || 'Không thể rút đơn xin nghỉ');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const getTypeName = (type: LeaveType) => {
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
  };

  const getStatusBadge = (status: LeaveStatus) => {
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
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      {/* ===================== B9: DANH SÁCH ĐƠN NGHỈ ===================== */}
      {view === 'B9' && (
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

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#2B2118]">Đơn xin nghỉ</h1>
              <p className="text-xs text-[#7A6A58] mt-0.5">Đơn của bạn và trạng thái duyệt</p>
            </div>
            <button
              type="button"
              onClick={handleOpenForm}
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
                onClick={() => setFilter(f.id as LeaveStatus | 'ALL')}
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
                onClick={handleOpenForm}
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
                    <span className="font-bold text-sm text-[#2B2118]">{getTypeName(req.type)}</span>
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
                        onClick={() => handleWithdraw(req.id)}
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
      )}

      {/* ===================== B10: FORM XIN NGHỈ (3 BƯỚC) ===================== */}
      {view === 'B10' && (
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
          <button
            type="button"
            onClick={() => setView('B9')}
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
                        onClick={() => {
                          setSelectedType(item.id);
                          setFormError(null);
                        }}
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
                          onChange={() => setSelectedType(item.id)}
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
                      onChange={(e) => setStartDate(e.target.value)}
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
                      onChange={(e) => setEndDate(e.target.value)}
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
                  onChange={(e) => setReason(e.target.value)}
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
                onClick={handleSubmitLeave}
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
                  {getTypeName(successReq.type)} · {successReq.startDate} – {successReq.endDate} ·{' '}
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
                  onClick={() => setView('B9')}
                  className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
                >
                  Xem danh sách đơn
                </button>
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Xin nghỉ thêm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
