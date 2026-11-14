'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { DashboardLayout, OPS_NAV_ICONS } from '@/components/layouts/DashboardLayout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { DEMO_STAFF, DEMO_SHIFT_DAYS, DEMO_SHIFT_GRID, DEMO_CASH_CLOSE, type StaffRole, type StaffStatus } from '@/lib/demo-data';
import { cn, formatVND } from '@/lib/utils';

/**
 * Demo v6 — quản lý nhân viên (vai trò Quản lý, tách khỏi Staff Portal của nhân viên).
 * Trang website /restaurant-website KHÔNG đổi. Trang này dùng font-ops + token ops-*.
 * - Bảng nhân viên: tìm kiếm theo tên, lọc vai trò / trạng thái, cột Avatar (chữ cái đầu),
 *   Tên, Vai trò (badge màu riêng từng vai trò), Ca hôm nay, Trạng thái (chấm + chữ,
 *   không chỉ màu), Hành động.
 * - Phân quyền demo: bật "Chế độ Quản lý" mới thấy thao tác nhạy cảm (Duyệt hủy, Mở két);
 *   tắt đi thì các nút đó biến mất — bản thật kiểm tra quyền ở backend, không chỉ ẩn nút.
 * - Lịch ca tuần: hàng = nhân viên, cột = ngày, kéo-thả một ô ca sang ô khác để đổi ca
 *   trong demo (chưa lưu lịch thật). Cảnh báo thiếu người giờ cao điểm ở dưới lưới.
 * - Chốt ca: chênh lệch két hiển thị kèm dấu +/− và màu (dư xanh, thiếu đỏ, đủ trung tính).
 * Dữ liệu mẫu, chưa nối API. Tìm kiếm không có kết quả thì hiện empty state thân thiện.
 */

const ROLE_BADGE: Record<StaffRole, string> = {
  'Quản lý': 'border border-ops-border bg-white text-ops-ink',
  'Thu ngân': 'border border-ops-border bg-white text-ops-ink',
  'Phục vụ': 'border border-ops-border bg-white text-ops-ink',
  'Bếp': 'border border-ops-border bg-white text-ops-ink',
};

const STATUS_DOT: Record<StaffStatus, string> = {
  'Đang làm': 'bg-table-empty',
  'Nghỉ': 'bg-ops-muted',
  'Chưa vào ca': 'bg-table-inuse',
};

