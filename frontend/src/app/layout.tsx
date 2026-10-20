import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#0B0F14] dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
