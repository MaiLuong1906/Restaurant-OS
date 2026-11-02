import type { Metadata } from 'next';
import { Playfair_Display, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

// Design system v6 — CHỈ 2 họ font:
// - Playfair Display: tiêu đề website khách (font-display), hỗ trợ tiếng Việt.
// - Be Vietnam Pro: mọi thứ còn lại (font-sans = body website + font-ops = app vận hành).
// Tên biến PHẢI khác tên token --font-display/--font-sans/--font-ops trong @theme.
const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Restaurant OS — Hệ Điều Hành Nhà Hàng Thế Hệ Mới',
  description: 'Nền tảng vận hành nhà hàng F&B toàn diện: QR Order, Bếp KDS thông minh, Thu ngân POS và Định lượng BOM tự động.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${playfair.variable} ${beVietnamPro.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
