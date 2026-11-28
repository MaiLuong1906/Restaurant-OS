'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { staffService } from '@/services/mock/mockStaffService';
import { Shift, Payslip, TipRecord, LeaveBalance, Ticket } from '@/types';
import {
  Check,
  RefreshCw,
} from 'lucide-react';
import { StaffHomeShell } from '@/components/staff/StaffHomeShell';
import { QuickActions, WAITER_QUICK_ACTIONS } from '@/components/staff/QuickActions';
import {
  AllergyWarningSection,
  SalaryLeaveGridSection,
  AnnouncementsSection,
} from '@/components/staff/StaffHomeSections';

export default function WaiterHomePage() {
  const staffUser = useAuthStore((s) => s.staffUser);
  const waiterTablesMap = useWaiterStore((s) => s.tables);
  const syncFromBackend = useWaiterStore((s) => s.syncFromBackend);

  // States dữ liệu
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [tips, setTips] = React.useState<TipRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [shiftsData, payslipsData, tipsData, leaveData] = await Promise.all([
        staffService.getMySchedule(),
        staffService.getPayslips(),
        staffService.getTips(),
        staffService.getLeaveBalance(),
        syncFromBackend(),
      ]);
      setShifts(shiftsData);
      setPayslips(payslipsData);
      setTips(tipsData);
      setLeaveBalance(leaveData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể nạp dữ liệu trang phục vụ');
    } finally {
      setLoading(false);
    }
  }, [syncFromBackend]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Suy ra các số liệu của ca hôm nay
  const currentShift = shifts[0] || null;
  const nextShift = shifts[1] || null;

  // Lương & Tip
  const t11Payslip = payslips.find((p) => p.month === '2026-11') || payslips[0];
  const t11TipTotal = tips.reduce((sum, t) => sum + t.allocatedAmount, 0);

  // Tính 3 metrics nghiệp vụ phục vụ từ dữ liệu thật (useWaiterStore <-> Backend API):
  const waiterTables = React.useMemo(() => Object.values(waiterTablesMap), [waiterTablesMap]);

  // Cảnh báo dị ứng thực tế từ các món đang hoạt động trong useWaiterStore
  const allergyTickets = React.useMemo<Ticket[]>(() => {
    return waiterTables
      .filter((t) =>
        t.confirmedItems.some(
          (i) => i.status !== 'served' && i.status !== 'rejected' && Boolean(i.allergyNote)
        )
      )
      .map((t) => ({
        id: t.orderId || t.id,
        orderId: t.orderId || t.id,
        tableId: t.id,
        tableNo: t.name,
        status: 'WAITING' as const,
        createdAt: new Date().toISOString(),
        slaMinutes: 15,
        items: t.confirmedItems
          .filter((i) => i.status !== 'served' && i.status !== 'rejected' && Boolean(i.allergyNote))
          .map((i) => ({
            id: i.id,
            orderId: i.orderId || t.orderId || t.id,
            dishId: i.dishId,
            dishName: i.name,
            quantity: i.qty,
            unitPrice: i.price,
            modifiers: [],
            status: (i.status === 'ready' ? 'READY' : 'WAITING') as 'READY' | 'WAITING',
            allergy: i.allergyNote,
            note: i.note,
            createdAt: new Date().toISOString(),
          })),
      }));
  }, [waiterTables]);

  // 1. Số bàn đang phục vụ: các bàn có trạng thái serving hoặc billing
  const servingTablesCount = React.useMemo(() => {
    return waiterTables.filter((t) => t.status === 'serving' || t.status === 'billing').length;
  }, [waiterTables]);

  // 2. Món chờ giao: các items trong đơn active có trạng thái ready (READY)
  const itemsWaitingDeliveryCount = React.useMemo(() => {
    return waiterTables
      .flatMap((t) => t.confirmedItems)
      .filter((item) => item.status === 'ready').length;
  }, [waiterTables]);

  // 3. Món đã giao: các items có trạng thái served (SERVED)
  const itemsDeliveredCount = React.useMemo(() => {
    return waiterTables
      .flatMap((t) => t.confirmedItems)
      .filter((item) => item.status === 'served').length;
  }, [waiterTables]);

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
          className="px-4 py-2 bg-ops-brand text-white rounded-lg text-sm font-bold shadow-xs hover:bg-ops-brand-dark"
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
          <div className="text-xs text-muted mt-0.5">Bàn</div>
        </div>
        <div className="p-3 bg-sage-100 rounded-xl border border-sage-200">
          <div className="ops-nums text-2xl font-black text-sage-700">{itemsWaitingDeliveryCount}</div>
          <div className="text-xs text-sage-700 font-medium mt-0.5">Chờ giao</div>
        </div>
        <div className="p-3 bg-neutral-50 rounded-xl border border-sand-200">
          <div className="ops-nums text-2xl font-black text-muted">{itemsDeliveredCount}</div>
          <div className="text-xs text-muted mt-0.5">Đã giao</div>
        </div>
      </div>

      <Link
        href="/wait/tables"
        className="w-full min-h-[48px] rounded-lg bg-ops-brand hover:bg-ops-brand-dark text-white font-bold text-sm flex items-center justify-center transition-colors shadow-xs active:scale-98"
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
          actions={WAITER_QUICK_ACTIONS}
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
            <Check className="h-4 w-4 text-sage-700" />
            <span>Đã vào ca lúc 07:58</span>
          </div>
        ),
      }}
      roleCard={roleCard}
      extraSections={extraSections}
    />
  );
}
