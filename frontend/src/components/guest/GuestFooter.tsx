import * as React from 'react';
import Link from 'next/link';

export function GuestFooter() {
  const quickLinks = [
    { label: 'Thực đơn', href: '/menu' },
    { label: 'Về quán', href: '#about' },
    { label: 'Món nổi bật', href: '#featured' },
    { label: 'Hub điều hướng', href: '/hub' },
  ];

  return (
    <footer id="contact" className="bg-[#141210] border-t border-[#2C2620] text-[#A89B8C] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8C1D2C]" />
              <span className="text-xl font-bold tracking-tight text-[#F5F2EA]">Phố Cổ</span>
            </div>
            <p className="text-sm leading-relaxed text-[#A89B8C]">
              Ẩm thực di sản &amp; truyền thống Hà Nội. Gìn giữ tinh hoa gia vị cổ truyền Bắc Bộ và mang đến trải nghiệm ẩm thực ấm cúng trọn vẹn.
            </p>
          </div>

          {/* Column 2 — Quick navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F2EA] mb-4">
              Điều hướng
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#A89B8C] hover:text-[#E9E4DC] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact / Visit guidance */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F2EA] mb-4">
              Liên hệ
            </h3>
            <div className="space-y-3 text-sm text-[#A89B8C] leading-relaxed">
              <p>
                Kính mời quý thực khách ghé thăm trực tiếp nhà hàng để tận hưởng trọn vẹn hương vị truyền thống trong không gian ấm cúng.
              </p>
              <p>
                Quý khách có thể đặt bàn trực tuyến trước qua website để được phục vụ chu đáo nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-[#2C2620] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A89B8C]">
          <p>© 2026 Phố Cổ Dine. All rights reserved.</p>
          <p className="text-xs text-[#A89B8C]/80">Di sản &amp; Ẩm thực truyền thống</p>
        </div>
      </div>
    </footer>
  );
}
