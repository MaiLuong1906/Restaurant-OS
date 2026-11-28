'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/lib/auth-service';
import { staffLeavePayrollService } from '@/services/staffLeavePayrollService';
import { getDiscountCeiling } from '@/lib/rbac';
import { formatVND } from '@/lib/utils';
import { Payslip, TipMonthSummary } from '@/types';
import {
  User,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Building2,
  Percent,
  Cpu,
  Clock,
  AlertCircle,
  ArrowRight,
  LogOut,
  DollarSign,
  Wallet,
  CalendarCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffUser = useAuthStore((s) => s.staffUser);
  const permissions = useAuthStore((s) => s.permissions);

  const initialTab = searchParams.get('tab') === 'payslip' ? 'payslip' : 'overview';
  const [activeTab, setActiveTab] = React.useState<'overview' | 'payslip'>(initialTab);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'payslip') {
      setActiveTab('payslip');
    } else if (tab === 'overview') {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const [copiedId, setCopiedId] = React.useState(false);

  // Dữ liệu Phiếu lương & Tip cá nhân
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [tipMonths, setTipMonths] = React.useState<TipMonthSummary[]>([]);
  const [isLoadingPayroll, setIsLoadingPayroll] = React.useState(false);
  const [payrollError, setPayrollError] = React.useState<string | null>(null);

  // Toast message
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Tải dữ liệu lương cá nhân khi chuyển tab hoặc mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadPersonalPayroll() {
      setIsLoadingPayroll(true);
      setPayrollError(null);
      try {
        const [ps, tms] = await Promise.all([
          staffLeavePayrollService.getPayslips(),
          staffLeavePayrollService.getTipMonths(),
        ]);
        if (isMounted) {
          setPayslips(ps);
          setTipMonths(tms);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setPayrollError('Không thể tải thông tin phiếu lương. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) setIsLoadingPayroll(false);
      }
    }

    loadPersonalPayroll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tính toán thông tin hiển thị theo role
  const roleName = React.useMemo(() => {
    switch (staffUser?.role) {
      case 'OWNER':
        return 'Chủ Nhà Hàng';
      case 'MANAGER':
        return 'Quản Lý Vận Hành';
      case 'CASHIER':
        return 'Thu Ngân';
      case 'CHEF':
        return 'Bếp Trưởng';
      case 'WAITER':
        return 'Nhân Viên Phục Vụ';
      default:
        return 'Nhân Sự Quản Trị';
    }
  }, [staffUser]);

  const initials = React.useMemo(() => {
    if (!staffUser?.fullName) return 'AD';
    const parts = staffUser.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [staffUser]);

  const discountCeiling = React.useMemo(() => {
    return getDiscountCeiling(staffUser?.role);
  }, [staffUser]);

  const rawPhone = staffUser?.phoneNumber?.trim() || '';
  const maskedPhone =
    rawPhone.length >= 7
      ? `${rawPhone.slice(0, 4)} ••• ${rawPhone.slice(-3)}`
      : rawPhone || 'Chưa cập nhật';

  const staffId = staffUser?.id || 'ADM-001';

  const handleCopyId = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(staffId);
        setCopiedId(true);
        showToast('Đã sao chép mã tài khoản!');
        setTimeout(() => setCopiedId(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleLogout = () => {
    authService.logoutStaff();
    router.push('/login');
  };

  const latestPayslip = payslips[0] || null;
  const latestTipMonth = tipMonths[0] || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* 1. Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-ops-border">
        <div>
          <h1 className="font-ops text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
            Hồ Sơ Quản Trị &amp; Tài Khoản
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Thông tin định danh, thẩm quyền phê duyệt ngoại lệ và thu nhập cá nhân của {roleName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-rose-50 text-rose-700 hover:border-rose-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <User className="w-4 h-4 text-ops-brand" />
          <span>Hồ Sơ &amp; Thẩm Quyền</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payslip')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payslip'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Phiếu Lương &amp; Quỹ Tip Cá Nhân</span>
          {latestPayslip && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. TAB 1: TỔNG QUAN HỒ SƠ & THẨM QUYỀN */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* Cột trái (2/3): Thông tin cá nhân & Thẩm quyền quản trị */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Định danh cá nhân */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5 border-b border-stone-100">
                <div className="w-16 h-16 rounded-full bg-ops-brand text-white flex items-center justify-center font-ops text-2xl font-bold shrink-0 shadow-xs ring-4 ring-ops-brand/10">
                  {initials}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900 truncate">
                      {staffUser?.fullName || 'Nguyễn Chủ Quán'}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-ops-brand text-white text-[11px] font-mono font-bold uppercase rounded-md tracking-wider">
                      {roleName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      Bombay Palace Connaught Village
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="p-5 sm:p-6 divide-y divide-stone-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-stone-600 font-medium">Số điện thoại đăng nhập:</span>
                  <span className="font-mono font-bold text-stone-900">{maskedPhone}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-stone-600 font-medium">Mã nhân sự / Định danh:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-stone-800 text-xs truncate max-w-[200px] sm:max-w-none">
                      {staffId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                      title="Sao chép mã"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-stone-600 font-medium">Vai trò hệ thống:</span>
                  <span className="font-mono text-ops-brand font-bold uppercase">
                    {staffUser?.role || 'OWNER'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-stone-600 font-medium">Quyền hạn cấp phát:</span>
                  <span className="font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                    {permissions.length} quyền nguyên tử
                  </span>
                </div>
              </div>
            </div>

            {/* Card Thẩm quyền phê duyệt */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <ShieldCheck className="w-5 h-5 text-ops-brand" />
                <h3 className="font-ops text-sm font-bold text-stone-900">
                  Thẩm Quyền Phê Duyệt &amp; Quản Trị
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Box 1: Hạn mức chiết khấu */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-600 text-xs">
                    <span className="font-medium">Hạn mức chiết khấu hóa đơn</span>
                    <Percent className="w-4 h-4 text-ops-brand" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-stone-900">
                    {discountCeiling}%
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {discountCeiling === 100
                      ? 'Toàn quyền duyệt giảm giá & miễn phí hóa đơn'
                      : `Hạn mức tối đa được phép duyệt trong ca: ${discountCeiling}%`}
                  </p>
                </div>

                {/* Box 2: Trạng thái mã PIN Quản lý */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-600 text-xs">
                    <span className="font-medium">Mã PIN Duyệt Ngoại Lệ Trạm</span>
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-base font-mono font-bold text-emerald-700 flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ĐÃ KÍCH HOẠT
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Dùng xác thực hủy món bếp KDS, hoàn tiền &amp; chốt ca két
                  </p>
                </div>
              </div>

              {/* Chỉ OWNER mới thấy link dẫn sang Quản trị tài khoản toàn quán */}
              {staffUser?.role === 'OWNER' && (
                <div className="pt-2">
                  <Link
                    href="/users"
                    className="flex items-center justify-between p-3 rounded-lg border border-ops-brand/20 bg-ops-brand-light/30 hover:bg-ops-brand-light/60 transition-colors text-xs text-ops-brand font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-ops-brand" />
                      <span>Đi tới bảng Quản trị Tài khoản &amp; Phân quyền RBAC</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải (1/3): Đổi mật khẩu & Phiên kết nối */}
          <div className="space-y-6">
            {/* Form đổi mật khẩu trực tiếp (Tạm vô hiệu hóa - chờ Backend cung cấp API ở Sprint tới) */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-ops-brand" />
                  <h3 className="font-ops text-sm font-bold text-stone-900">Đổi Mật Khẩu</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold border border-stone-200">
                  Sắp có (Sprint tới)
                </span>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 text-xs text-stone-600">
                <p className="font-semibold text-stone-800">Tính năng đang trong lộ trình phát triển</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Để đảm bảo an toàn bảo mật tài khoản, chức năng đổi mật khẩu trực tiếp sẽ được kích hoạt ngay khi Backend hoàn tất endpoint xác thực ở Sprint tiếp theo.
                </p>
              </div>

              <div className="space-y-3 opacity-60">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    disabled
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-lg text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    disabled
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-lg text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    disabled
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-lg text-xs cursor-not-allowed select-none"
                  />
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 bg-stone-200 text-stone-500 rounded-lg font-mono text-xs uppercase font-bold cursor-not-allowed shadow-none"
                >
                  Chức Năng Sắp Ra Mắt
                </button>
              </div>
            </div>

            {/* Trạng thái kết nối trạm */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-ops-brand" />
                  Kết nối STOMP Realtime
                </span>
                <span className="font-mono font-bold text-emerald-700">14ms</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  Phiên làm việc
                </span>
                <span className="font-mono text-stone-800">Hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: PHIẾU LƯƠNG & QUỸ TIP CÁ NHÂN */}
      {activeTab === 'payslip' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {isLoadingPayroll ? (
            <div className="p-12 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
              <Clock className="w-6 h-6 animate-spin mx-auto text-ops-brand mb-2" />
              <span>Đang tải thông tin thu nhập và phiếu lương của bạn...</span>
            </div>
          ) : payrollError ? (
            <div className="p-8 text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto text-rose-600" />
              <p className="text-sm font-semibold">{payrollError}</p>
            </div>
          ) : !latestPayslip ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Chưa có phiếu lương kỳ này</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Dữ liệu phiếu lương của bạn sẽ hiển thị tại đây sau khi Ban Quản Lý chốt và quyết toán kỳ lương.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thẻ Lương Tháng Gần Nhất */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-stone-900">
                        Phiếu Lương Kỳ {latestPayslip.monthLabel || '—'}
                      </h2>
                      <span className="text-xs text-stone-500 font-mono">
                        {latestPayslip.periodLabel || 'Kỳ quyết toán'}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full w-fit">
                    {latestPayslip.paymentStatus || 'CHỜ QUYẾT TOÁN'}
                  </span>
                </div>

                {/* Thực Lĩnh Highlight */}
                <div className="p-5 rounded-2xl bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                  <div>
                    <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider block">
                      Thu Nhập Thực Lĩnh (Net Salary)
                    </span>
                    <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white mt-1 block">
                      {formatVND(latestPayslip.netSalary ?? 0)}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-200/80 space-y-1 sm:text-right">
                    <div>
                      Ngày chi trả:{' '}
                      <span className="font-semibold text-white">
                        {latestPayslip.paymentDateLabel || '—'}
                      </span>
                    </div>
                    <div>
                      Hình thức:{' '}
                      <span className="font-semibold text-white">Chuyển khoản ngân hàng</span>
                    </div>
                  </div>
                </div>

                {/* Chi tiết các cấu phần lương */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                    <span className="text-stone-500 block">Lương cơ bản / Giờ</span>
                    <span className="text-base font-mono font-bold text-stone-900 block">
                      {formatVND(latestPayslip.baseSalary ?? 0)}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {latestPayslip.workedHours ?? 0} giờ công thực tế
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                    <span className="text-amber-800 font-medium block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Tiền Tip ca trực
                    </span>
                    <span className="text-base font-mono font-bold text-amber-900 block">
                      {formatVND(latestPayslip.tipAmount ?? 0)}
                    </span>
                    <span className="text-[11px] text-amber-700">Theo phân bổ ca trực</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                    <span className="text-stone-500 block">Phụ cấp &amp; Thưởng</span>
                    <span className="text-base font-mono font-bold text-stone-900 block">
                      {formatVND((latestPayslip.allowance ?? 0) + (latestPayslip.bonus ?? 0))}
                    </span>
                    <span className="text-[11px] text-stone-500">Phụ cấp trách nhiệm ca</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                    <span className="text-stone-500 block">Các khoản giảm trừ</span>
                    <span className="text-base font-mono font-bold text-rose-700 block">
                      -{formatVND(latestPayslip.deductions ?? 0)}
                    </span>
                    <span className="text-[11px] text-stone-500">BHXH &amp; Giảm trừ</span>
                  </div>
                </div>
              </div>

              {/* Tóm tắt Quỹ Tip & Lịch sử phiếu lương */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Box Quỹ Tip */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-ops-brand" />
                      <h3 className="text-sm font-bold text-stone-900">
                        Quỹ Tip Tháng {latestTipMonth?.monthLabel || '—'}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-ops-brand">
                      {latestTipMonth ? formatVND(latestTipMonth.totalAmount ?? 0) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Quỹ Tip nhà hàng được phân bổ công bằng theo giờ công và điểm trách nhiệm của từng
                    ca trực đã hoàn thành.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-xs text-stone-500 font-mono">
                    <span>Số ca nhận Tip: {latestTipMonth?.dailyEntries?.length ?? '—'}</span>
                    <span>Trạng thái: {latestTipMonth?.paymentStatus === 'PAID' ? 'Đã chi trả' : 'Chờ phân bổ'}</span>
                  </div>
                </div>

                {/* Box Minh bạch thông tin */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                    <CalendarCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-stone-900">Minh Bạch &amp; Khiếu Nại</h3>
                  </div>
                  <p className="text-xs text-stone-600">
                    Nếu phát hiện sai sót về số giờ công hoặc tiền Tip phân bổ, vui lòng gửi phản hồi
                    trực tiếp cho Quản lý hoặc Chủ Nhà Hàng.
                  </p>
                  <div className="pt-1 text-xs text-stone-500 font-mono">
                    Hotline quản trị nội bộ: <span className="font-bold text-stone-800">1900 8841</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-stone-500">Đang tải hồ sơ quản trị...</div>
      }
    >
      <ProfileContent />
    </React.Suspense>
  );
}
