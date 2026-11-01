import { StaffLayout } from '@/components/layouts/StaffLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const NAV = [
  { id: 'home', label: 'Trang chủ', href: '/staff-home' },
  { id: 'schedule', label: 'Lịch ca', href: '/staff-home' },
  { id: 'salary', label: 'Lương & Tip', href: '/staff-home' },
  { id: 'me', label: 'Cá nhân', href: '/staff-home' },
];

/**
 * Demo: Staff Portal Home — thẻ ca hôm nay + thao tác nhanh + bottom nav. Dữ liệu mẫu.
 * Hành động chính duy nhất của màn hình là "Check-out kết ca" (primary solid);
 * các thao tác còn lại là ghost/secondary để không tranh spotlight.
 */
export default function DemoStaffHomePage() {
  return (
    <StaffLayout
      headerLeft={<span className="text-base font-bold">Chào buổi tối, Minh Anh</span>}
      headerRight={<Badge variant="success">Đang trong ca</Badge>}
      navItems={NAV}
      activeNavId="home"
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-sand-600">Trang demo — dữ liệu mẫu, chưa nối API.</p>
        <Card title="Ca hôm nay — Ca tối 17:00–23:00" description="Sảnh Tầng 1 (Khu VIP & Sân vườn) — Check-in lúc 16:52, đúng giờ.">
          <div className="flex flex-col gap-4">
            <p className="text-sm">Phụ trách: Bàn 04 (khách VIP) — lưu ý dị ứng đậu phộng.</p>
            <div className="flex gap-2">
              <Button size="md">Check-out kết ca</Button>
              <Button size="md" variant="ghost">Nghỉ giữa ca 15p</Button>
            </div>
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-h3 font-semibold text-ink">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-4">
            {['Chấm công', 'Lịch ca trực', 'Xin nghỉ phép', 'Lương & Tip'].map((label) => (
              <Button key={label} size="lg" variant="ghost" className="border border-sand-200 bg-white">
                {label}
              </Button>
            ))}
          </div>
        </div>
        <Card title="Phiếu lương tạm tính — Tháng 10">
          <div className="flex flex-col gap-1">
            <p className="font-display text-h2 font-semibold text-ink">11.450.000 ₫</p>
            <p className="text-sm text-sand-600">Lương giờ công 156 giờ + thưởng KPI + tip tích lũy.</p>
          </div>
        </Card>
        <Card title="Quỹ phép">
          <p className="text-sm">Phép năm còn lại: <strong>7,5 ngày</strong> (đã dùng 4,5 ngày).</p>
        </Card>
      </div>
    </StaffLayout>
  );
}
