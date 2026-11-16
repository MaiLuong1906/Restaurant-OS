'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { HomeHero } from '@/components/guest/HomeHero';
import { FeaturedDishes } from '@/components/guest/FeaturedDishes';
import { AboutSection } from '@/components/guest/AboutSection';
import { GuestFooter } from '@/components/guest/GuestFooter';
import { AiChatWidget } from '@/components/guest/AiChatWidget';

export default function GuestHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleBooking = () => {
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('phoco:open-booking'));
    }
  };

  const navLinks = [
    { label: 'Thực đơn', href: '/menu', isExternal: false },
    { label: 'Về quán', href: '#about', isExternal: false },
    { label: 'Ưu đãi', href: '#offers', isExternal: false },
    { label: 'Liên hệ', href: '#contact', isExternal: false },
    { label: 'Hub', href: '/hub', isExternal: false },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EA] text-[#141210] font-sans antialiased selection:bg-[#8C1D2C] selection:text-white">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F2EA]/95 backdrop-blur-md border-b border-[#E9E4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-[#8C1D2C] flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#8C1D2C]" />
            Phố Cổ
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#7A6A58] hover:text-[#141210] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={handleBooking}
              className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 rounded-lg bg-[#8C1D2C] hover:bg-[#6F1623] text-white text-sm font-semibold transition-colors active:scale-[0.98] shadow-xs"
            >
              Đặt bàn
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleBooking}
              className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#8C1D2C] text-white text-xs font-semibold active:scale-[0.98]"
            >
              Đặt bàn
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-lg text-[#7A6A58] hover:text-[#141210] hover:bg-[#E9E4DC]/50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E9E4DC] bg-[#F5F2EA] px-4 pt-2 pb-4 space-y-1 shadow-sm">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#141210] hover:bg-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBooking}
                className="w-full flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg bg-[#8C1D2C] text-white text-sm font-semibold active:scale-[0.98]"
              >
                Đặt bàn ngay
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {/* Full-viewport Hero */}
        <HomeHero onBookTable={handleBooking} />

        {/* Featured Dishes Section */}
        <FeaturedDishes />

        {/* About Section */}
        <AboutSection />

        {/* Minimal Anchor Targets for Non-broken Links */}
        <section id="offers" className="py-16 px-4 max-w-5xl mx-auto border-t border-[#E9E4DC]">
          <h2 className="text-2xl font-bold text-[#141210] mb-3">Ưu đãi hôm nay</h2>
          <p className="text-sm text-[#7A6A58] leading-relaxed max-w-2xl">
            Nhận ngay voucher ưu đãi đặt bàn sớm trong khung giờ vàng và các combo trải nghiệm ẩm thực đặc sắc.
          </p>
        </section>
      </main>

      {/* Guest Footer */}
      <GuestFooter />

      {/* AI Chat Widget */}
      <AiChatWidget />
    </div>
  );
}
