'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import { useAuthStore } from '@/stores/useAuthStore';
import { Wifi, Delete, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function KdsPinLoginPage() {
  const router = useRouter();
  const kdsSession = useAuthStore((s) => s.kdsSession);

  const [pin, setPin] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [failedCount, setFailedCount] = React.useState<number>(0);
  const [lockedSecondsLeft, setLockedSecondsLeft] = React.useState<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [isShaking, setIsShaking] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<string>('--:--:--');

  const submittingRef = React.useRef<boolean>(false);

  // Đồng hồ hiển thị thời gian thực theo chuẩn vi-VN
  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown khi bị khóa do nhập sai 3 lần
  React.useEffect(() => {
    if (lockedSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setLockedSecondsLeft((prev) => {
        if (prev <= 1) {
          setFailedCount(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedSecondsLeft]);

  // Điều hướng nếu đã có phiên KDS hợp lệ
  React.useEffect(() => {
    if (kdsSession && kdsSession.token && !isSuccess) {
      router.push('/kds');
    }
  }, [kdsSession, router, isSuccess]);

  const handleAppendDigit = React.useCallback(
    (digit: string) => {
      if (isSubmitting || lockedSecondsLeft > 0 || isSuccess) return;
      if (pin.length >= 4) return;

      setError(null);
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [pin, isSubmitting, lockedSecondsLeft, isSuccess]
  );

  const handleClear = React.useCallback(() => {
    if (isSubmitting || lockedSecondsLeft > 0 || isSuccess) return;
    setPin('');
    setError(null);
  }, [isSubmitting, lockedSecondsLeft, isSuccess]);

  const handleBackspace = React.useCallback(() => {
    if (isSubmitting || lockedSecondsLeft > 0 || isSuccess) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [isSubmitting, lockedSecondsLeft, isSuccess]);

  // Hỗ trợ bàn phím vật lý
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || lockedSecondsLeft > 0 || isSuccess) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleAppendDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAppendDigit, handleBackspace, handleClear, isSubmitting, lockedSecondsLeft, isSuccess]);

  const verifyPin = async (inputPin: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await authService.authKdsPin({ pin: inputPin });
      setIsSuccess(true);
      setError(null);
      setFailedCount(0);
      setTimeout(() => {
        router.push('/kds');
      }, 600);
    } catch (err: unknown) {
      const nextFailed = failedCount + 1;
      setFailedCount(nextFailed);
      setIsShaking(true);
      setPin('');

      setTimeout(() => {
        setIsShaking(false);
      }, 500);

      if (nextFailed >= 3) {
        setLockedSecondsLeft(30);
        setError('Nhập sai 3 lần liên tiếp. Bàn phím tạm khóa 30 giây.');
      } else {
        const errMsg = (err as Error).message || 'Mã PIN không đúng. Vui lòng thử lại.';
        setError(`${errMsg} (Còn ${3 - nextFailed} lần thử)`);
      }
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-ops-bg,#F6F4F0)] text-ops-ink flex flex-col font-sans">
      {/* Header vận hành theo ngôn ngữ A3 */}
      <header className="h-14 bg-white border-b border-ops-border px-6 flex items-center justify-between shadow-xs">
        <h1 className="font-extrabold text-lg text-[#2B2118] tracking-tight">KDS Bếp — Đăng nhập</h1>
        <div className="flex items-center gap-5 text-sm font-semibold text-[#2B2118]">
          <span className="flex items-center gap-1.5 text-[#5F7F5E]">
            <Wifi className="h-4 w-4" />
            <span>Đã kết nối</span>
          </span>
          <span className="font-mono text-ops-muted">🕐 {currentTime}</span>
        </div>
      </header>

      {/* Main card khu vực nhập PIN */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] bg-white border border-ops-border rounded-lg shadow-warm p-8 text-center">
          <h2 className="text-2xl font-black text-ops-ink mb-1">Nhập PIN để vào bếp</h2>
          <p className="text-sm text-ops-muted mb-6">
            PIN xác định đầu bếp đang làm việc trên tablet này
          </p>

          {isSuccess ? (
            <div className="bg-[#EAF2EB] border border-[#CFDFCC] text-[#2B2118] p-6 rounded-lg text-center animate-in fade-in">
              <CheckCircle2 className="h-10 w-10 text-[#5F7F5E] mx-auto mb-2" />
              <h3 className="font-bold text-lg text-[#5F7F5E]">Xác minh thành công</h3>
              <p className="text-xs text-ops-muted mt-1">Đang chuyển hướng vào hàng đợi KDS...</p>
            </div>
          ) : (
            <div>
              {/* 4 Chấm PIN tròn */}
              <div
                className={`flex justify-center gap-4 mb-4 ${
                  isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
                }`}
                aria-label={`PIN đã nhập ${pin.length} trên 4 số`}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = idx < pin.length;
                  return (
                    <span
                      key={idx}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        isFilled
                          ? 'bg-[#141210] border-[#141210] scale-110'
                          : 'bg-white border-ops-border'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Thông báo lỗi hoặc đếm ngược khóa */}
              <div
                className="min-h-[28px] mb-4 flex items-center justify-center text-sm font-bold text-danger-600"
                role="alert"
              >
                {lockedSecondsLeft > 0 ? (
                  <span className="flex items-center gap-1.5 text-danger-700 bg-danger-50 px-3 py-1 rounded border border-danger-200">
                    <AlertTriangle className="h-4 w-4" />
                    Tạm khóa: Thử lại sau {lockedSecondsLeft}s
                  </span>
                ) : error ? (
                  <span className="text-danger-600">{error}</span>
                ) : null}
              </div>

              {/* Bàn phím số 64px Touch Target (Ngoại lệ tablet bếp tay ướt) */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    disabled={isSubmitting || lockedSecondsLeft > 0}
                    onClick={() => handleAppendDigit(digit)}
                    className="h-16 text-2xl font-black rounded-lg border border-ops-border bg-white hover:bg-[#F6F4F0] active:scale-98 text-ops-ink flex items-center justify-center shadow-xs transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={`Số ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Phím Xóa C */}
                <button
                  type="button"
                  disabled={isSubmitting || lockedSecondsLeft > 0 || pin.length === 0}
                  onClick={handleClear}
                  className="h-16 text-base font-bold rounded-lg border border-ops-border bg-[#F6F4F0] hover:bg-neutral-200 active:scale-98 text-ops-muted flex items-center justify-center shadow-xs transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Xóa toàn bộ mã PIN"
                >
                  Xóa
                </button>

                {/* Phím 0 */}
                <button
                  type="button"
                  disabled={isSubmitting || lockedSecondsLeft > 0}
                  onClick={() => handleAppendDigit('0')}
                  className="h-16 text-2xl font-black rounded-lg border border-ops-border bg-white hover:bg-[#F6F4F0] active:scale-98 text-ops-ink flex items-center justify-center shadow-xs transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Số 0"
                >
                  0
                </button>

                {/* Phím Lùi Backspace */}
                <button
                  type="button"
                  disabled={isSubmitting || lockedSecondsLeft > 0 || pin.length === 0}
                  onClick={handleBackspace}
                  className="h-16 text-base font-bold rounded-lg border border-ops-border bg-[#F6F4F0] hover:bg-neutral-200 active:scale-98 text-ops-muted flex items-center justify-center shadow-xs transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Lùi một ký tự"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>

              <p className="text-xs text-ops-muted">
                PIN do quản lý cấp. Quên PIN? Liên hệ Bếp trưởng hoặc Quản lý.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
