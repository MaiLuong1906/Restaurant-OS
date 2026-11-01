import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DEMO_KPIS, DEMO_ALERTS } from '@/lib/demo-data';

/** Chiều cao cột biểu đồ theo class Tailwind (không dùng inline style). */
const BAR_HEIGHTS = ['h-16', 'h-28', 'h-36', 'h-32', 'h-20'];

/**
 * Demo: dashboard điều hành — KPI + placeholder biểu đồ + danh sách cảnh báo. Dữ liệu mẫu.
 * Thứ bậc: giá trị KPI là yếu tố trội duy nhất (font serif, cỡ h2); biểu đồ và cảnh báo phụ.
 */
export default function DemoDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard Điều Hành — Demo"
      headerRight={<span className="text-sm font-semibold text-sand-600">Chi nhánh Ba Đình</span>}
      sidebar={
        <nav className="flex flex-col gap-1 text-sm font-semibold">
          <span className="rounded-card bg-primary-100 px-3 py-2 text-primary-700">Tổng quan</span>
          <span className="rounded-card px-3 py-2 text-sand-600">Sơ đồ bàn</span>
          <span className="rounded-card px-3 py-2 text-sand-600">Giám sát SLA bếp</span>
          <span className="rounded-card px-3 py-2 text-sand-600">Chốt ca &amp; két</span>
          <span className="rounded-card px-3 py-2 text-sand-600">Nhập kho</span>
        </nav>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-sand-600">Trang demo — dữ liệu mẫu, chưa nối API.</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {DEMO_KPIS.map((kpi) => (
            <Card key={kpi.label} title={kpi.label} description={kpi.sub}>
              <p className="font-display text-h2 font-semibold text-ink">{kpi.value}</p>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Lưu lượng khách & bàn theo giờ" description="Placeholder biểu đồ — nối dữ liệu thật ở Sprint 2+.">
            <div className="flex h-40 items-end gap-2">
              {BAR_HEIGHTS.map((heightClass, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`w-full rounded-t bg-primary-500 ${heightClass}`} />
                  <span className="text-xs text-sand-600">{17 + i}:00</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Tốc độ ra món theo trạm" description="Placeholder biểu đồ — nối dữ liệu thật ở Sprint 2+.">
            <div className="flex flex-col gap-2 text-sm">
              <p>Khai vị &amp; Nước uống — 6,2 phút</p>
              <p>Bếp Lẩu &amp; Nước dùng — 9,8 phút</p>
              <p>Bếp Nướng &amp; Chiên — 16,4 phút <Badge variant="sla-overdue">Vượt SLA</Badge></p>
            </div>
          </Card>
        </div>
        <Card title="Cảnh báo & phê duyệt">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            {DEMO_ALERTS.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
