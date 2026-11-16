'use client';

import * as React from 'react';
import Link from 'next/link';

interface HomeHeroProps {
  onBookTable?: () => void;
}

export function HomeHero({ onBookTable }: HomeHeroProps) {
  const handleBooking = () => {
    if (onBookTable) {
      onBookTable();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('phoco:open-booking'));
    }
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center items-center text-center px-4 pt-20 pb-12 bg-[#F5F2EA] text-[#141210] overflow-hidden">
      {/* Background Texture / Subtle Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#E9E4DC_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Decorative Brand Accent Dot */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E9E4DC] bg-white/80 shadow-xs text-xs font-medium text-[#7A6A58]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8C1D2C]" />
          Ẩm Thực Truyền Thống Hà Nội
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#141210] leading-tight">
          Phố Cổ
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#7A6A58] max-w-xl mx-auto leading-relaxed font-normal">
          Nơi lưu giữ tinh hoa hương vị đất Hà Thành, mang đến trải nghiệm ẩm thực ấm cúng và trọn vẹn cho từng thực khách.
        </p>

        {/* 2 Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
          <Link
            href="/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-lg bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold text-sm transition-colors active:scale-[0.98] shadow-sm"
          >
            Xem thực đơn
          </Link>

          <button
            type="button"
            onClick={handleBooking}
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-lg border border-[#E9E4DC] bg-white hover:bg-[#F5F2EA] text-[#141210] font-semibold text-sm transition-colors active:scale-[0.98] shadow-xs"
          >
            Đặt bàn
          </button>
        </div>
      </div>
    </section>
  );
}
