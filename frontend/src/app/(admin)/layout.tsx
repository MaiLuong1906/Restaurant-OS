'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LayoutGrid,
  FileText,
  Receipt,
  UtensilsCrossed,
  Boxes,
  Calendar,
  DollarSign,
  ShieldCheck,
  BarChart3,
  Grid3X3,
  Cpu,
  Menu,
  X,
  KeyRound,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavGroup {
  groupTitle: string;
  badge?: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: '1.0 Vận hành tại quán',
    items: [
      { label: 'Tổng quan KPI', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Sơ đồ bàn ăn', href: '/tables', icon: LayoutGrid },
      { label: 'Quản lý Hóa đơn', href: '/bills', icon: FileText },
      { label: 'Két tiền & Chốt ca', href: '/cash', icon: Receipt },
    ],
  },
  {
    groupTitle: '2.0 Thực đơn & Kho BOM',
    items: [
      { label: 'Master Menu & BOM', href: '/menu-bom', icon: UtensilsCrossed },
      { label: 'Tồn kho & Nhập PO', href: '/inventory', icon: Boxes },
    ],
  },
  {
    groupTitle: '3.0 Nhân sự & Phân quyền',
    items: [
      { label: 'Lịch ca & Phê duyệt', href: '/roster', icon: Calendar },
      { label: 'Bảng lương & Quỹ Tip', href: '/payroll', icon: DollarSign },
      { label: 'Tài khoản & Phân quyền', href: '/users', icon: ShieldCheck },
    ],
  },
  {
    groupTitle: '4.0 Tài chính & AI Hub',
    badge: 'Palace',
    items: [
      { label: 'Báo cáo P&L', href: '/pnl', icon: BarChart3 },
      { label: 'Ma trận BCG', href: '/bcg', icon: Grid3X3 },
      { label: 'AI Hub & Cấu hình', href: '/ai-hub', icon: Cpu },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [pinModalOpen, setPinModalOpen] = React.useState(false);
  const [pinPurpose, setPinPurpose] = React.useState('Xác thực quyền quản trị');
  const [pinInput, setPinInput] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = React.useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  const handleOpenPin = (purpose?: string) => {
    setPinPurpose(purpose || 'Xác thực quyền quản trị');
    setPinInput('');
    setPinModalOpen(true);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '8841' || pinInput === '9999' || pinInput.length >= 4) {
      showToast(`Mã PIN hợp lệ! Đã xác thực: ${pinPurpose}`);
      setPinModalOpen(false);
      setPinInput('');
    } else {
      showToast('Mã PIN không đúng! Vui lòng thử lại (Gợi ý: 8841 hoặc 9999).');
    }
  };

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setPinModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-ops-bg text-ops-ink font-ops antialiased flex flex-col selection:bg-ops-brand/10 selection:text-ops-brand">
      
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* =================================================================== */}
      {/* 1. LEFT SIDEBAR NAVIGATION (11 SCREENS)                              */}
      {/* =================================================================== */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-72 bg-white border-r border-ops-border z-50 flex flex-col justify-between shadow-xl lg:shadow-xs transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="h-16 px-5 sm:px-6 flex items-center justify-between border-b border-ops-border bg-white shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ops-brand text-white flex items-center justify-center shadow-xs">
                <span className="font-ops text-base font-bold tracking-wider">BP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-ops text-sm text-stone-900 tracking-wider uppercase font-bold leading-tight">
                  Bombay Palace
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-stone-600 font-semibold">
                  Connaught Village • 1982
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-ops-brand bg-ops-brand-light px-2 py-0.5 rounded border border-ops-brand/20">
                OS v7.2
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1.5 text-stone-600 hover:text-stone-900 hover:bg-ops-bg rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tree */}
          <nav className="p-4 space-y-5 flex-1" id="sidebar-nav">
            {NAV_GROUPS.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                    {group.groupTitle}
                  </span>
                  {group.badge ? (
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-bold">
                      {group.badge}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                          isActive
                            ? 'bg-ops-brand-light text-ops-brand border-l-4 border-ops-brand shadow-2xs font-bold'
                            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950 font-medium',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-ops-brand' : 'text-stone-500')} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom LAN Status Strip */}
        <div className="p-3.5 border-t border-ops-border bg-stone-50">
          <div className="flex items-center justify-between text-stone-700 font-mono text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              STOMP #POS-CONNAUGHT
            </span>
            <span className="font-bold text-stone-900">14ms</span>
          </div>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. TOP HEADER APP BAR (RESPONSIVE)                                  */}
      {/* =================================================================== */}
      <div className="pl-0 lg:pl-72 transition-[padding] duration-300 min-h-screen flex flex-col">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-ops-border z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-2xs transition-[left] duration-300">
          
          {/* Left: Mobile hamburger + Location Badge + Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-ops-ink hover:text-ops-brand hover:bg-ops-bg rounded-lg transition-colors cursor-pointer"
              aria-label="Mở menu điều hành"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden sm:flex items-center gap-2.5 py-1.5 px-3 bg-stone-100 border border-stone-200 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-600 font-bold">
                  Hệ Thống Chi Nhánh
                </span>
                <span className="text-xs font-bold text-stone-900 truncate max-w-[200px] md:max-w-none">
                  Bombay Palace Connaught Village{' '}
                  <span className="text-ops-brand font-mono font-bold hidden md:inline">• Ca Tối #02</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: PIN, Notifications, User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => handleOpenPin('Xác thực quyền quản trị')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors text-stone-900 rounded-lg cursor-pointer"
            >
              <KeyRound className="h-4 w-4 text-ops-brand" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold hidden md:inline">
                Mã PIN Quản Lý
              </span>
              <span className="font-mono text-xs uppercase font-bold md:hidden">PIN</span>
            </button>

            <button
              type="button"
              onClick={() => showToast('Hệ thống hoạt động ổn định · 0 cảnh báo khẩn.')}
              className="relative w-9 h-9 flex items-center justify-center bg-white border border-stone-200 hover:bg-stone-100 transition-colors text-stone-700 hover:text-stone-900 rounded-lg shadow-2xs cursor-pointer"
              title="Thông báo"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ops-brand ring-2 ring-white" />
            </button>

            {/* User Profile Card */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-ops-brand border border-ops-brand-dark flex items-center justify-center text-white font-ops text-xs font-bold shrink-0 shadow-2xs">
                LN
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-stone-900 leading-tight">Lương Nguyễn</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                  Chủ Nhà Hàng
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================================== */}
        {/* 3. MAIN CONTENT ROUTE AREA                                          */}
        {/* =================================================================== */}
        <main className="relative pt-16 bg-ops-bg min-h-screen flex-1">
          {children}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* GLOBAL MANAGER PIN MODAL                                              */}
      {/* ===================================================================== */}
      {pinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác Thực Mã PIN Quản Lý"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
        >
          <div className="bg-white border border-ops-border rounded-xl shadow-2xl w-full max-w-sm p-4 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-6 w-6 text-ops-brand" />
                <div>
                  <h3 className="font-ops text-base font-bold text-ops-ink">Xác Thực Mã PIN Quản Lý</h3>
                  <span className="font-mono text-[11px] text-ops-muted">Audit Log #AUTH-PIN</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-ops-border hover:bg-ops-bg flex items-center justify-center text-ops-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div className="p-3 bg-ops-bg rounded-lg border border-ops-border text-xs space-y-1">
                <span className="text-ops-muted block">Hành động yêu cầu xác thực:</span>
                <span className="font-bold text-ops-ink block">{pinPurpose}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ops-ink mb-1.5 text-center">
                  Nhập mã PIN Quản lý (4 chữ số)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full py-3 px-4 bg-ops-bg border border-ops-border rounded-xl font-mono text-center text-2xl tracking-[0.5em] font-bold text-ops-ink focus:outline-none focus:border-ops-brand"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-ops-muted">
                <span>Quên mã PIN? Liên hệ Chủ quán</span>
                <span className="font-mono text-ops-brand font-semibold">Gợi ý: 8841 / 9999</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="flex-1 py-2.5 border border-ops-border hover:bg-ops-bg text-ops-muted rounded-lg font-mono text-xs uppercase font-semibold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg font-mono text-xs uppercase font-bold shadow-xs cursor-pointer"
                >
                  Xác Nhận PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* GLOBAL TOAST NOTIFICATION CONTAINER                                  */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-ops-ink text-white text-xs font-semibold rounded-xl shadow-xl border border-ops-border animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

