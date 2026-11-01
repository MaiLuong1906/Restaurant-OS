import Link from 'next/link';

const DEMOS = [
  { href: '/customer-menu', title: 'Khách — Menu QR', desc: 'Danh sách món, chi tiết món (bottom-sheet), thanh giỏ hàng.' },
  { href: '/kds-board', title: 'Bếp — KDS Board', desc: '3 cột Chờ nấu / Đang nấu / Xong, nút kds 64px, chỉ báo SLA. Ngoại lệ: giữ nền tối.' },
  { href: '/pos-demo', title: 'Thu ngân — Sơ đồ bàn POS', desc: 'Bản đồ bàn CSS grid + rail chi tiết. Không dùng Three.js.' },
  { href: '/dashboard-demo', title: 'Quản lý — Dashboard', desc: 'KPI, placeholder biểu đồ, danh sách cảnh báo.' },
  { href: '/staff-home', title: 'Nhân viên — Staff Home', desc: 'Thẻ ca hôm nay, thao tác nhanh, bottom navigation.' },
  { href: '/cafe-landing', title: 'Landing — Artisan Cafe', desc: 'Trang landing mẫu Warm Earth đủ 8 section. Ngoại lệ: giữ nguyên copy tiếng Anh của prompt.' },
];

/** Trang hub liệt kê các demo của base UI. Không phải trang nghiệp vụ thật. */
export default function DemoHubPage() {
  return (
    <main className="bg-cream">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-h1 font-semibold text-ink">Base UI — Trang demo</h1>
          <p className="text-small text-sand-600">
            Tất cả các trang dưới đây chỉ dùng component dùng chung trong src/components và token
            trong globals.css. Dữ liệu hiển thị là dữ liệu mẫu. Quy tắc đầy đủ xem frontend/BASE_README.md.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {DEMOS.map((demo) => (
            <Link
              key={demo.href}
              href={demo.href}
              className="rounded-card border border-sand-200 bg-white p-6 shadow-warm transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-warm-lg"
            >
              <p className="font-display text-h3 font-semibold text-ink">{demo.title}</p>
              <p className="text-small text-sand-600">{demo.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
