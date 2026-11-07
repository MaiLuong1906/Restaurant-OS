'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { staffService } from '@/services/mock/mockStaffService';
import { kdsService } from '@/services/mock/mockKdsService';
import { Shift, Payslip, TipRecord, LeaveBalance, Ticket } from '@/types';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  Check,
  ChevronRight,
  Flame,
  User,
  Home,
  RefreshCw,
} from 'lucide-react';

export default function StaffHomePage() {
  const staffUser = useAuthStore((s) => s.staffUser);

  // States dữ liệu
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [tips, setTips] = React.useState<TipRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance | null>(null);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const isChef = React.useMemo(() => {
    if (!staffUser) return true; // Default view hiển thị bếp nếu chưa đăng nhập
    return staffUser.role === 'CHEF' || staffUser.role === 'MANAGER';
  }, [staffUser]);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [shiftsData, payslipsData, tipsData, leaveData, ticketsData] = await Promise.all([
        staffService.getMySchedule(),
        staffService.getPayslips(),
        staffService.getTips(),
        staffService.getLeaveBalance(),
        kdsService.getTickets(),
      ]);
      setShifts(shiftsData);
      setPayslips(payslipsData);
      setTips(tipsData);
      setLeaveBalance(leaveData);
      setTickets(ticketsData);
    } catch (err) {
      setError((err as Error).message || 'Không thể nạp dữ liệu bảng tin nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Ca làm việc hôm nay
  const currentShift = shifts[0] || null;
  const nextShift = shifts[1] || null;

  // Số liệu KDS
  const waitingTickets = tickets.filter((t) => t.status === 'WAITING' || t.status === 'READY');
  const now = Date.now();
  const overdueTickets = waitingTickets.filter(
    (t) => t.slaDeadline && new Date(t.slaDeadline).getTime() < now
  );
  const totalPortions = waitingTickets.reduce(
    (sum, t) => sum + t.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  // 3 ticket dị ứng đậu phộng (Bàn 04, 07, 08)
  const allergyTickets = waitingTickets.filter((t) =>
    t.items.some((i) => i.allergy?.toLowerCase().includes('đậu phộng') || i.allergy?.toLowerCase().includes('peanut'))
  );

  // Số liệu lương & tip tháng 11
  const t11Payslip = payslips.find((p) => p.month === '2026-11') || payslips[0];
  const t11TipTotal = tips.reduce((sum, t) => sum + t.allocatedAmount, 0);

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  return (
    <div className="w-full max-w-[480px] md:max-w-4xl mx-auto px-4 py-4">
      {/* Header Lời chào & vai trò */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2B2118]">
            Xin chào, {staffUser?.fullName || 'Đầu bếp'}
          </h1>
          <p className="text-xs text-ops-muted mt-0.5">Thứ Năm, 05/11/2026</p>
          <span className="inline-block mt-2 px-2.5 py-1 rounded bg-white border border-ops-border text-xs font-bold text-[#2B2118] shadow-xs">
            {staffUser?.role === 'CHEF'
              ? 'Đầu bếp · Bếp chính'
              : staffUser?.role === 'MANAGER'
              ? 'Quản lý · Nhà hàng'
              : 'Nhân viên vận hành'}
          </span>
        </div>
      </div>

      {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-ops-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-ops-brand" />
            <p className="text-sm font-semibold">Đang nạp dữ liệu bảng tin...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center my-6">
            <p className="text-sm font-semibold mb-3">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 bg-ops-brand text-white font-bold rounded-lg text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Thẻ ca hôm nay */}
            <section className="bg-white border border-ops-border rounded-lg p-5 shadow-warm">
              <h2 className="text-base font-bold text-[#2B2118]">Ca hôm nay</h2>
              <p className="text-xs text-ops-muted mb-3">
                {currentShift ? `Ca sáng · ${currentShift.zone}` : 'Hôm nay không có ca'}
              </p>
              <div className="space-y-2 text-sm border-t border-dashed border-ops-border pt-3">
                <div className="flex justify-between">
                  <span className="text-ops-muted">Giờ ca</span>
                  <b className="text-ops-ink">
                    {currentShift ? `${currentShift.startTime} – ${currentShift.endTime}` : '—'}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-ops-muted">Khu vực</span>
                  <b className="text-ops-ink">{currentShift?.zone || 'Bếp chính'}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-ops-muted">Ca tiếp theo</span>
                  <span className="text-ops-muted">
                    {nextShift ? `Thứ Sáu · ${nextShift.startTime} – ${nextShift.endTime}` : 'Chưa xếp'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-ops-brand">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Đã vào ca lúc 07:58</span>
              </div>
            </section>

            {/* 2. Thẻ KDS (cho role bếp) */}
            {isChef && (
              <section className="bg-white border border-ops-border rounded-lg p-5 shadow-warm flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#2B2118]">Bếp — KDS</h2>
                  <p className="text-xs text-ops-muted mb-3">Hàng đợi lúc này</p>
                  <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-dashed border-ops-border">
                    <div>
                      <b className="text-2xl font-black text-ops-ink">{waitingTickets.length}</b>
                      <span className="block text-[11px] text-ops-muted mt-0.5">Ticket chờ</span>
                    </div>
                    <div>
                      <b className="text-2xl font-black text-danger-600">{overdueTickets.length}</b>
                      <span className="block text-[11px] text-danger-700 font-bold mt-0.5">Quá SLA</span>
                    </div>
                    <div>
                      <b className="text-2xl font-black text-ops-ink">{totalPortions}</b>
                      <span className="block text-[11px] text-ops-muted mt-0.5">Món cần làm</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/kds"
                  className="mt-4 w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-sm flex items-center justify-center transition-transform"
                >
                  Vào bếp
                </Link>
              </section>
            )}

            {/* 3. Khu vực cảnh báo dị ứng riêng (span 2 cột trên laptop) */}
            <section className="md:col-span-2 bg-white border border-ops-border rounded-lg p-5 shadow-warm">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-5 w-5 text-danger-600 shrink-0" />
                <h2 className="text-base font-bold text-[#2B2118]">Cảnh báo cần chú ý</h2>
              </div>
              <p className="text-xs text-ops-muted mb-3">
                3 ticket dị ứng đậu phộng đang chờ xử lý — xem rõ từng ticket, bấm để sang đúng ngữ cảnh ở KDS.
              </p>
              <div className="divide-y divide-ops-border border-t border-ops-border">
                {allergyTickets.length > 0 ? (
                  allergyTickets.map((t) => (
                    <div key={t.id} className="py-2.5 flex justify-between items-center text-sm">
                      <span className="font-semibold text-ops-ink">
                        {t.tableNo} &bull; {t.items.map((i) => `${i.dishName} ×${i.quantity}`).join(', ')}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          t.slaDeadline && new Date(t.slaDeadline).getTime() < now
                            ? 'bg-red-50 text-danger-700 border border-red-200'
                            : 'bg-neutral-100 text-ops-muted'
                        }`}
                      >
                        {t.slaDeadline && new Date(t.slaDeadline).getTime() < now ? 'Quá SLA' : 'Trong hạn'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-2.5 text-xs text-ops-muted italic">
                    Không có cảnh báo dị ứng nào đang chờ
                  </div>
                )}
              </div>
              <Link
                href="/kds"
                className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-ops-brand hover:underline"
              >
                <span>Xem ở KDS</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </section>

            {/* 4. Thao tác nhanh (4 nút min-h-[76px]) */}
            <section className="md:col-span-2 bg-white border border-ops-border rounded-lg p-5 shadow-warm">
              <h2 className="text-base font-bold text-[#2B2118]">Thao tác nhanh</h2>
              <p className="text-xs text-ops-muted mb-3">4 chức năng thường dùng</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link
                  href="/staff/attendance"
                  className="min-h-[76px] p-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-50 active:scale-98 flex flex-col items-center justify-center gap-1 text-center shadow-xs transition-transform"
                >
                  <Clock className="h-5 w-5 text-ops-brand" />
                  <span className="text-sm font-bold text-[#2B2118]">Chấm công</span>
                  <span className="text-[11px] text-ops-muted">Vào / ra ca</span>
                </Link>

                <Link
                  href="/staff/schedule"
                  className="min-h-[76px] p-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-50 active:scale-98 flex flex-col items-center justify-center gap-1 text-center shadow-xs transition-transform"
                >
                  <Calendar className="h-5 w-5 text-ops-brand" />
                  <span className="text-sm font-bold text-[#2B2118]">Lịch ca</span>
                  <span className="text-[11px] text-ops-muted">Ca tuần này</span>
                </Link>

                <Link
                  href="/staff/leave"
                  className="min-h-[76px] p-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-50 active:scale-98 flex flex-col items-center justify-center gap-1 text-center shadow-xs transition-transform"
                >
                  <FileText className="h-5 w-5 text-ops-brand" />
                  <span className="text-sm font-bold text-[#2B2118]">Xin nghỉ</span>
                  <span className="text-[11px] text-ops-muted">Đơn &amp; quỹ phép</span>
                </Link>

                <Link
                  href="/staff/payslip"
                  className="min-h-[76px] p-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-50 active:scale-98 flex flex-col items-center justify-center gap-1 text-center shadow-xs transition-transform"
                >
                  <DollarSign className="h-5 w-5 text-ops-brand" />
                  <span className="text-sm font-bold text-[#2B2118]">Lương &amp; Tip</span>
                  <span className="text-[11px] text-ops-muted">Phiếu tháng này</span>
                </Link>
              </div>
            </section>

            {/* 5. Tóm tắt lương */}
            <section className="bg-white border border-ops-border rounded-lg p-5 shadow-warm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-[#2B2118]">Lương tháng 11</h2>
                <div className="text-2xl font-black text-ops-brand mt-1">
                  {formatVnd(t11Payslip?.netSalary || 4250000)}
                </div>
                <p className="text-xs text-ops-muted mt-1">
                  Tip tháng 11: {formatVnd(t11TipTotal || 320000)} &bull; Tính đến 05/11
                </p>
              </div>
              <Link
                href="/staff/payslip"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-ops-brand hover:underline"
              >
                <span>Xem phiếu lương</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </section>

            {/* 6. Quỹ phép */}
            <section className="bg-white border border-ops-border rounded-lg p-5 shadow-warm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-[#2B2118]">Quỹ phép</h2>
                <div className="text-2xl font-black text-ops-brand mt-1">
                  Còn {leaveBalance?.remainingDays || 6} ngày
                </div>
                <p className="text-xs text-ops-muted mt-1">
                  {leaveBalance?.pendingRequestsCount || 2} đơn đang chờ duyệt
                </p>
              </div>
              <Link
                href="/staff/leave"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-ops-brand hover:underline"
              >
                <span>Xem đơn nghỉ</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </section>

            {/* 7. Thông báo */}
            <section className="md:col-span-2 bg-white border border-ops-border rounded-lg p-5 shadow-warm">
              <h2 className="text-base font-bold text-[#2B2118] mb-3">Thông báo</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5 pb-2.5 border-b border-ops-border">
                  <span className="w-2 h-2 rounded-full bg-danger-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-ops-ink font-medium">
                      Lịch tuần sau đã đăng &mdash;{' '}
                      <Link href="/staff/schedule" className="font-bold text-ops-brand hover:underline">
                        xem Lịch ca
                      </Link>{' '}
                      <span className="text-[11px] font-bold text-danger-700 bg-danger-50 px-1.5 py-0.5 rounded border border-danger-200">
                        Cần xem
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-ops-ink font-medium">
                      Đơn xin nghỉ ngày 12/11 đã được duyệt &mdash;{' '}
                      <Link href="/staff/leave" className="font-bold text-ops-brand hover:underline">
                        xem Đơn nghỉ
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}
