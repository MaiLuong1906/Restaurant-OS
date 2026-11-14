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
  RefreshCw,
} from 'lucide-react';
import { StaffHomeShell } from '@/components/staff/StaffHomeShell';
import { QuickActions } from '@/components/staff/QuickActions';

export default function ChefHomePage() {
  const staffUser = useAuthStore((s) => s.staffUser);

  // States dữ liệu
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [tips, setTips] = React.useState<TipRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance | null>(null);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

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

  const roleLabel =
    staffUser?.role === 'CHEF'
      ? 'Đầu bếp · Bếp chính'
      : staffUser?.role === 'MANAGER'
      ? 'Quản lý · Nhà hàng'
      : 'Đầu bếp · Bếp chính';

  if (loading) {
    return (
      <div className="min-h-full bg-ops-bg w-full max-w-[480px] md:max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3 text-ops-muted">
        <RefreshCw className="h-8 w-8 animate-spin text-ops-brand" />
        <p className="text-sm font-semibold">Đang nạp dữ liệu bảng tin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-ops-bg w-full max-w-[480px] md:max-w-4xl mx-auto px-4 py-8">
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
      </div>
    );
  }

  const roleCard = (
    <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold text-ink">Bếp — KDS</h2>
        <p className="mt-0.5 text-sm text-muted">Hàng đợi lúc này</p>
        <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-dashed border-sand-200 my-4">
          <div>
            <b className="text-3xl font-extrabold text-ink">{waitingTickets.length}</b>
            <span className="block text-xs text-muted mt-1">Ticket chờ</span>
          </div>
          <div>
            <b className="text-3xl font-extrabold text-danger-600">{overdueTickets.length}</b>
            <span className="block text-xs text-danger-700 font-bold mt-1">Quá SLA</span>
          </div>
          <div>
            <b className="text-3xl font-extrabold text-ink">{totalPortions}</b>
            <span className="block text-xs text-muted mt-1">Món cần làm</span>
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
  );

  const extraSections = (
    <>
      {/* 3. Khu vực cảnh báo dị ứng riêng */}
      <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-danger-600 shrink-0" />
          <h2 className="text-lg font-bold text-ink">Cảnh báo cần chú ý</h2>
        </div>
        <p className="text-sm text-muted mb-3">
          3 ticket dị ứng đậu phộng đang chờ xử lý — xem rõ từng ticket, bấm để sang đúng ngữ cảnh ở KDS.
        </p>
        <div className="divide-y divide-sand-200/80 border-t border-sand-200/80">
          {allergyTickets.length > 0 ? (
            allergyTickets.map((t) => (
              <div key={t.id} className="py-2.5 flex justify-between items-center text-sm">
                <span className="font-semibold text-ink">
                  {t.tableNo} &bull; {t.items.map((i) => `${i.dishName} ×${i.quantity}`).join(', ')}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    t.slaDeadline && new Date(t.slaDeadline).getTime() < now
                      ? 'bg-red-50 text-danger-700 border border-red-200'
                      : 'bg-neutral-100 text-muted'
                  }`}
                >
                  {t.slaDeadline && new Date(t.slaDeadline).getTime() < now ? 'Quá SLA' : 'Trong hạn'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-2.5 text-xs text-muted italic">
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

      {/* 4. Thao tác nhanh (Chỉ hiện trên laptop/tablet, mobile đã có FAB) */}
      <div className="hidden md:block">
        <QuickActions
          title="Thao tác nhanh"
          subtitle="4 chức năng thường dùng"
          actions={[
            {
              icon: Clock,
              label: 'Chấm công',
              sub: 'Vào / ra ca',
              href: '/staff/attendance',
            },
            {
              icon: Calendar,
              label: 'Lịch ca',
              sub: 'Ca tuần này',
              href: '/staff/schedule',
            },
            {
              icon: FileText,
              label: 'Xin nghỉ',
              sub: 'Đơn & quỹ phép',
              href: '/staff/leave',
            },
            {
              icon: DollarSign,
              label: 'Lương & Tip',
              sub: 'Phiếu tháng này',
              href: '/staff/payslip',
            },
          ]}
        />
      </div>

      {/* 5 & 6. Lương & Quỹ phép grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 5. Tóm tắt lương */}
        <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Lương tháng 11</h2>
            <div className="text-2xl font-black text-ops-brand mt-1">
              {formatVnd(t11Payslip?.netSalary || 4250000)}
            </div>
            <p className="text-xs text-muted mt-1">
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
        <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Quỹ phép</h2>
            <div className="text-2xl font-black text-ops-brand mt-1">
              Còn {leaveBalance?.remainingDays || 6} ngày
            </div>
            <p className="text-xs text-muted mt-1">
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
      </div>

      {/* 7. Thông báo */}
      <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm">
        <h2 className="text-lg font-bold text-ink mb-3">Thông báo</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2.5 pb-2.5 border-b border-sand-200/80">
            <span className="w-2 h-2 rounded-full bg-danger-600 mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-ink font-medium">
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
              <p className="text-ink font-medium">
                Đơn xin nghỉ ngày 12/11 đã được duyệt &mdash;{' '}
                <Link href="/staff/leave" className="font-bold text-ops-brand hover:underline">
                  xem Đơn nghỉ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <StaffHomeShell
      userName={staffUser?.fullName || 'Đầu bếp'}
      roleChip={
        <span className="inline-block px-2.5 py-1 rounded bg-white border border-sand-200 text-xs font-bold text-ink shadow-xs">
          {roleLabel}
        </span>
      }
      subtitle={<p className="ops-nums text-xs text-muted">Thứ Năm, 05/11/2026</p>}
      shift={{
        title: 'Ca hôm nay',
        subtitle: currentShift ? `Ca sáng · ${currentShift.zone}` : 'Hôm nay không có ca',
        startTime: currentShift ? currentShift.startTime : '—',
        endTime: currentShift ? currentShift.endTime : '—',
        area: currentShift?.zone || 'Bếp chính',
        nextShift: nextShift ? `Thứ Sáu · ${nextShift.startTime} – ${nextShift.endTime}` : 'Chưa xếp',
        checkInStatus: (
          <div className="flex items-center gap-2 text-sm font-bold text-ops-brand">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Đã vào ca lúc 07:58</span>
          </div>
        ),
      }}
      roleCard={roleCard}
      extraSections={extraSections}
    />
  );
}
