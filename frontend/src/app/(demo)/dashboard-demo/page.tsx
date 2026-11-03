'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardLayout, OPS_NAV_ICONS } from '@/components/layouts/DashboardLayout';
import { DEMO_KPIS } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

/**
 * Demo v6 — dashboard quản lý, theo design system chung:
 * - KPI số TO (text-4xl) + sparkline Recharts, xu hướng chữ ink (không xanh/đỏ lung tung);
 *   chỉ KPI "Món quá SLA" hiển thị giá trị đỏ cảnh báo, vì đó là cảnh báo thật.
 * - KHÔNG còn gạch vàng đồng dưới tiêu đề (bronze đã xóa khỏi hệ thống).
 * - Biểu đồ cột đứng Recharts: cột brand = kỳ này, cột xám = cùng kỳ trước.
 * - Cảnh báo ưu tiên LÊN ĐẦU, bấm vào đi thẳng tới KDS/POS để xử lý.
 * - Ghi chú dev không còn lẫn trong UI: trạng thái demo chỉ còn badge "Demo" ở topbar.
 * - Tab kỳ đang chọn = nền ink trung tính, không đỏ brand.
 */

type Period = 'Hôm nay' | 'Tuần' | 'Tháng';

const CHART: Record<Period, { labels: string[]; current: number[]; last: number[] }> = {
  'Hôm nay': {
    labels: ['17:00', '18:00', '19:00', '20:00', '21:00'],
    current: [18, 32, 45, 38, 22],
    last: [15, 28, 40, 35, 20],
  },
  Tuần: {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    current: [120, 135, 110, 150, 180, 210, 190],
    last: [110, 125, 105, 140, 170, 200, 175],
  },
  Tháng: {
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    current: [520, 610, 580, 700],
    last: [500, 580, 560, 650],
  },
};

const ALERTS: Array<{ text: string; href: string }> = [
  { text: '2 món quá SLA — Bàn 04 (Nem Rán, dị ứng đậu phộng) và Bàn 09 (Lẩu Riêu Cua).', href: '/kds-board' },
  { text: '1 yêu cầu chờ duyệt — Hủy 1 đĩa do nhầm bàn.', href: '/pos-demo' },
];

