import Image from 'next/image';
import { DEMO_DISHES } from '@/lib/demo-data';
import { formatVND } from '@/lib/utils';

/**
 * Trang website khách hàng (demo) — v6, theo design system chung:
 * - Tiêu đề: Playfair Display (serif) cho heading, Be Vietnam Pro cho body.
 * - Hero v6: KHÔNG còn 4 link menu phóng to làm tiêu đề. Hero có headline thật,
 *   1 câu chốt, và CTA chính "Đặt bàn" (brand solid) + CTA phụ "Xem thực đơn"
 *   (outline trắng). Điều hướng vẫn ở header (Thực đơn / Câu chuyện / Đặt bàn).
 * - Nút bo 8px thống nhất, không còn nút góc vuông.
 *
 * Trang này TÁCH RIÊNG khỏi trang gọi món QR: khách tại quán quét mã trên bàn sẽ
 * vào luồng gọi món riêng (xem /customer-menu), không phải trang website này.
 * Toàn bộ nội dung, giá và thông tin liên hệ dưới đây là DỮ LIỆU MẪU.
 * Ảnh hero là ảnh tạo mẫu cho demo, team thay bằng ảnh thật của quán khi làm thật.
 */

const SIGNATURE_IDS = ['d1', 'd3', 'd5'];
const SIGNATURES = DEMO_DISHES.filter((dish) => SIGNATURE_IDS.includes(dish.id));

export default function DemoRestaurantWebsitePage() {
  return (
    <div className="bg-cream text-ink">
      {/* Header trong suốt phủ lên hero: nav trái, logo giữa, nút phải */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-12">
          <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 md:flex" aria-label="Chính">
            <a href="#menu" className="transition-colors hover:text-white">Thực đơn</a>
            <a href="#story" className="transition-colors hover:text-white">Câu chuyện</a>
            <a href="#reservation" className="transition-colors hover:text-white">Đặt bàn</a>
          </nav>
          <a
            href="#top"
            className="absolute left-1/2 -translate-x-1/2 font-display text-2xl font-semibold uppercase tracking-[0.3em] text-white md:text-3xl"
          >
            Sen Việt
          </a>
          <a
            href="#reservation"
            className="ml-auto rounded-lg border border-white/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-ink md:px-5"
          >
            Đặt bàn
          </a>
        </div>
      </header>

      {/* Hero toàn màn hình v6: headline thật + câu chốt + CTA Đặt bàn nổi bật */}
      <section id="top" className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <Image
          src="/images/hero-vietnamese-feast.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brown-900/45" aria-hidden="true" />
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            Nhà hàng Việt · Đà Nẵng
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight text-white md:text-7xl">
            Mâm cơm nhà, nấu từ nguyên liệu tươi mỗi sáng.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            Nước dùng ninh chậm, rau thơm hái mỗi sáng, món nào cũng vừa miệng
            như bữa cơm gia đình. Không cầu kỳ, chỉ cần tươi và thật.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#reservation"
              className="min-h-12 rounded-lg bg-primary-500 px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-warm-lg transition-colors hover:bg-primary-600"
            >
              Đặt bàn
            </a>
            <a
              href="#menu"
              className="min-h-12 rounded-lg border border-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-ink"
            >
              Xem thực đơn
            </a>
          </div>
        </div>
      </section>

      {/* Thực đơn nổi bật: hàng chữ + dotted leader, không dùng thẻ card */}
      <section id="menu" className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <h2 className="text-center font-display text-3xl font-semibold uppercase tracking-[0.15em] md:text-4xl">
          Thực đơn nổi bật
        </h2>
        <div className="mx-auto mt-6 h-px w-16 bg-primary-500" aria-hidden="true" />
        <div className="mt-12">
          {SIGNATURES.map((dish) => (
            <div key={dish.id} className="flex items-baseline gap-4 border-b border-sand-200 py-5">
              <div>
                <h3 className="font-display text-xl md:text-2xl">{dish.name}</h3>
                <p className="mt-1 text-sm text-sand-600">{dish.description}</p>
              </div>
              <span className="mx-1 flex-1 border-b border-dotted border-sand-300" aria-hidden="true" />
              <span className="font-display text-lg text-primary-700">{formatVND(dish.price)}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-sand-600">
          Giá mẫu — thực đơn đầy đủ xem khi quét mã QR tại bàn.
        </p>
      </section>

      {/* Câu chuyện: tối giản, một đoạn ngắn + điểm nhấn hình thoi */}
      <section id="story" className="border-y border-sand-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-3xl font-semibold uppercase tracking-[0.15em] md:text-4xl">
            Câu chuyện
          </h2>
          <div className="mx-auto mt-6 h-px w-16 bg-primary-500" aria-hidden="true" />
          <p className="mt-10 text-body leading-relaxed text-sand-600">
            Sen Việt nấu theo mâm cơm nhà: nước dùng ninh chậm, rau thơm hái mỗi sáng,
            món nào cũng nêm vừa miệng như bữa cơm gia đình. Không cầu kỳ, chỉ cần tươi
            và thật.
          </p>
          <div className="mx-auto mt-10 h-2 w-2 rotate-45 bg-primary-500" aria-hidden="true" />
        </div>
      </section>

      {/* Đặt bàn: dải tối, thông tin giờ + số mẫu */}
      <section id="reservation" className="bg-brown-900 text-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-3xl font-semibold uppercase tracking-[0.15em] md:text-4xl">
            Đặt bàn
          </h2>
          <div className="mx-auto mt-6 h-px w-16 bg-primary-500" aria-hidden="true" />
          <p className="mt-10 text-body text-white/80">
            Trưa 10:00 – 14:00 · Tối 17:00 – 22:00 · Mở cửa cả tuần
          </p>
          <p className="mt-4 font-display text-2xl tracking-wide md:text-3xl">0236 000 000</p>
          <p className="mt-2 text-sm text-white/60">(Số mẫu — trang demo)</p>
        </div>
      </section>

      {/* Footer 3 cột trên nền giấy sáng */}
      <footer id="contact" className="bg-cream">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 md:px-12">
          <div>
            <h3 className="font-display text-lg font-semibold uppercase tracking-[0.2em]">Liên hệ</h3>
            <p className="mt-5 text-sm leading-relaxed text-sand-600">
              123 Đường Trần Phú, Đà Nẵng (địa chỉ mẫu)
              <br />
              0236 000 000 (số mẫu)
              <br />
              chao@senviet.vn (email mẫu)
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold uppercase tracking-[0.2em]">Giờ mở cửa</h3>
            <p className="mt-5 text-sm leading-relaxed text-sand-600">
              Thứ 2 – Thứ 6: 10:00 – 14:00 · 17:00 – 22:00
              <br />
              Thứ 7 – Chủ nhật: 09:00 – 22:00
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold uppercase tracking-[0.2em]">Gọi món tại bàn</h3>
            <p className="mt-5 text-sm leading-relaxed text-sand-600">
              Khách đang ngồi tại quán quét mã QR trên bàn để vào trang gọi món riêng —
              tách biệt với trang website này.
            </p>
          </div>
        </div>
        <div className="border-t border-sand-200 py-6 text-center text-xs text-sand-600">
          © 2026 Sen Việt
        </div>
      </footer>
    </div>
  );
}
