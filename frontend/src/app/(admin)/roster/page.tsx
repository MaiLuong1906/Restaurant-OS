'use client';

import * as React from 'react';
import {
  Users,
  CreditCard,
  ClipboardList,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plus,
  X,
  Check,
  Clock,
  ArrowRightLeft,
  CalendarDays,
  Pencil,
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  type: 'swap' | 'leave' | 'ot';
  typeName: string;
  badgeClass: string;
  title: string;
  staff: string;
  reason: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface StaffRoster {
  id: string;
  name: string;
  role: string;
  dept: 'BOH' | 'FOH' | 'Cashier';
  shifts: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
}

const INITIAL_STAFF_ROSTER: StaffRoster[] = [
  {
    id: 'st-1',
    name: 'Nguyễn Văn Tuấn',
    role: 'Bếp trưởng',
    dept: 'BOH',
    shifts: { mon: 'Sáng', tue: 'OFF', wed: 'Sáng', thu: 'Sáng', fri: 'Gãy', sat: 'Tối', sun: 'OFF' },
  },
  {
    id: 'st-2',
    name: 'Lê Văn An',
    role: 'Phụ bếp',
    dept: 'BOH',
    shifts: { mon: 'Sáng', tue: 'Sáng', wed: 'Sáng', thu: 'OFF', fri: 'Sáng', sat: 'Tối', sun: 'Xin phép' },
  },
  {
    id: 'st-3',
    name: 'Mai Thị Hoa',
    role: 'Phục vụ Lead',
    dept: 'FOH',
    shifts: { mon: 'OFF', tue: 'Tối', wed: 'Sáng', thu: 'Tối', fri: 'Tối', sat: 'Đổi ca', sun: 'OFF' },
  },
  {
    id: 'st-4',
    name: 'Nguyễn Văn Nam',
    role: 'Phục vụ Runner',
    dept: 'FOH',
    shifts: { mon: 'Tối', tue: 'Tối', wed: 'OFF', thu: 'Sáng', fri: 'Tối', sat: 'Tối', sun: 'OFF' },
  },
  {
    id: 'st-5',
    name: 'Lê Thùy Linh',
    role: 'Thu ngân Trưởng',
    dept: 'Cashier',
    shifts: { mon: 'Tối', tue: 'OFF', wed: 'Tối', thu: 'OFF', fri: 'Tối', sat: 'Tối', sun: 'Tối' },
  },
];

export default function AdminRosterPage() {
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [roster, setRoster] = React.useState<StaffRoster[]>(INITIAL_STAFF_ROSTER);
  const [currentWeek, setCurrentWeek] = React.useState(45);
  const [selectedApproval, setSelectedApproval] = React.useState<ApprovalItem | null>(null);

  // Edit Single Shift Modal
  const [editingShift, setEditingShift] = React.useState<{
    staffId: string;
    dayKey: keyof StaffRoster['shifts'];
    dayLabel: string;
    currentValue: string;
    staffName: string;
  } | null>(null);

  // New Shift Assignment Modal
  const [newShiftModalOpen, setNewShiftModalOpen] = React.useState(false);
  const [newShiftForm, setNewShiftForm] = React.useState({
    staffId: 'st-1',
    dayKey: 'fri' as keyof StaffRoster['shifts'],
    shiftType: 'Tối',
  });

  const [approvals, setApprovals] = React.useState<ApprovalItem[]>([
    {
      id: 'REQ-01',
      type: 'swap',
      typeName: 'ĐỔI CA',
      badgeClass: 'bg-stone-200 text-ops-ink',
      title: 'Yêu cầu Đổi Ca Trực',
      staff: 'NV Mai Thị Hoa ⇄ NV Nguyễn Văn Nam',
      reason: 'Lịch thi học phần tại đại học · Nam đã đồng ý trực thay',
      time: 'Ca Tối Thứ 7 (08/11 · 14:30 - 22:30)',
      status: 'pending',
    },
    {
      id: 'REQ-02',
      type: 'leave',
      typeName: 'NGHỈ PHÉP',
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200',
      title: 'Yêu cầu Nghỉ Phép Năm',
      staff: 'NV Lê Văn An (Phụ bếp - BOH)',
      reason: 'Việc gia đình đột xuất · Phép năm còn 8/12 ngày · Bếp trưởng ký duyệt',
      time: 'Chủ Nhật 09/11 (Ca Tối 14:30 - 22:30)',
      status: 'pending',
    },
    {
      id: 'REQ-03',
      type: 'ot',
      typeName: 'LÀM THÊM (OT)',
      badgeClass: 'bg-rose-100 text-primary-500 border border-rose-200',
      title: 'Đăng ký Làm Thêm Ca (OT)',
      staff: 'NV Đỗ Thu Thảo (Thu ngân FOH)',
      reason: 'Hỗ trợ tiệc Private Dining VIP Maharaja · Hệ số OT: 150%',
      time: 'Ca Gãy Thứ 6 (17:30 - 21:30)',
      status: 'pending',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
    showToast(`Đã chấp thuận yêu cầu ${id}`);
    if (selectedApproval?.id === id) {
      setSelectedApproval(null);
    }
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    showToast(`Đã từ chối yêu cầu ${id}`);
    if (selectedApproval?.id === id) {
      setSelectedApproval(null);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  const handleSaveShift = (newVal: string) => {
    if (!editingShift) return;
    setRoster((prev) =>
      prev.map((st) => {
        if (st.id === editingShift.staffId) {
          return {
            ...st,
            shifts: {
              ...st.shifts,
              [editingShift.dayKey]: newVal,
            },
          };
        }
        return st;
      })
    );
    showToast(`Đã cập nhật ca của ${editingShift.staffName} (${editingShift.dayLabel}) thành [${newVal}]`);
    setEditingShift(null);
  };

  const handleAssignNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    setRoster((prev) =>
      prev.map((st) => {
        if (st.id === newShiftForm.staffId) {
          return {
            ...st,
            shifts: {
              ...st.shifts,
              [newShiftForm.dayKey]: newShiftForm.shiftType,
            },
          };
        }
        return st;
      })
    );
    showToast('Đã phân công ca mới thành công vào lịch tuần!');
    setNewShiftModalOpen(false);
  };

  const handleSmartShiftAi = () => {
    showToast('Smart Shift AI: Đã tự động điều chỉnh 3 ca trực để tối ưu 100% định biên đón 72 khách tối!');
  };

  const getShiftBadgeStyle = (val: string) => {
    switch (val) {
      case 'Sáng':
        return 'bg-amber-100 text-amber-900 border border-amber-200';
      case 'Tối':
        return 'bg-primary-500/15 text-primary-500 border border-primary-500/20 font-bold';
      case 'Gãy':
        return 'bg-stone-200 text-stone-900 font-semibold';
      case 'OFF':
        return 'bg-stone-100 text-stone-400';
      case 'Đổi ca':
        return 'bg-rose-50 text-rose-800 border border-rose-200 font-bold';
      case 'Xin phép':
        return 'bg-amber-50 text-amber-800 border border-amber-300 font-bold';
      default:
        return 'bg-ops-bg text-ops-ink';
    }
  };

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Lịch Ca Tuần &amp; Phê Duyệt Nhân Sự
            </h1>
            <p className="text-sm font-medium text-stone-600 max-w-2xl">
              Phân công ca trực tuần 7 ngày, kiểm soát định biên nhân lực và phê duyệt các yêu cầu đổi ca, nghỉ phép, OT
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSmartShiftAi}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="font-mono text-xs tracking-wider font-bold">Smart Shift AI (Gợi Ý)</span>
            </button>
            <button
              onClick={() => setNewShiftModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs transition-colors cursor-pointer font-bold"
            >
              <Plus className="w-4 h-4" />
              <span className="font-mono text-xs tracking-wider">+ Phân Công Ca Mới</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Nhân sự trực ca
              </span>
              <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-800">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-ops text-3xl font-extrabold text-stone-900">14</span>
              <span className="text-xs font-semibold text-stone-600">nhân sự hoạt động</span>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-stone-600 font-medium">
              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-900 font-mono font-bold text-xs">FOH: 7</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-900 font-mono font-bold text-xs">BOH: 5</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-900 font-mono font-bold text-xs">Thu ngân: 2</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                FaceID Chấm Công
              </span>
              <span className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-ops text-3xl font-extrabold text-stone-900">93%</span>
              <span className="text-xs font-bold text-emerald-700">Đúng giờ</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-stone-600 font-medium">
                <strong className="text-stone-900 font-bold">13/14</strong> đúng giờ
              </span>
              <span className="text-ops-brand font-mono font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                1 muộn 12p
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Đơn Chờ Quản Lý Duyệt
              </span>
              <span className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-ops-brand">
                <ClipboardList className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-ops text-3xl font-extrabold text-ops-brand">{String(pendingCount).padStart(2, '0')}</span>
              <span className="text-xs font-bold text-ops-brand">Yêu cầu khẩn</span>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-ops-brand font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-ops-brand animate-pulse"></span>
              <span>Cần xử lý trước ca tối (17:00)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ops-muted font-bold">
                Định Biên Ca Tối Nay
              </span>
              <span className="w-8 h-8 rounded-full bg-ops-bg flex items-center justify-center text-emerald-700">
                <CheckSquare className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-ops text-3xl font-bold text-ops-ink">8/8</span>
              <span className="text-xs font-bold text-emerald-700">Đạt 100%</span>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Đủ nhân lực đón 72 khách đặt</span>
            </div>
          </div>
        </div>

        {/* Weekly Roster Section (7-Day Matrix Table) */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-ops-border space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-ops-border">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentWeek(currentWeek - 1);
                    showToast(`Chuyển sang Tuần ${currentWeek - 1}`);
                  }}
                  className="w-8 h-8 rounded bg-ops-bg hover:bg-stone-200 flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-ops text-base font-bold text-ops-ink">
                  Tuần {currentWeek} · Tháng 11 / 2024
                </span>
                <button
                  onClick={() => {
                    setCurrentWeek(currentWeek + 1);
                    showToast(`Chuyển sang Tuần ${currentWeek + 1}`);
                  }}
                  className="w-8 h-8 rounded bg-ops-bg hover:bg-stone-200 flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <span className="font-mono text-xs text-ops-muted px-2.5 py-1 bg-ops-bg rounded border border-ops-border">
                03/11 - 09/11
              </span>
            </div>

            {/* Shift Badges Legend */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ops-bg text-ops-muted">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Ca Sáng (06:30 - 14:30)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ops-bg text-ops-muted">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span> Ca Gãy (Split)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ops-bg text-ops-muted">
                <span className="w-2 h-2 rounded-full bg-primary-500"></span> Ca Tối (14:30 - 22:30)
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-ops-border rounded-lg bg-white">
            <table className="w-full border-collapse text-left text-xs min-w-[960px]">
              <thead>
                <tr className="bg-ops-bg border-b border-ops-border text-ops-muted">
                  <th className="py-3 px-4 font-mono text-[11px] font-bold uppercase w-56">Nhân viên & Vị trí</th>
                  <th className="py-3 px-3 font-mono text-[11px] font-semibold text-center">
                    Thứ 2 <span className="font-mono block text-[10px] opacity-75">03/11</span>
                  </th>
                  <th className="py-3 px-3 font-mono text-[11px] font-semibold text-center">
                    Thứ 3 <span className="font-mono block text-[10px] opacity-75">04/11</span>
                  </th>
                  <th className="py-3 px-3 font-mono text-[11px] font-semibold text-center">
                    Thứ 4 <span className="font-mono block text-[10px] opacity-75">05/11</span>
                  </th>
                  <th className="py-3 px-3 font-mono text-[11px] font-semibold text-center">
                    Thứ 5 <span className="font-mono block text-[10px] opacity-75">06/11</span>
                  </th>
                  <th className="py-3 px-3 font-mono text-[11px] font-bold text-center bg-rose-50 text-primary-500 border-x border-rose-200">
                    <span className="px-1.5 py-0.2 rounded bg-primary-500 text-white text-[9px] font-bold mb-0.5 inline-block">
                      Hôm nay
                    </span>
                    <br />
                    Thứ 6 <span className="font-mono block text-[10px]">07/11</span>
                  </th>
                  <th className="py-3 px-3 font-mono text-[11px] font-semibold text-center">
                    Thứ 7 <span className="font-mono block text-[10px] opacity-75">08/11</span>
                  </th>
                  <th className="py-3 px-3 font-mono text-[11px] font-semibold text-center">
                    Chủ Nhật <span className="font-mono block text-[10px] opacity-75">09/11</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-border">
                {roster.map((staff) => (
                  <tr key={staff.id} className="hover:bg-ops-bg transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-ops-ink block">{staff.name}</span>
                      <span className="text-[11px] text-ops-muted">
                        {staff.role} · {staff.dept}
                      </span>
                    </td>
                    {(
                      [
                        { key: 'mon', label: 'Thứ 2', isToday: false },
                        { key: 'tue', label: 'Thứ 3', isToday: false },
                        { key: 'wed', label: 'Thứ 4', isToday: false },
                        { key: 'thu', label: 'Thứ 5', isToday: false },
                        { key: 'fri', label: 'Thứ 6 (Hôm nay)', isToday: true },
                        { key: 'sat', label: 'Thứ 7', isToday: false },
                        { key: 'sun', label: 'Chủ Nhật', isToday: false },
                      ] as const
                    ).map((d) => {
                      const val = staff.shifts[d.key];
                      return (
                        <td
                          key={d.key}
                          onClick={() =>
                            setEditingShift({
                              staffId: staff.id,
                              dayKey: d.key,
                              dayLabel: d.label,
                              currentValue: val,
                              staffName: staff.name,
                            })
                          }
                          className={`py-3 px-2 text-center cursor-pointer hover:bg-stone-200/50 transition-colors ${
                            d.isToday ? 'bg-rose-50/40 border-x border-rose-200' : ''
                          }`}
                        >
                          <span
                            className={`px-2 py-1 rounded font-mono text-[11px] inline-block ${getShiftBadgeStyle(
                              val
                            )}`}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending Approvals Section */}
          <div className="pt-4 border-t border-ops-border">
            <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary-500 rounded-full"></span>
                <h3 className="font-ops text-ops-ink text-base font-bold">
                  Hàng Đợi Phê Duyệt Yêu Cầu Nhân Sự ({pendingCount} Chờ Duyệt)
                </h3>
              </div>
              <button
                onClick={() => {
                  setApprovals((prev) => prev.map((item) => ({ ...item, status: 'approved' })));
                  showToast('Đã phê duyệt nhanh toàn bộ yêu cầu ca trực!');
                }}
                className="font-mono text-xs text-primary-500 font-bold hover:underline cursor-pointer"
              >
                Duyệt nhanh tất cả ({pendingCount})
              </button>
            </div>

            {/* Requests List */}
            <div className="space-y-3">
              {approvals.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg bg-ops-bg border border-ops-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${req.badgeClass}`}>
                      {req.typeName}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-ops-ink">{req.staff}</span>
                      <p className="text-[11px] text-ops-muted">{req.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => setSelectedApproval(req)}
                          className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted hover:text-ops-ink text-xs font-mono uppercase rounded cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold shadow-xs cursor-pointer"
                        >
                          Chấp thuận
                        </button>
                      </>
                    ) : req.status === 'approved' ? (
                      <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
                        ĐÃ DUYỆT ✓
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded bg-rose-50 text-rose-800 font-mono text-xs font-bold border border-rose-200">
                        ĐÃ TỪ CHỐI ✕
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Quick Edit Shift */}
      {editingShift && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div>
                <h3 className="font-ops text-sm font-bold text-ops-ink">Điều Chỉnh Ca Trực</h3>
                <span className="text-xs text-ops-muted">
                  {editingShift.staffName} · {editingShift.dayLabel}
                </span>
              </div>
              <button
                onClick={() => setEditingShift(null)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-ops-muted block">
                Chọn Loại Ca Trực Mới:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Sáng', 'Tối', 'Gãy', 'OFF', 'Xin phép'].map((shiftType) => (
                  <button
                    key={shiftType}
                    onClick={() => handleSaveShift(shiftType)}
                    className={`py-2 px-3 rounded-lg border font-mono font-bold text-left cursor-pointer transition-all ${
                      editingShift.currentValue === shiftType
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-ops-bg hover:bg-stone-200 text-ops-ink border-ops-border'
                    }`}
                  >
                    {shiftType}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Phân Công Ca Mới */}
      {newShiftModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-500" />
                <h3 className="font-ops text-base font-bold text-ops-ink">Phân Công Ca Làm Việc Mới</h3>
              </div>
              <button
                onClick={() => setNewShiftModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignNewShift} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Nhân Sự Được Phân Công *
                </label>
                <select
                  value={newShiftForm.staffId}
                  onChange={(e) => setNewShiftForm({ ...newShiftForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-medium"
                >
                  {roster.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role} - {st.dept})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Ngày Trong Tuần *
                </label>
                <select
                  value={newShiftForm.dayKey}
                  onChange={(e) =>
                    setNewShiftForm({
                      ...newShiftForm,
                      dayKey: e.target.value as keyof StaffRoster['shifts'],
                    })
                  }
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-medium"
                >
                  <option value="mon">Thứ 2 (03/11)</option>
                  <option value="tue">Thứ 3 (04/11)</option>
                  <option value="wed">Thứ 4 (05/11)</option>
                  <option value="thu">Thứ 5 (06/11)</option>
                  <option value="fri">Thứ 6 (07/11 - Hôm nay)</option>
                  <option value="sat">Thứ 7 (08/11)</option>
                  <option value="sun">Chủ Nhật (09/11)</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Loại Ca Làm Việc *
                </label>
                <select
                  value={newShiftForm.shiftType}
                  onChange={(e) => setNewShiftForm({ ...newShiftForm, shiftType: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-medium"
                >
                  <option value="Sáng">Ca Sáng (06:30 - 14:30)</option>
                  <option value="Tối">Ca Tối (14:30 - 22:30)</option>
                  <option value="Gãy">Ca Gãy (10:30 - 14:30 & 17:30 - 21:30)</option>
                  <option value="OFF">Nghỉ (OFF)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setNewShiftModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Cập Nhật Lịch Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Approval Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <h3 className="font-ops text-base font-bold text-ops-ink">{selectedApproval.title}</h3>
              <button
                onClick={() => setSelectedApproval(null)}
                className="w-7 h-7 rounded-lg hover:bg-ops-bg text-ops-muted hover:text-ops-ink flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-ops-bg rounded-lg space-y-1">
                <span className="font-mono text-[10px] uppercase text-ops-muted font-bold">Đối tượng áp dụng:</span>
                <p className="font-bold text-ops-ink text-sm">{selectedApproval.staff}</p>
              </div>
              <div className="p-3 bg-ops-bg rounded-lg space-y-1">
                <span className="font-mono text-[10px] uppercase text-ops-muted font-bold">Thời gian ca trực:</span>
                <p className="font-bold text-ops-ink font-mono">{selectedApproval.time}</p>
              </div>
              <div className="p-3 bg-ops-bg rounded-lg space-y-1">
                <span className="font-mono text-[10px] uppercase text-ops-muted font-bold">Lý do & Ghi chú xác thực:</span>
                <p className="text-ops-ink">{selectedApproval.reason}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-ops-border">
              <button
                onClick={() => handleReject(selectedApproval.id)}
                className="px-4 py-2 bg-white border border-ops-border text-ops-muted hover:text-rose-700 text-xs font-mono uppercase rounded cursor-pointer"
              >
                Từ chối
              </button>
              <button
                onClick={() => handleApprove(selectedApproval.id)}
                className="px-4 py-2 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold shadow-xs cursor-pointer"
              >
                Chấp thuận yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
