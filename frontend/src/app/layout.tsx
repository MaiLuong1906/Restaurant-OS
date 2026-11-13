import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Design system v6 — CHỈ 2 họ font:
// - Playfair Display: tiêu đề website khách (font-display), hỗ trợ tiếng Việt.
// - Be Vietnam Pro: mọi thứ còn lại (font-sans = body website + font-ops = app vận hành).
// Tự host trong src/app/fonts để build Docker / CI hoàn toàn offline, không phụ thuộc Google Fonts API.
// Tên biến PHẢI khác tên token --font-display/--font-sans/--font-ops trong @theme.
const playfair = localFont({
  src: [
    { path: './fonts/playfair-display-500-normal.ttf', weight: '500', style: 'normal' },
    { path: './fonts/playfair-display-600-normal.ttf', weight: '600', style: 'normal' },
    { path: './fonts/playfair-display-700-normal.ttf', weight: '700', style: 'normal' },
    { path: './fonts/playfair-display-500-italic.ttf', weight: '500', style: 'italic' },
    { path: './fonts/playfair-display-600-italic.ttf', weight: '600', style: 'italic' },
    { path: './fonts/playfair-display-700-italic.ttf', weight: '700', style: 'italic' },
  ],
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const beVietnamPro = localFont({
  src: [
    { path: './fonts/be-vietnam-pro-400-normal.ttf', weight: '400', style: 'normal' },
    { path: './fonts/be-vietnam-pro-500-normal.ttf', weight: '500', style: 'normal' },
    { path: './fonts/be-vietnam-pro-600-normal.ttf', weight: '600', style: 'normal' },
    { path: './fonts/be-vietnam-pro-700-normal.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-be-vietnam',
  display: 'swap',
  fallback: ['Inter', 'system-ui', 'sans-serif'],
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