const STATIONS = [
  { name: 'Khai vị & Nước uống', minutes: '6,2 phút', overdue: false },
  { name: 'Bếp Lẩu & Nước dùng', minutes: '9,8 phút', overdue: false },
  { name: 'Bếp Nướng & Chiên', minutes: '16,4 phút', overdue: true },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ops-border bg-white p-6 shadow-warm-sm">
      <h2 className="text-xl font-bold text-ops-ink">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DemoDashboardPage() {
  const [branch, setBranch] = React.useState('Ba Đình');
  const [period, setPeriod] = React.useState<Period>('Hôm nay');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const chart = CHART[period];
  const chartData = chart.labels.map((label, i) => ({
    label,
    current: chart.current[i],
    last: chart.last[i],
  }));

  return (
    <DashboardLayout
      title="Điều hành"
      navItems={[
        { label: 'Tổng quan', href: '/dashboard-demo', active: true, icon: OPS_NAV_ICONS.dashboard },
        { label: 'Sơ đồ bàn', href: '/pos-demo', icon: OPS_NAV_ICONS.tables },
        { label: 'Nhân viên', href: '/staff-management', icon: OPS_NAV_ICONS.staff },
        { label: 'Bếp KDS', href: '/kds-board', icon: OPS_NAV_ICONS.kds },
        { label: 'Báo cáo', href: '/dashboard-demo', icon: OPS_NAV_ICONS.report },
      ]}
      headerRight={
        <span className="flex items-center gap-2">
          <label className="hidden items-center gap-2 text-sm font-semibold text-ops-muted md:flex">
            Chi nhánh
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="min-h-11 rounded-lg border border-ops-border bg-white px-3 text-sm font-semibold text-ops-ink outline-none focus:border-ops-brand"
            >
              <option>Ba Đình</option>
              <option>Trần Phú</option>
              <option>Sơn Trà</option>
            </select>
          </label>
          <button type="button" aria-label="Thông báo, 3 chưa đọc" className="relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-ops-border bg-white">
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ops-alert px-1 text-xs font-bold text-white">3</span>
          </button>
          <span className="hidden flex-col leading-tight lg:flex">
            <span className="text-sm font-bold">Minh Anh · Quản lý</span>
            <span className="text-xs text-ops-muted">Ca tối 17:00–23:00</span>
          </span>
          <button type="button" className="hidden min-h-11 cursor-pointer rounded-lg border border-ops-border px-3 text-sm font-semibold hover:bg-ops-bg md:block">Đổi ca</button>
          <button type="button" className="hidden min-h-11 cursor-pointer px-3 text-sm font-semibold text-ops-muted hover:text-ops-ink md:block">Đăng xuất</button>
        </span>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-ops-muted">Trang chủ / Điều hành · {branch}</p>
          <h1 className="mt-2 text-4xl font-bold text-ops-ink">Điều hành</h1>
        </div>

        {/* Cảnh báo ưu tiên LÊN ĐẦU — không còn nằm cuối trang bị cuộn khuất. */}
        <section className="rounded-lg border border-ops-border border-l-4 border-l-ops-alert bg-ops-tint-overdue p-6" aria-label="Cần xử lý ngay">
          <h2 className="text-base font-bold text-ops-alert">Cần xử lý ngay</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {ALERTS.map((alert) => (
              <li key={alert.text}>
                <Link href={alert.href} className="text-sm font-semibold text-ops-ink underline decoration-ops-alert underline-offset-4 hover:text-ops-alert">
                  {alert.text} →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Đang tải">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border border-ops-border bg-white p-6">
                <div className="h-4 w-2/3 bg-ops-border" />
                <div className="mt-4 h-8 w-1/2 bg-ops-border" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {DEMO_KPIS.map((kpi) => (
              <article key={kpi.label} className="rounded-lg border border-ops-border bg-white p-6 shadow-warm-sm transition-shadow hover:shadow-warm">
                <p className="text-xs font-semibold uppercase tracking-wide text-ops-muted">{kpi.label}</p>
                <p className={cn('ops-nums mt-3 text-4xl font-bold', kpi.alert ? 'text-ops-alert' : 'text-ops-ink')}>{kpi.value}</p>
                <div className="mt-3 h-9" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpi.spark.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <Line type="monotone" dataKey="v" stroke={kpi.alert ? '#d14b3a' : '#2b2118'} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="ops-nums mt-2 text-sm font-semibold text-ops-ink">{kpi.trend}</p>
                <p className="mt-1 text-sm text-ops-muted">{kpi.sub}</p>
              </article>
            ))}
          </div>
        )}

        <Section title="Lưu lượng khách">
          <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Lọc thời gian">
            {(['Hôm nay', 'Tuần', 'Tháng'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'min-h-11 cursor-pointer rounded-lg border px-4 text-sm font-semibold',
                  period === p ? 'border-ops-ink bg-ops-ink text-white' : 'border-ops-border bg-white text-ops-muted hover:text-ops-ink',
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="h-64 w-full" aria-label="Biểu đồ lưu lượng khách">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="#e9e4dc" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7a6a58' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#7a6a58' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e9e4dc', fontSize: 13 }} />
                <Bar dataKey="current" name="Kỳ này" fill="#8c1d2c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="last" name="Cùng kỳ trước" fill="#e9e4dc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 flex flex-wrap gap-4 text-sm text-ops-muted">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-ops-brand" aria-hidden="true" /> Kỳ này</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-ops-border bg-ops-bg" aria-hidden="true" /> Cùng kỳ trước</span>
          </p>
        </Section>

        <Section title="Tốc độ ra món theo trạm">
          <div>
            {STATIONS.map((station) => (
              <div key={station.name} className="flex items-baseline gap-4 border-b border-ops-border py-4 last:border-b-0 last:pb-0 first:pt-0">
                <p className="text-sm font-semibold text-ops-ink">{station.name}</p>
                <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
                <p className={cn('ops-nums shrink-0 text-lg font-bold', station.overdue ? 'text-ops-alert' : 'text-ops-ink')}>
                  {station.minutes}
                  {station.overdue ? ' · Vượt SLA' : ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
