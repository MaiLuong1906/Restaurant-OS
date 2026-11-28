'use client';

import * as React from 'react';
import { staffLeavePayrollService } from '@/services/staffLeavePayrollService';
import { Payslip, TipMonthSummary } from '@/types';
import { PayslipListView } from '@/components/staff/payslip/PayslipListView';
import { PayslipDetailView } from '@/components/staff/payslip/PayslipDetailView';
import { TipDetailView } from '@/components/staff/payslip/TipDetailView';

export default function PayslipPage() {
  // Views: 'B11' (Danh sách phiếu & tip) | 'B12' (Chi tiết phiếu lương) | 'B13' (Chi tiết tip)
  const [view, setView] = React.useState<'B11' | 'B12' | 'B13'>('B11');

  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [tipMonths, setTipMonths] = React.useState<TipMonthSummary[]>([]);
  const [selectedPayslip, setSelectedPayslip] = React.useState<Payslip | null>(null);
  const [currentTipMonth, setCurrentTipMonth] = React.useState<TipMonthSummary | null>(null);
  const [, setLoading] = React.useState<boolean>(true);
  const [, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ps, tms] = await Promise.all([
        staffLeavePayrollService.getPayslips(),
        staffLeavePayrollService.getTipMonths(),
      ]);
      setPayslips(ps);
      setTipMonths(tms);
      if (tms.length > 0) {
        setCurrentTipMonth(tms[0]);
      }
    } catch (err) {
      setError((err as Error).message || 'Không thể tải thông tin phiếu lương');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = (ps: Payslip) => {
    setSelectedPayslip(ps);
    setView('B12');
  };

  const handleOpenTip = () => {
    setView('B13');
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] pb-24">
      <div className="max-w-[720px] mx-auto px-4 py-4 space-y-4">
        {view === 'B11' && (
          <PayslipListView
            payslips={payslips}
            currentTipMonth={currentTipMonth}
            onOpenPayslipDetail={handleOpenDetail}
            onOpenTipDetail={handleOpenTip}
          />
        )}

        {view === 'B12' && selectedPayslip && (
          <PayslipDetailView payslip={selectedPayslip} onBack={() => setView('B11')} />
        )}

        {view === 'B13' && currentTipMonth && (
          <TipDetailView
            currentTipMonth={currentTipMonth}
            tipMonths={tipMonths}
            onBack={() => setView('B11')}
          />
        )}
      </div>
    </div>
  );
}
