import Link from 'next/link';
import { UtensilsCrossed, Monitor, CreditCard, LayoutDashboard, Sparkles, ChefHat, QrCode } from 'lucide-react';

export default function HomePage() {
  const modules = [
    {
      title: 'Khách Gọi Món QR',
      description: 'Khách hàng quét mã tại bàn, xem thực đơn 3D mượt mà, đặt món realtime.',
      href: '/qr/table-01',
      icon: QrCode,
      tag: 'Customer Portal',
      badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      action: 'Thử nghiệm Bàn 01',
    },
    {
      title: 'Màn Hình Bếp KDS',
      description: 'Điều phối chế biến realtime (<50ms), gom món thông minh, nền tối #0B0F14.',
      href: '/kds',
      icon: ChefHat,
      tag: 'Kitchen Display',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      action: 'Vào Bếp Chế Biến',
    },
    {
      title: 'Thu Ngân & Bàn Ăn POS',
      description: 'Quản lý sơ đồ bàn, gộp bàn, thanh toán QR VietQR & MoMo chuẩn xác.',
      href: '/pos',
      icon: CreditCard,
      tag: 'Point of Sale',
      badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      action: 'Mở Quầy Thu Ngân',
    },
    {
      title: 'Quản Trị & Kho BOM',
      description: 'Kiểm soát hao hụt nguyên vật liệu theo định lượng thực đơn, báo cáo doanh thu.',
      href: '/dashboard',
      icon: LayoutDashboard,
      tag: 'Back Office',
      badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      action: 'Xem Báo Cáo',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-[#0B0F14] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Restaurant OS
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                v1.0 Monorepo
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống sẵn sàng</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span>Kiến trúc Microservices & Realtime STOMP WebSocket</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Hệ Điều Hành Quản Trị & Vận Hành{' '}
          <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Nhà Hàng Toàn Diện
          </span>
        </h1>
        <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Tối ưu hóa quy trình từ lúc khách quét QR, tự động phân phối đơn tới bếp KDS trong &lt;50ms,
          tự động trừ kho nguyên vật liệu BOM và thanh toán đa kênh.
        </p>
      </section>

      {/* Modules Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-orange-500/40 hover:bg-slate-900/90 transition-all duration-300 shadow-xl hover:shadow-orange-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${m.badgeColor}`}>
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {m.description}
                  </p>
                </div>

                <Link
                  href={m.href}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-orange-600 text-xs font-semibold text-slate-200 hover:text-white transition-all duration-200 border border-slate-700/60 hover:border-orange-500 shadow"
                >
                  {m.action} &rarr;
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950/80 text-xs text-slate-500 text-center">
        <p>Restaurant OS Monorepo &bull; Next.js 15 App Router &bull; Spring Boot 3 &bull; FastAPI AI Whisper &bull; PostgreSQL Supabase</p>
      </footer>
    </main>
  );
}
