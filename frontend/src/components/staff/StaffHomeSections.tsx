'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Ticket, Payslip, LeaveBalance } from '@/types';
import { formatVnd } from '@/lib/formatMoney';

export interface AllergyWarningSectionProps {
  allergyTickets: Ticket[];
  now: number;
}

export function AllergyWarningSection({ allergyTickets, now }: AllergyWarningSectionProps) {
  return (
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
  );
}

export interface SalaryLeaveGridSectionProps {
  t11Payslip?: Payslip;
  t11TipTotal: number;
  leaveBalance?: LeaveBalance | null;
}

export function SalaryLeaveGridSection({
  t11Payslip,
  t11TipTotal,
  leaveBalance,
}: SalaryLeaveGridSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tóm tắt lương */}
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

      {/* Quỹ phép */}
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
  );
}

export function AnnouncementsSection() {
  return (
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
  );
}
