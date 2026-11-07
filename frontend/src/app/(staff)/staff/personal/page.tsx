'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { staffService } from '@/services/mock/mockStaffService';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  TodayAttendance,
  LeaveBalance,
  Payslip,
  TipRecord,
  RecentAttendanceEntry,
} from '@/types';
import { formatVnd } from '@/lib/formatMoney';
import {
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  ChevronRight,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  AlertTriangle,
  Home,
  User,
} from 'lucide-react';

export default function PersonalPage() {
  const router = useRouter();
  const staffUser = useAuthStore((s) => s.staffUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [todayAttendance, setTodayAttendance] = React.useState<TodayAttendance | null>(null);
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance | null>(null);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [recentAttendance, setRecentAttendance] = React.useState<RecentAttendanceEntry[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Copy staff ID feedback
  const [copiedId, setCopiedId] = React.useState<boolean>(false);

  // Password form states
  const [showPasswordForm, setShowPasswordForm] = React.useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = React.useState<string>('');
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [showCurrentPw, setShowCurrentPw] = React.useState<boolean>(false);
  const [showNewPw, setShowNewPw] = React.useState<boolean>(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState<boolean>(false);
  const [pwError, setPwError] = React.useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = React.useState<boolean>(false);

  // Logout modal state & accessibility refs
  const [showLogoutModal, setShowLogoutModal] = React.useState<boolean>(false);
  const cancelLogoutBtnRef = React.useRef<HTMLButtonElement>(null);
  const logoutTriggerRef = React.useRef<HTMLButtonElement>(null);

  // Reset password form helper
  const resetPasswordForm = React.useCallback(() => {
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setPwError(null);
  }, []);

  // Trap focus and handle escape for logout modal
  React.useEffect(() => {
    if (!showLogoutModal) return;

    // Focus cancel button initially
    const timer = setTimeout(() => {
      cancelLogoutBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLogoutModal(false);
        logoutTriggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogoutModal]);

  // Toast feedback
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [todayAtt, leaveB, psList, recentAtt] = await Promise.all([
        staffService.getTodayAttendance(),
        staffService.getLeaveBalance(),
        staffService.getPayslips(),
        staffService.getRecentAttendance(),
      ]);
      setTodayAttendance(todayAtt);
      setLeaveBalance(leaveB);
      setPayslips(psList);
      setRecentAttendance(recentAtt);
    } catch {
      // Graceful fallback for mock
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived info
  const staffName = staffUser?.fullName || 'Huy';
  const staffRoleLabel =
    staffUser?.role === 'CHEF'
      ? 'Đầu bếp · Bếp chính'
      : staffUser?.role === 'MANAGER'
      ? 'Quản lý · Nhà hàng'
      : 'Nhân viên vận hành';
  const staffId = staffUser?.id === 'staff-1' ? 'NV-001' : staffUser?.id || 'NV-001';
  const rawPhone = staffUser?.phoneNumber || '0901234567';
  const maskedPhone =
    rawPhone.length >= 7
      ? `${rawPhone.slice(0, 4)} ••• ${rawPhone.slice(-3)}`
      : '0901 ••• 567';
  const initial = staffName.charAt(0).toUpperCase() || 'H';

  // Lương tháng 11
  const t11Payslip = payslips.find((p) => p.month === '2026-11') || payslips[0];
  const t11Net = t11Payslip?.netSalary || 4250000;

  // Copy handler
  const handleCopyId = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(staffId);
        setCopiedId(true);
        showToast(`Đã sao chép mã nhân viên ${staffId}`);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = staffId;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          setCopiedId(true);
          showToast(`Đã sao chép mã nhân viên ${staffId}`);
          setTimeout(() => setCopiedId(false), 2000);
        } else {
          showToast('Không sao chép được mã nhân viên. Hãy thử lại.');
        }
      }
    } catch {
      showToast('Không sao chép được mã nhân viên. Hãy thử lại.');
    }
  };

  // Submit đổi mật khẩu
  const handleSavePassword = async () => {
    setPwError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu nhập lại không khớp với mật khẩu mới');
      return;
    }
    if (newPassword === currentPassword) {
      setPwError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setPwSubmitting(true);
    try {
      await staffService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      showToast('Đã đổi mật khẩu thành công');
      resetPasswordForm();
    } catch (err) {
      setPwError((err as Error).message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setPwSubmitting(false);
    }
  };

  // Logout handler
  const handleConfirmLogout = () => {
    clearAuth();
    setShowLogoutModal(false);
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] flex flex-col font-sans">
      <div className="w-full max-w-[480px] lg:max-w-4xl mx-auto flex-1 flex flex-col pb-28 lg:pb-12 px-4 py-4 space-y-4">
        {/* Nút back về Trang chủ */}
        <div>
          <Link
            href="/staff"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-[#2B2118]" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Tiêu đề trang */}
        <div>
          <h1 className="text-xl font-bold text-[#2B2118]">Cá nhân</h1>
          <p className="text-xs text-[#7A6A58] mt-0.5">Thông tin hồ sơ và tài khoản của bạn</p>
        </div>

        {/* Top nav chỉ hiện ở bản Laptop */}
        <nav
          className="hidden lg:flex bg-white border border-[#E9E4DC] rounded-lg p-1 gap-1"
          aria-label="Điều hướng Staff Portal (bản laptop)"
        >
          <Link
            href="/staff"
            className="flex-1 min-h-[40px] rounded-md hover:bg-neutral-100 text-[#2B2118] font-bold text-sm flex items-center justify-center transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/staff/schedule"
            className="flex-1 min-h-[40px] rounded-md hover:bg-neutral-100 text-[#2B2118] font-bold text-sm flex items-center justify-center transition-colors"
          >
            Lịch ca
          </Link>
          <Link
            href="/staff/payslip"
            className="flex-1 min-h-[40px] rounded-md hover:bg-neutral-100 text-[#2B2118] font-bold text-sm flex items-center justify-center transition-colors"
          >
            Lương &amp; Tip
          </Link>
          <Link
            href="/staff/personal"
            className="flex-1 min-h-[40px] rounded-md bg-[#8C1D2C] text-white font-bold text-sm flex items-center justify-center transition-colors"
          >
            Cá nhân
          </Link>
        </nav>

        {/* Lưới nội dung 2 cột laptop / 1 cột mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ===== Khu vực 1: Hồ sơ ===== */}
          <section className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full bg-[#8C1D2C] text-white flex items-center justify-center text-xl font-bold shrink-0"
                aria-hidden="true"
              >
                {initial}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2B2118]">{staffName}</h2>
                <p className="text-xs text-[#7A6A58] mt-0.5">{staffRoleLabel}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-[#F6F4F0] pt-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#7A6A58]">Số điện thoại</span>
                <b className="text-[#141210] font-semibold">{maskedPhone}</b>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#F6F4F0]">
                <span className="text-[#7A6A58]">Mã nhân viên</span>
                <div className="flex items-center gap-2">
                  <b className="text-[#141210] font-semibold">{staffId}</b>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    aria-label="Sao chép mã nhân viên"
                    className="p-1 text-[#7A6A58] hover:text-[#8C1D2C] rounded transition-colors"
                  >
                    {copiedId ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#F6F4F0]">
                <span className="text-[#7A6A58]">Trạng thái tài khoản</span>
                <b className="text-emerald-700 font-semibold">Đang hoạt động</b>
              </div>
            </div>
          </section>

          {/* ===== Khu vực 2: Thông tin công việc ===== */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-[#7A6A58] uppercase tracking-wider mb-2">
              Thông tin công việc
            </p>
          </div>

          {/* Ca làm hôm nay */}
          <section className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-[#2B2118]">Ca làm hôm nay</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Đã vào ca</span>
            </div>

            <div className="text-2xl font-bold text-[#8C1D2C] tabular-nums">
              {todayAttendance?.shiftHours || '08:00 – 14:00'}
            </div>
            <p className="text-xs text-[#7A6A58]">Thứ Năm, 05/11/2026 · {todayAttendance?.zone || 'Bếp chính'}</p>

            <div className="space-y-1.5 text-sm border-t border-[#F6F4F0] pt-2">
              <div className="flex justify-between">
                <span className="text-[#7A6A58]">Giờ vào ca</span>
                <b className="font-semibold text-[#141210]">07:58</b>
              </div>
            </div>

            <Link
              href="/staff/attendance"
              className="w-full inline-flex min-h-[48px] items-center justify-between rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform shadow-xs"
            >
              <span>Xem chi tiết chấm công</span>
              <ChevronRight className="w-4 h-4 text-[#7A6A58]" />
            </Link>
          </section>

          {/* Chấm công gần đây */}
          <section className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#2B2118]">Chấm công gần đây</h2>
              <p className="text-xs text-[#7A6A58] mt-0.5">3 lần gần nhất</p>
            </div>

            <div className="space-y-2 text-xs">
              {recentAttendance.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F4F0] border border-[#E9E4DC]"
                >
                  <span className="font-medium text-[#2B2118]">
                    {rec.dateLabel} · {rec.time} · {rec.methodLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      rec.isLate
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {rec.statusLabel}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/staff/attendance"
              className="w-full inline-flex min-h-[48px] items-center justify-between rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform shadow-xs"
            >
              <span>Xem toàn bộ lịch sử</span>
              <ChevronRight className="w-4 h-4 text-[#7A6A58]" />
            </Link>
          </section>

          {/* ===== Khu vực 3: Tiện ích cá nhân ===== */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-[#7A6A58] uppercase tracking-wider mb-2">
              Tiện ích cá nhân
            </p>
          </div>

          <section className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs lg:col-span-2 space-y-3">
            <div className="space-y-2">
              {/* Quỹ phép */}
              <Link
                href="/staff/leave"
                className="w-full inline-flex min-h-[56px] items-center justify-between rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#8C1D2C]" />
                  <span>Quỹ phép</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-sm font-bold text-[#141210]">Còn 6 ngày</div>
                    <div className="text-[11px] text-[#7A6A58]">2 đơn chờ duyệt</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#7A6A58]" />
                </div>
              </Link>

              {/* Lương & Tip (lối tắt không hiện số tiền) */}
              <Link
                href="/staff/payslip"
                className="w-full inline-flex min-h-[56px] items-center justify-between rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-[#8C1D2C]" />
                  <span>Lương &amp; Tip</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="text-sm font-semibold text-[#7A6A58]">
                    Thông tin lương tháng 11
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#7A6A58]" />
                </div>
              </Link>
            </div>
          </section>

          {/* ===== Khu vực 4: Tài khoản & bảo mật ===== */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-[#7A6A58] uppercase tracking-wider mb-2">
              Tài khoản &amp; bảo mật
            </p>
          </div>

          <section className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs lg:col-span-2 space-y-4">
            {/* Đổi mật khẩu accordion button */}
            <button
              type="button"
              onClick={() => {
                if (showPasswordForm) {
                  resetPasswordForm();
                } else {
                  setShowPasswordForm(true);
                  setPwError(null);
                }
              }}
              aria-expanded={showPasswordForm}
              aria-controls="pwform"
              className="w-full inline-flex min-h-[48px] items-center justify-between rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-[#7A6A58]" />
                <span>Đổi mật khẩu</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-[#7A6A58] transition-transform ${
                  showPasswordForm ? 'rotate-90' : ''
                }`}
              />
            </button>

            {/* Form đổi mật khẩu mở rộng */}
            {showPasswordForm && (
              <div id="pwform" className="p-4 bg-[#F6F4F0] rounded-lg border border-[#E9E4DC] space-y-3">
                {pwError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="pw-current" className="block text-xs font-semibold text-[#7A6A58] mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      id="pw-current"
                      type={showCurrentPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full p-2.5 pr-10 bg-white border border-[#E9E4DC] rounded-lg text-sm text-[#141210] focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      aria-label={showCurrentPw ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                      className="absolute right-2 top-2 p-1.5 text-[#7A6A58]"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="pw-new" className="block text-xs font-semibold text-[#7A6A58] mb-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      id="pw-new"
                      type={showNewPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full p-2.5 pr-10 bg-white border border-[#E9E4DC] rounded-lg text-sm text-[#141210] focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      aria-label={showNewPw ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                      className="absolute right-2 top-2 p-1.5 text-[#7A6A58]"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="pw-confirm" className="block text-xs font-semibold text-[#7A6A58] mb-1">
                    Nhập lại mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      id="pw-confirm"
                      type={showConfirmPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full p-2.5 pr-10 bg-white border border-[#E9E4DC] rounded-lg text-sm text-[#141210] focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      aria-label={showConfirmPw ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                      className="absolute right-2 top-2 p-1.5 text-[#7A6A58]"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#7A6A58]">
                  Mật khẩu mới theo chính sách của nhà hàng (độ dài và độ phức tạp do backend quy định).
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={pwSubmitting}
                    onClick={handleSavePassword}
                    className="flex-1 py-2.5 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-bold rounded-lg text-sm min-h-[44px] transition-colors"
                  >
                    {pwSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                  </button>
                  <button
                    type="button"
                    onClick={resetPasswordForm}
                    className="px-4 py-2.5 bg-white border border-[#E9E4DC] hover:bg-neutral-50 text-[#2B2118] font-bold rounded-lg text-sm min-h-[44px] transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Nút Đăng xuất */}
            <button
              ref={logoutTriggerRef}
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm hover:bg-neutral-50 active:scale-98 transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#7A6A58]" />
              <span>Đăng xuất</span>
            </button>
          </section>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#7A6A58] pt-4">
          Restaurant OS · Phiên bản 1.0
        </p>
      </div>

      {/* Modal xác nhận đăng xuất */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => {
            setShowLogoutModal(false);
            logoutTriggerRef.current?.focus();
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-lg p-6 shadow-xl space-y-4 text-center"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                const focusable = e.currentTarget.querySelectorAll<HTMLButtonElement>('button');
                if (focusable.length < 2) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <h2 className="text-lg font-bold text-[#2B2118]">Đăng xuất khỏi tài khoản này?</h2>
            <p className="text-xs text-[#7A6A58]">
              Bạn sẽ cần đăng nhập lại để vào ca tiếp theo.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-bold rounded-lg text-sm min-h-[48px] transition-colors"
              >
                Đăng xuất
              </button>
              <button
                ref={cancelLogoutBtnRef}
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logoutTriggerRef.current?.focus();
                }}
                className="w-full py-3 bg-white border border-[#E9E4DC] hover:bg-neutral-50 text-[#2B2118] font-bold rounded-lg text-sm min-h-[48px] transition-colors"
              >
                Ở lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-[#141210] text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-xl z-50">
          {toastMessage}
        </div>
      )}

      {/* Bottom Nav cố định cho mobile */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E9E4DC] grid grid-cols-4 px-2 py-2 shadow-lg z-40"
        aria-label="Điều hướng Staff Portal (bản điện thoại)"
      >
        <Link
          href="/staff"
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#7A6A58] hover:text-[#2B2118] min-h-[48px]"
        >
          <Home className="h-5 w-5" />
          <span>Trang chủ</span>
        </Link>
        <Link
          href="/staff/schedule"
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#7A6A58] hover:text-[#2B2118] min-h-[48px]"
        >
          <Calendar className="h-5 w-5" />
          <span>Lịch ca</span>
        </Link>
        <Link
          href="/staff/payslip"
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#7A6A58] hover:text-[#2B2118] min-h-[48px]"
        >
          <DollarSign className="h-5 w-5" />
          <span>Lương &amp; Tip</span>
        </Link>
        <Link
          href="/staff/personal"
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-[#8C1D2C] min-h-[48px]"
        >
          <User className="h-5 w-5" />
          <span>Cá nhân</span>
        </Link>
      </nav>
    </div>
  );
}
