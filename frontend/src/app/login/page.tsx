'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import { useAuthStore } from '@/stores/useAuthStore';
import { StaffUser } from '@/types';
import {
  UtensilsCrossed,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Loader2,
} from 'lucide-react';

function homeHrefForRole(role?: string): string {
  switch (role) {
    case 'CHEF':
    case 'MANAGER':
      return '/chef';
    case 'CASHIER':
      return '/pos';
    case 'STAFF':
    default:
      return '/chef';
  }
}

export default function StaffLoginPage() {
  const router = useRouter();
  const staffUser = useAuthStore((s) => s.staffUser);

  const [phoneNumber, setPhoneNumber] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [rememberMe, setRememberMe] = React.useState<boolean>(false);

  // States: 'FORM' | 'LOCKED' | 'SUCCESS'
  const [authState, setAuthState] = React.useState<'FORM' | 'LOCKED' | 'SUCCESS'>('FORM');
  const [failedAttempts, setFailedAttempts] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [showForgotHint, setShowForgotHint] = React.useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = React.useState<StaffUser | null>(null);

  // Auto redirect sau khi đăng nhập thành công ~1.5s
  React.useEffect(() => {
    if (authState !== 'SUCCESS') return;
    const timer = setTimeout(() => {
      const destination = homeHrefForRole(loggedInUser?.role || staffUser?.role);
      router.push(destination);
    }, 1500);
    return () => clearTimeout(timer);
  }, [authState, router, loggedInUser, staffUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || authState === 'LOCKED') return;

    // Reset error
    setPhoneError(null);
    setPasswordError(null);
    setGeneralError(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      setPhoneError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setPhoneError('Nhập số điện thoại 10 số, bắt đầu bằng 0.');
      return;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Mật khẩu có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.loginStaff({
        phoneNumber: cleanPhone,
        password,
      });
      setLoggedInUser(res.user);
      setFailedAttempts(0);
      setAuthState('SUCCESS');
    } catch (err) {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);

      if (nextFailed >= 3) {
        setAuthState('LOCKED');
      } else {
        const remaining = 3 - nextFailed;
        setGeneralError(
          `Thông tin đăng nhập không chính xác. Còn ${remaining} lần thử trước khi tài khoản bị khóa tạm thời.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetLockout = () => {
    setAuthState('FORM');
    setFailedAttempts(0);
    setPassword('');
    setGeneralError(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-x-hidden">
      {/* Background image & overlays */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center filter blur-[4px] scale-105 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAKPBLADASIAAhEBAxEB/8QAHAAAAQUBAQEAAAAAAAAAAAAAAwECBAUGAAcI/8QARhAAAQQBAwIFAgMGBAUDAwIHAQACAxEEBSExEkEGEyJRYRRxMoGRBxUjQlKhFjNiwUNygrHRJFPhNJLxY6LwREVUc4Oy/8QAGgEAAwEBAQEAAAAAAAAAAAAAAQIDAAQFBv/EACkRAAICAgIDAQACAwEAAwEAAAABAhEDEiExBBNBURQiMkJhUgUVgXH/2gAMAwEAAhEDEQA/APNvZdsU0EUuvva5ygrjbSoUw3UwkVQUSbuihWdDyFIdwo8KkkW3lF9mRFkJtIwm0V8dm1zI65RsFD23X3XfdPa2q90wjdKMEYkm/CuZxa6X8K30Pwgu/EpUHAUZ/wCJSIOEz6FRKCV34CkCceCpFUQpwkhCdMkhu1RdE/pNaPSEqRh9I904fdSKoUD4S9l1JaWCR5hQKr3i3qym4KglvrtPElMJCwMZZ5UbIlt5CNLL0sUFxs2qRRN/giIxtoaNHSdihOjZCeKRi7ZBcd0EZgylXLk4DlyWkiwDlw2XLlgh4JS1yvcKYGt1nAa+6scGfcDuufNC0Xwzpmjq9wOV3TSTFd1x87o/SO4XmvhnprlAaSEIxamV7LWahhFBJ2TiEhFI2ChhOyQmkpTT8lMhWMc5AkmLUV4USVrlSKJTbEOUQnsnJ7qJ0Eu3UiCJVaSRNNtktjif/CICmtjoBPDfuoMshQlA34ShvCUNKFjAZvwqoyuSrqZvpKp8sUSq4nyRy9EED1KQwbIA5UhgvddLOeI5ooqTE3hAYN9+6lwiqUpMokHDbTgxKnDlRsrQN7PQR/dVs7adVK2kHoJVZOPUqQZOaGYw9YV3jN9IIVRit/icK+xWWBslysbEhJWelVWS23HZXkzT0qoyQOoqcGUmuAGJjummaxjS5zjQA7r1HQv2VibFbPquQ6NzhYijqx9ysh4Dbj/4qwzk9PT1bXxfZe+DjZdEYqb5OaUmuEedap+yTBfjudp+XKyUbgSUQV5lm6XNp2bJi5MZZLGaIX0iV4l+0jMgl8VPbAQTGwNeR7oZI6vgMJNvkzIhb0oEsbRdIrXEhCl7qS7LPogStAJUZw3UqUGyo7guqJzSAu4Qu6M8IPdURNj2oiY3siduVjIRvKPGEEdkaNKx4hmjZEH2QwitUmVRzxsokhUx/CiyDlGIJEVx3SWnkbppVSIN6C5GcguToRjUq")`,
        }}
      />
      {/* Dark overlay: gradient 62%/52%/58% stop */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(20, 18, 16, 0.62) 0%, rgba(140, 29, 44, 0.52) 55%, rgba(20, 18, 16, 0.58) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        {/* Left Branding Panel (Desktop) */}
        <div className="hidden lg:flex flex-col text-white max-w-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-2">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Welcome to
            <br />
            Restaurant OS
          </h1>
          <p className="text-lg text-white/80 font-medium">
            Your workspace. Your restaurant. Your team.
          </p>
          <p className="text-sm text-white/60">
            Không gian vận hành dành riêng cho đội ngũ nhà hàng.
          </p>
        </div>

        {/* Right Form Card (Mobile & Desktop) */}
        <div className="w-full max-w-[420px] flex flex-col items-center">
          {/* Mobile brand header */}
          <div className="lg:hidden flex flex-col items-center text-center text-white mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Restaurant OS</h1>
            <p className="text-xs text-white/80 uppercase tracking-widest mt-0.5">Staff Portal</p>
          </div>

          {/* Form Card (Bo 16px - documented exception) */}
          {authState === 'FORM' && (
            <div className="w-full bg-white rounded-2xl p-7 shadow-2xl border border-[#E9E4DC] space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#2B2118]">Chào mừng trở lại</h2>
                <p className="text-xs text-[#7A6A58] mt-1">
                  Đăng nhập vào tài khoản nhân viên của bạn.
                </p>
              </div>

              {generalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Số điện thoại */}
                <div>
                  <label
                    htmlFor="phone-input"
                    className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-1"
                  >
                    Số điện thoại
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="Nhập số điện thoại"
                    className={`w-full p-3 bg-[#F6F4F0] border rounded-lg text-sm text-[#141210] focus:outline-none focus:bg-white min-h-[48px] ${
                      phoneError
                        ? 'border-[#D14B3A]'
                        : 'border-[#E9E4DC] focus:border-[#8C1D2C]'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-xs text-[#D14B3A] mt-1">{phoneError}</p>
                  )}
                </div>

                {/* Mật khẩu */}
                <div>
                  <label
                    htmlFor="pass-input"
                    className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-1"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="pass-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="Nhập mật khẩu"
                      className={`w-full p-3 pr-12 bg-[#F6F4F0] border rounded-lg text-sm text-[#141210] focus:outline-none focus:bg-white min-h-[48px] ${
                        passwordError
                          ? 'border-[#D14B3A]'
                          : 'border-[#E9E4DC] focus:border-[#8C1D2C]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-2 top-2 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[#7A6A58] hover:text-[#2B2118]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-[#D14B3A] mt-1">{passwordError}</p>
                  )}
                </div>

                {/* Ghi nhớ & Quên mật khẩu */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#7A6A58]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E9E4DC] accent-[#8C1D2C]"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotHint(!showForgotHint)}
                    className="text-[#8C1D2C] hover:underline font-semibold"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {showForgotHint && (
                  <p className="p-2.5 bg-[#F6F4F0] text-xs text-[#7A6A58] rounded-lg border border-[#E9E4DC]">
                    Liên hệ quản lý để được cấp lại mật khẩu — không tự đặt lại trên điện thoại.
                  </p>
                )}

                {/* Nút Đăng nhập */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-50 text-white font-bold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang đăng nhập…
                    </span>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Locked State Card */}
          {authState === 'LOCKED' && (
            <div className="w-full bg-white rounded-2xl p-7 shadow-2xl border border-[#E9E4DC] space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-[#D14B3A] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#D14B3A]">
                  Tài khoản đã bị khóa tạm thời
                </h2>
                <p className="text-xs text-[#7A6A58]">
                  Tài khoản của bạn đã bị khóa sau 3 lần đăng nhập sai. Liên hệ quản lý để mở khóa.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetLockout}
                className="w-full py-3 bg-white border border-[#E9E4DC] hover:border-[#8C1D2C] text-[#2B2118] text-sm font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
              >
                Đăng nhập tài khoản khác
              </button>
            </div>
          )}

          {/* Success State Card */}
          {authState === 'SUCCESS' && (
            <div className="w-full bg-white rounded-2xl p-7 shadow-2xl border border-[#E9E4DC] space-y-5 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#8C1D2C] mx-auto" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#2B2118]">Đăng nhập thành công</h2>
                <p className="text-sm text-[#7A6A58]">
                  Chào mừng trở lại, {loggedInUser?.fullName || 'bạn'}.
                </p>
                <p className="text-xs text-[#7A6A58] pt-1">Đang chuyển sang trang chủ…</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const destination = homeHrefForRole(loggedInUser?.role || staffUser?.role);
                  router.push(destination);
                }}
                className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-bold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
              >
                Vào trang chủ
              </button>
            </div>
          )}

          {/* Link to KDS PIN login & Support */}
          <div className="w-full text-center mt-6 space-y-2">
            <Link
              href="/kds/login"
              className="inline-block text-xs text-white/90 hover:text-white font-semibold hover:underline"
            >
              Đầu bếp dùng tablet chung? Vào bếp bằng mã PIN →
            </Link>
            <p className="text-[11px] text-white/70">Cần hỗ trợ đăng nhập? Liên hệ quản lý.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
