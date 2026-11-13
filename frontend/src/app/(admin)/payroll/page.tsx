'use client';

import * as React from 'react';
import {
  Landmark,
  Lock,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Search,
  Sliders,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface StaffPayroll {
  id: string;
  name: string;
  role: string;
  dept: 'BOH' | 'FOH' | 'Cashier';
  baseSalary: number;
  hours: number;
  otHours: number;
  bonus: number;
  status: string;
}

const INITIAL_STAFF_PAYROLL: StaffPayroll[] = [
  {
    id: 'EMP-001',
    name: 'Nguyễn Văn Tuấn',
    role: 'Bếp Trưởng',
    dept: 'BOH',
    baseSalary: 15000000,
    hours: 192,
    otHours: 16,
    bonus: 1500000,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-002',
    name: 'Lê Văn An',
    role: 'Phụ Bếp',
    dept: 'BOH',
    baseSalary: 9500000,
    hours: 184,
    otHours: 8,
    bonus: 0,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-005',
    name: 'Mai Thị Hoa',
    role: 'Phục Vụ Lead',
    dept: 'FOH',
    baseSalary: 8500000,
    hours: 176,
    otHours: 12,
    bonus: 300000,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-008',
    name: 'Lê Thùy Linh',
    role: 'Thu Ngân Trưởng',
    dept: 'Cashier',
    baseSalary: 9000000,
    hours: 190,
    otHours: 0,
    bonus: 0,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-009',
    name: 'Nguyễn Văn Nam',
    role: 'Phục Vụ Runner',
    dept: 'FOH',
    baseSalary: 7500000,
    hours: 180,
    otHours: 6,
    bonus: 200000,
    status: 'SẴN SÀNG',
  },
];

export default function AdminPayrollPage() {
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pinDigits, setPinDigits] = React.useState(['', '', '', '']);
  const [isLocked, setIsLocked] = React.useState(false);

  // Tip Pool Setting
  const [tipPoolTotal, setTipPoolTotal] = React.useState(18450000);
  const [deptFilter, setDeptFilter] = React.useState<'ALL' | 'BOH' | 'FOH' | 'Cashier'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Selected Staff for Detailed Modal
  const [selectedStaff, setSelectedStaff] = React.useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePinInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pinDigits];
    next[index] = val.slice(-1);
    setPinDigits(next);
    if (val && index < 3) {
      document.getElementById(`payroll-pin-${index + 1}`)?.focus();
    }
  };

  const confirmPayrollLock = () => {
    const pin = pinDigits.join('');
    if (pin.length < 4) {
      showToast('Vui lòng nhập đủ 4 chữ số PIN Quản lý');
      return;
    }
    setIsLocked(true);
    setShowPinModal(false);
    setPinDigits(['', '', '', '']);
    showToast('Xác thực PIN thành công: Đã chốt sổ Quỹ Tip & Bảng Lương Tháng 11!');
  };

  // 40/45/15 rule
  const bohTipPool = Math.round(tipPoolTotal * 0.4);
  const fohTipPool = Math.round(tipPoolTotal * 0.45);
  const cashierTipPool = Math.round(tipPoolTotal * 0.15);

  const filteredStaff = INITIAL_STAFF_PAYROLL.filter((st) => {
    const matchDept = deptFilter === 'ALL' || st.dept === deptFilter;
    const matchSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ops-ink text-white px-4 py-2.5 rounded-lg shadow-lg border border-ops-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Tính Lương &amp; Phân Bổ Quỹ Tip
            </h1>
            <p className="text-sm font-medium text-stone-600 max-w-2xl">
              Tổng hợp giờ công thực tế, tính toán lương ca và tự động phân chia quỹ Tip tập trung theo tỷ lệ phòng ban
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => showToast('Đang kết xuất bảng chuyển khoản ngân hàng (Batch Salary Transfer)...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 rounded-lg shadow-2xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Landmark className="w-4 h-4 text-stone-600" />
              <span>Xuất Bảng Lương Ngân Hàng</span>
            </button>
            <button
              onClick={() => {
                if (isLocked) {
                  showToast('Bảng lương tháng 11 đã được chốt và ký số bởi Quản lý!');
                } else {
                  setShowPinModal(true);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                isLocked ? 'bg-emerald-700 text-white' : 'bg-ops-brand text-white hover:bg-ops-brand-dark'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isLocked ? 'ĐÃ CHỐT SỔ KỲ LƯƠNG' : 'Chốt Quỹ Tip & Lương'}</span>
            </button>
          </div>
        </div>

        {/* Central Tip Pool Highlight Ribbon (40/45/15 Rule) */}
        <div className="bg-white rounded-xl p-6 shadow-2xs border border-stone-200 border-l-4 border-l-amber-600">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="font-mono text-xs uppercase font-bold text-stone-700 tracking-wider block">
                QUỸ TIP TẬP TRUNG TÍCH LŨY THÁNG 11
              </span>
              <div className="font-ops text-3xl xl:text-4xl font-extrabold text-stone-900 mt-1">
                {formatVND(tipPoolTotal)}
              </div>
            </div>

            {/* 3-Way Department Split */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-center">
                <span className="font-mono text-xs text-stone-700 uppercase font-bold block">
                  BẾP (BOH) · 40%
                </span>
                <span className="font-mono text-base font-extrabold text-stone-900 mt-1 block">
                  {formatVND(bohTipPool)}
                </span>
                <span className="text-xs text-stone-600 font-medium">5 nhân sự</span>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-center">
                <span className="font-mono text-xs text-ops-brand uppercase font-bold block">
                  PHỤC VỤ (FOH) · 45%
                </span>
                <span className="font-mono text-base font-extrabold text-ops-brand mt-1 block">
                  {formatVND(fohTipPool)}
                </span>
                <span className="text-xs text-stone-600 font-medium">7 nhân sự</span>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-center">
                <span className="font-mono text-xs text-stone-700 uppercase font-bold block">
                  THU NGÂN · 15%
                </span>
                <span className="font-mono text-base font-extrabold text-stone-900 mt-1 block">
                  {formatVND(cashierTipPool)}
                </span>
                <span className="text-xs text-stone-600 font-medium">2 nhân sự</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Payroll Table Container */}
        <div className="bg-white rounded-xl shadow-xs border border-ops-border overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-ops-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Dept */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'ALL', label: 'Tất Cả' },
                  { id: 'BOH', label: 'Bếp (BOH)' },
                  { id: 'FOH', label: 'Phục Vụ (FOH)' },
                  { id: 'Cashier', label: 'Thu Ngân' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDeptFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-semibold transition-all cursor-pointer ${
                    deptFilter === tab.id
                      ? 'bg-primary-500 text-white shadow-xs'
                      : 'bg-ops-bg text-ops-muted hover:text-ops-ink border border-ops-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-ops-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên, mã NV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-ops-bg border border-ops-border rounded-lg text-xs font-sans text-ops-ink focus:outline-none focus:border-primary-500 w-48 sm:w-56"
                />
              </div>

              <button
                onClick={() => showToast('Đang tải file Excel bảng lương chi tiết...')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink rounded-lg text-xs font-mono uppercase cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Tải Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-ops-bg border-b border-ops-border text-ops-muted font-mono text-[10px] uppercase">
                  <th className="py-3 px-4 font-bold">Họ tên &amp; Mã NV</th>
                  <th className="py-3 px-3 font-bold">Vị trí</th>
                  <th className="py-3 px-3 text-right font-bold">Lương cơ bản</th>
                  <th className="py-3 px-3 text-right font-bold">Giờ Làm</th>
                  <th className="py-3 px-3 text-right font-bold">Giờ OT</th>
                  <th className="py-3 px-3 text-right font-bold">Tip phân bổ</th>
                  <th className="py-3 px-3 text-right font-bold">Thưởng / OT</th>
                  <th className="py-3 px-4 text-right font-bold text-ops-ink">Tổng Thực Lãnh</th>
                  <th className="py-3 px-3 text-center font-bold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-border font-mono">
                {filteredStaff.map((staff) => {
                  const tipShare =
                    staff.dept === 'BOH'
                      ? Math.round(bohTipPool / 2)
                      : staff.dept === 'FOH'
                      ? Math.round(fohTipPool / 2)
                      : cashierTipPool;

                  const totalNet = staff.baseSalary + tipShare + staff.bonus + staff.otHours * 150000;

                  return (
                    <tr
                      key={staff.id}
                      onClick={() => setSelectedStaff({ ...staff, tipShare, totalNet })}
                      className="hover:bg-ops-bg transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-ops-ink block group-hover:text-primary-500">
                          {staff.name}
                        </span>
                        <span className="text-[10px] text-ops-muted font-mono">{staff.id}</span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-medium">
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-ops-ink">{formatVND(staff.baseSalary)}</td>
                      <td className="py-3 px-3 text-right font-bold text-ops-ink">{staff.hours}h</td>
                      <td className="py-3 px-3 text-right text-amber-700">{staff.otHours}h</td>
                      <td className="py-3 px-3 text-right font-bold text-primary-500">{formatVND(tipShare)}</td>
                      <td className="py-3 px-3 text-right text-emerald-700">
                        {staff.bonus > 0 ? `+ ${formatVND(staff.bonus)}` : '0 ₫'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-sm text-ops-ink">
                        {formatVND(totalNet)}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                          {staff.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-ops-bg border-t border-ops-border flex flex-wrap items-center justify-between text-xs font-mono font-bold">
            <span className="text-ops-muted">TỔNG QUỸ LƯƠNG &amp; TIP THÁNG 11 DỰ KIẾN:</span>
            <span className="text-base text-primary-500">{formatVND(164820000)}</span>
          </div>
        </div>
      </div>

      {/* Modal: Chi Tiết Thu Nhập Nhân Sự */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <div>
                <h3 className="font-ops text-base font-bold text-ops-ink">{selectedStaff.name}</h3>
                <span className="text-xs text-ops-muted font-mono">{selectedStaff.id} · {selectedStaff.role}</span>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 bg-ops-bg rounded-lg space-y-1.5">
                <div className="flex justify-between text-ops-muted">
                  <span>Lương cơ bản thỏa thuận:</span>
                  <span className="font-bold text-ops-ink">{formatVND(selectedStaff.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-ops-muted">
                  <span>Tổng số giờ công đã trực:</span>
                  <span className="font-bold text-ops-ink">{selectedStaff.hours} Giờ</span>
                </div>
                <div className="flex justify-between text-ops-muted">
                  <span>Số giờ làm thêm (OT 150%):</span>
                  <span className="font-bold text-amber-700">{selectedStaff.otHours} Giờ</span>
                </div>
                <div className="flex justify-between text-ops-muted">
                  <span>Khoản chia từ Quỹ Tip:</span>
                  <span className="font-bold text-primary-500">+{formatVND(selectedStaff.tipShare)}</span>
                </div>
                {selectedStaff.bonus > 0 && (
                  <div className="flex justify-between text-ops-muted">
                    <span>Thưởng nóng / Phụ cấp ca:</span>
                    <span className="font-bold text-emerald-700">+{formatVND(selectedStaff.bonus)}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center text-sm">
                <span className="font-sans font-bold text-emerald-950">Tổng thực nhận chuyển khoản:</span>
                <span className="font-bold text-emerald-900 text-base">{formatVND(selectedStaff.totalNet)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-500" />
                <h3 className="font-sans text-sm font-bold text-ops-ink">Xác Nhận PIN Quản Lý</h3>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ops-muted">
              Nhập mã PIN 4 số của Quản lý ca hoặc Chủ nhà hàng để chốt sổ toàn bộ quỹ Tip và bảng lương Tháng 11:
            </p>

            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  id={`payroll-pin-${i}`}
                  type="password"
                  maxLength={1}
                  value={pinDigits[i]}
                  onChange={(e) => handlePinInput(i, e.target.value)}
                  className="w-11 h-12 text-center text-xl font-mono font-bold bg-ops-bg border border-ops-border rounded-lg focus:outline-none focus:border-primary-500"
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
              <button
                onClick={() => setShowPinModal(false)}
                className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded"
              >
                Hủy
              </button>
              <button
                onClick={confirmPayrollLock}
                className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold"
              >
                Xác nhận chốt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