export default function DemoStaffManagementPage() {
  const [query, setQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'Tất cả' | StaffRole>('Tất cả');
  const [statusFilter, setStatusFilter] = React.useState<'Tất cả' | StaffStatus>('Tất cả');
  const [managerMode, setManagerMode] = React.useState(true);
  const [grid, setGrid] = React.useState<Record<string, string[]>>(DEMO_SHIFT_GRID);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [dragged, setDragged] = React.useState<{ staff: string; day: number } | null>(null);

  const filtered = DEMO_STAFF.filter((s) => {
    if (roleFilter !== 'Tất cả' && s.role !== roleFilter) return false;
    if (statusFilter !== 'Tất cả' && s.status !== statusFilter) return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const dropShift = (staffId: string, day: number) => {
    if (!dragged) return;
    setGrid((prev) => {
      const next: Record<string, string[]> = {};
      for (const [id, row] of Object.entries(prev)) next[id] = [...row];
      const a = next[dragged.staff][dragged.day];
      const b = next[staffId][day];
      next[dragged.staff][dragged.day] = b;
      next[staffId][day] = a;
      return next;
    });
    setDragged(null);
  };

  return (
    <DashboardLayout
      title="Nhân viên"
      navItems={[
        { label: 'Tổng quan', href: '/dashboard-demo', icon: OPS_NAV_ICONS.dashboard },
        { label: 'Sơ đồ bàn', href: '/pos-demo', icon: OPS_NAV_ICONS.tables },
        { label: 'Nhân viên', href: '/staff-management', active: true, icon: OPS_NAV_ICONS.staff },
        { label: 'Bếp KDS', href: '/kds-board', icon: OPS_NAV_ICONS.kds },
        { label: 'Báo cáo', href: '/dashboard-demo', icon: OPS_NAV_ICONS.report },
      ]}
      headerRight={
        <span className="flex items-center gap-2">
          <span className="hidden text-sm font-semibold text-ops-muted lg:block">Minh Anh · Quản lý</span>
          <button type="button" onClick={() => setManagerMode((v) => !v)} className={cn('min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold', managerMode ? 'border-ops-ink bg-ops-ink text-white' : 'border-ops-border bg-white text-ops-muted')}>
            {managerMode ? 'Chế độ Quản lý: Bật' : 'Chế độ Quản lý: Tắt'}
          </button>
        </span>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-ops-muted">Trang chủ / Quản lý / Nhân viên</p>
          <h1 className="mt-2 text-4xl font-bold">Quản lý nhân viên</h1>
        </div>

        <section className="rounded-lg border border-ops-border bg-white p-6 shadow-warm-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhân viên theo tên…"
              className="min-h-12 flex-1 rounded-lg border border-ops-border bg-white px-4 text-sm outline-none placeholder:text-ops-muted focus:border-ops-ink"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'Tất cả' | StaffRole)} className="min-h-12 rounded-lg border border-ops-border bg-white px-3 text-sm font-semibold outline-none focus:border-ops-ink">
              <option>Tất cả</option>
              <option>Quản lý</option>
              <option>Thu ngân</option>
              <option>Phục vụ</option>
              <option>Bếp</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'Tất cả' | StaffStatus)} className="min-h-12 rounded-lg border border-ops-border bg-white px-3 text-sm font-semibold outline-none focus:border-ops-ink">
              <option>Tất cả</option>
              <option>Đang làm</option>
              <option>Nghỉ</option>
              <option>Chưa vào ca</option>
            </select>
          </div>

          {notice ? <p className="mt-4 rounded-lg border border-ops-border bg-ops-bg p-3 text-sm font-semibold text-ops-ink" role="status">{notice}</p> : null}

          {filtered.length === 0 ? (
            <p className="mt-6 border border-dashed border-ops-border bg-ops-bg p-8 text-center text-sm text-ops-muted">
              Không tìm thấy nhân viên nào khớp bộ lọc — thử xóa từ tìm kiếm hoặc chọn lại vai trò / trạng thái.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ops-border text-xs uppercase tracking-wide text-ops-muted">
                    <th className="py-3 pr-4 font-semibold">Nhân viên</th>
                    <th className="py-3 pr-4 font-semibold">Vai trò</th>
                    <th className="py-3 pr-4 font-semibold">Ca hôm nay</th>
                    <th className="py-3 pr-4 font-semibold">Trạng thái</th>
                    <th className="py-3 font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-ops-border last:border-b-0 hover:bg-ops-bg">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ops-ink text-base font-bold text-white" aria-hidden="true">
                            {s.name.charAt(0)}
                          </span>
                          <span className="font-bold">{s.name}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn('inline-block px-2 py-1 text-xs font-bold', ROLE_BADGE[s.role])}>{s.role}</span>
                      </td>
                      <td className="py-3 pr-4">{s.shift}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-semibold">
                          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[s.status])} aria-hidden="true" />
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" aria-label={`Thao tác với ${s.name}`} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-ops-border hover:bg-ops-bg">
                              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setNotice(`Đã chọn Xem — ${s.name} (demo).`)}>Xem hồ sơ</DropdownMenuItem>
                            <DropdownMenuItem disabled={!managerMode} onSelect={() => setNotice(`Đã chọn Duyệt hủy — ${s.name} (demo).`)}>
                              Duyệt hủy{managerMode ? '' : ' (cần Chế độ Quản lý)'}
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!managerMode} onSelect={() => setNotice(`Đã chọn Mở két — ${s.name} (demo).`)}>
                              Mở két{managerMode ? '' : ' (cần Chế độ Quản lý)'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-ops-border bg-white p-6 shadow-warm-sm">
          <h2 className="text-xl font-bold">Lịch ca tuần</h2>
          <p className="mt-4 text-sm text-ops-muted">Kéo một ô ca sang ô khác để đổi ca.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-center text-sm">
              <thead>
                <tr className="border-b border-ops-border text-xs uppercase tracking-wide text-ops-muted">
                  <th className="py-3 pr-4 text-left font-semibold">Nhân viên</th>
                  {DEMO_SHIFT_DAYS.map((d) => (
                    <th key={d} className="py-3 font-semibold">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_STAFF.map((s) => (
                  <tr key={s.id} className="border-b border-ops-border last:border-b-0">
                    <td className="py-3 pr-4 text-left font-bold">{s.name}</td>
                    {(grid[s.id] ?? []).map((shift, day) => (
                      <td key={day} className="py-1">
                        <button
                          type="button"
                          draggable
                          onDragStart={() => setDragged({ staff: s.id, day })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => dropShift(s.id, day)}
                          className={cn(
                            'min-h-11 w-full cursor-grab rounded-lg border px-1 text-xs font-semibold active:cursor-grabbing',
                            shift === 'Nghỉ' ? 'border-ops-border bg-ops-bg text-ops-muted' : 'border-ops-border bg-white text-ops-ink hover:border-ops-ink',
                          )}
                        >
                          {shift}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 border border-ops-border border-l-4 border-l-ops-alert bg-ops-tint-overdue p-4 text-sm font-semibold text-ops-alert">
            Cảnh báo giờ cao điểm: Thứ 7 ca tối hiện chỉ có 2 phục vụ, dưới định mức 4 — cần xếp thêm người trước khi chốt lịch.
          </p>
        </section>

        <section className="rounded-lg border border-ops-border bg-white p-6 shadow-warm-sm">
          <h2 className="text-xl font-bold">Chấm công và chốt ca</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ops-border text-xs uppercase tracking-wide text-ops-muted">
                  <th className="py-3 pr-4 text-left font-semibold">Người chốt</th>
                  <th className="py-3 pr-4 text-right font-semibold">Kỳ vọng</th>
                  <th className="py-3 pr-4 text-right font-semibold">Thực tế</th>
                  <th className="py-3 text-right font-semibold">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CASH_CLOSE.map((row) => {
                  const diff = row.actual - row.expected;
                  return (
                    <tr key={row.staff} className="border-b border-ops-border last:border-b-0">
                      <td className="py-3 pr-4 font-semibold">{row.staff}</td>
                      <td className="ops-nums py-3 pr-4 text-right">{formatVND(row.expected)}</td>
                      <td className="ops-nums py-3 pr-4 text-right">{formatVND(row.actual)}</td>
                      <td className={cn('ops-nums py-3 text-right font-bold', diff === 0 ? 'text-ops-muted' : diff > 0 ? 'text-sage-700' : 'text-ops-alert')}>
                        {diff === 0 ? 'Đủ · 0 ₫' : `${diff > 0 ? '+' : '−'}${formatVND(Math.abs(diff))} (${diff > 0 ? 'dư' : 'thiếu'})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
