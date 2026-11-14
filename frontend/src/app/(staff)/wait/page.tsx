'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePosStore } from '@/stores/usePosStore';
import { staffService } from '@/services/mock/mockStaffService';
import { kdsService } from '@/services/mock/mockKdsService';
import { Shift, Payslip, TipRecord, LeaveBalance, Ticket } from '@/types';
import {
  Check,
  RefreshCw,
} from 'lucide-react';
import { StaffHomeShell } from '@/components/staff/StaffHomeShell';
import { QuickActions, CHEF_QUICK_ACTIONS } from '@/components/staff/QuickActions';
import {
  AllergyWarningSection,
  SalaryLeaveGridSection,
  AnnouncementsSection,
} from '@/components/staff/StaffHomeSections';

export default function WaiterHomePage() {
  const staffUser = useAuthStore((s) => s.staffUser);
  const tables = usePosStore((s) => s.tables);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể nạp dữ liệu trang phục vụ');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Suy ra các số liệu của ca hôm nay
  const currentShift = shifts[0] || null;
  const nextShift = shifts[1] || null;

  // Lương & Tip
  const t11Payslip = payslips.find((p) => p.month === '2026-11') || payslips[0];
  const t11TipTotal = tips.reduce((sum, t) => sum + t.allocatedAmount, 0);

  // Cảnh báo dị ứng: lọc các ticket có món dị ứng
  const allergyTickets = React.useMemo(() => {
    return tickets.filter(
      (t) =>
        t.status !== 'SERVED' &&
        t.status !== 'REJECTED' &&
        t.items.some(
          (i) =>
            i.allergy?.toLowerCase().includes('đậu phộng') ||
            i.allergy?.toLowerCase().includes('peanut')
        )
    );
  }, [tickets]);

  // Tính 3 metrics nghiệp vụ phục vụ:
  // 1. Số bàn đang phục vụ: các bàn có trạng thái OCCUPIED hoặc OVERDUE
  const servingTablesCount = React.useMemo(() => {
    return tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'OVERDUE').length;
  }, [tables]);

  // 2. Món chờ giao: các items trong active ticket có trạng thái READY
  const itemsWaitingDeliveryCount = React.useMemo(() => {
    return tickets
      .filter((t) => t.status !== 'SERVED' && t.status !== 'REJECTED')
      .flatMap((t) => t.items)
      .filter((item) => item.status === 'READY').length;
  }, [tickets]);

  // 3. Món đã giao: các items có trạng thái SERVED
  const itemsDeliveredCount = React.useMemo(() => {
    return tickets
      .flatMap((t) => t.items)
      .filter((item) => item.status === 'SERVED').length;
  }, [tickets]);

  const now = Date.now();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-ops-brand" />
        <p className="text-sm text-muted">Đang tải dữ liệu trang Phục vụ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-3">
        <p className="text-sm font-semibold text-danger-700">{error}</p>
        <button
          onClick={loadData}
          type="button"
          className="px-4 py-2 bg-ops-brand text-white rounded-lg text-sm font-bold shadow-xs hover:bg-neutral-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Thẻ nghiệp vụ "Bàn đang phục vụ" (roleCard)
  const roleCard = (
    <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Bàn đang phục vụ</h2>
          <p className="text-sm text-muted">Bàn bạn phụ trách lúc này</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center my-4">
        <div className="p-3 bg-neutral-50 rounded-xl border border-sand-200">
          <div className="ops-nums text-2xl font-black text-ink">{servingTablesCount}</div>
          <div className="text-xs text-muted mt-0.5">Bàn phục vụ</div>
        </div>
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
          <div className="ops-nums text-2xl font-black text-emerald-700">{itemsWaitingDeliveryCount}</div>
          <div className="text-xs text-emerald-800 font-medium mt-0.5">Chờ giao</div>
        </div>
        <div className="p-3 bg-neutral-50 rounded-xl border border-sand-200">
          <div className="ops-nums text-2xl font-black text-muted">{itemsDeliveredCount}</div>
          <div className="text-xs text-muted mt-0.5">Đã giao</div>
        </div>
      </div>

      <Link
        href="/wait"
        className="w-full min-h-[48px] rounded-lg bg-ops-brand hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center transition-colors shadow-xs active:scale-98"
      >
        Vào danh sách bàn
      </Link>
    </section>
  );

  const extraSections = (
    <>
      {/* 3. Khu vực cảnh báo dị ứng */}
      <AllergyWarningSection allergyTickets={allergyTickets} now={now} />

      {/* 4. Thao tác nhanh (Chỉ hiện trên laptop/tablet, mobile đã có FAB) */}
      <div className="hidden md:block">
        <QuickActions
          title="Thao tác nhanh"
          subtitle="4 chức năng thường dùng"
          actions={CHEF_QUICK_ACTIONS}
        />
      </div>

      {/* 5 & 6. Lương & Quỹ phép grid */}
      <SalaryLeaveGridSection
        t11Payslip={t11Payslip}
        t11TipTotal={t11TipTotal}
        leaveBalance={leaveBalance}
      />

      {/* 7. Thông báo */}
      <AnnouncementsSection />
    </>
  );

  return (
    <StaffHomeShell
      userName={staffUser?.fullName || 'Phục vụ'}
      roleChip={
        <span className="inline-block px-2.5 py-1 rounded bg-white border border-sand-200 text-xs font-bold text-ink shadow-xs">
          Phục vụ bàn
        </span>
      }
      subtitle={<p className="ops-nums text-xs text-muted">Thứ Năm, 05/11/2026</p>}
      shift={{
        title: 'Ca hôm nay',
        subtitle: currentShift ? `Ca sáng · ${currentShift.zone}` : 'Hôm nay không có ca',
        startTime: currentShift ? currentShift.startTime : '—',
        endTime: currentShift ? currentShift.endTime : '—',
        area: currentShift?.zone || 'Tầng 1 - Khu A',
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
