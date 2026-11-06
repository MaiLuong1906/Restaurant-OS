'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { staffService } from '@/services/mock/mockStaffService';
import { TodayAttendance, CheckInResponse, AttendanceMethod } from '@/types';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  RefreshCw,
  ScanFace,
} from 'lucide-react';

export default function AttendancePage() {
  const router = useRouter();

  // FSM steps: 'B3' (Chấm công) | 'B4' (Xác minh) | 'B5' (Kết quả)
  const [step, setStep] = React.useState<'B3' | 'B4' | 'B5'>('B3');
  const [attendance, setAttendance] = React.useState<TodayAttendance | null>(null);
  const [currentTime, setCurrentTime] = React.useState<string>('07:58');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // B4 state
  const [verifyTab, setVerifyTab] = React.useState<AttendanceMethod>('FACE_SCAN');
  const [isScanning, setIsScanning] = React.useState<boolean>(false);
  const [scanError, setScanError] = React.useState<string | null>(null);

  // B4 PIN state (khóa sau 3 lần sai 30 giây)
  const [pin, setPin] = React.useState<string>('');
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [failedPinAttempts, setFailedPinAttempts] = React.useState<number>(0);
  const [lockedSecondsLeft, setLockedSecondsLeft] = React.useState<number>(0);
  const submittingPinRef = React.useRef<boolean>(false);

  // B5 state
  const [result, setResult] = React.useState<CheckInResponse | null>(null);

  // Live clock
  React.useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer khóa PIN
  React.useEffect(() => {
    if (lockedSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setLockedSecondsLeft((prev) => {
        if (prev <= 1) {
          setFailedPinAttempts(0);
          setPinError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedSecondsLeft]);

  const loadAttendance = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffService.getTodayAttendance();
      setAttendance(data);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải thông tin ca chấm công');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Quét khuôn mặt (mô phỏng quét mặt UI)
  const handleStartFaceScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanError(null);

    try {
      // Mô phỏng quét mặt 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const key = `face-${Date.now()}`;
      const res = await staffService.verifyFaceScan(key);
      setResult(res);
      setStep('B5');
    } catch (err) {
      setScanError('Không nhận diện được khuôn mặt. Vui lòng quét lại hoặc dùng mã PIN.');
    } finally {
      setIsScanning(false);
    }
  };

  // Xác minh PIN dự phòng
  const handlePinAppend = React.useCallback(
    (digit: string) => {
      if (lockedSecondsLeft > 0 || pin.length >= 4 || submittingPinRef.current) return;
      setPinError(null);
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [pin, lockedSecondsLeft]
  );

  const handlePinClear = React.useCallback(() => {
    if (lockedSecondsLeft > 0) return;
    setPin('');
    setPinError(null);
  }, [lockedSecondsLeft]);

  const handlePinBackspace = React.useCallback(() => {
    if (lockedSecondsLeft > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  }, [lockedSecondsLeft]);

  // Physical keyboard support for PIN
  React.useEffect(() => {
    if (step !== 'B4' || verifyTab !== 'PIN') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockedSecondsLeft > 0) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinAppend(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlePinClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, verifyTab, lockedSecondsLeft, handlePinAppend, handlePinBackspace, handlePinClear]);

  const verifyPin = async (inputPin: string) => {
    if (submittingPinRef.current) return;
    submittingPinRef.current = true;

    try {
      const res = await staffService.verifyAttendancePin(inputPin);
      if (res.ok) {
        const key = `pin-${Date.now()}`;
        const checkInRes = await staffService.checkIn({ method: 'PIN', idempotencyKey: key });
        setResult(checkInRes);
        setStep('B5');
      } else {
        const nextFailed = failedPinAttempts + 1;
        setFailedPinAttempts(nextFailed);
        setPin('');

        if (nextFailed >= 3) {
          setLockedSecondsLeft(30);
          setPinError('Đã nhập sai mã PIN 3 lần. Tạm khóa 30 giây.');
        } else {
          setPinError(`Mã PIN không đúng (Còn ${3 - nextFailed} lần thử)`);
        }
      }
    } catch (err) {
      setPinError((err as Error).message || 'Lỗi khi xác minh PIN');
    } finally {
      submittingPinRef.current = false;
    }
  };

  const isCheckedIn = attendance?.status === 'CHECKED_IN';

  return (
    <div className="min-h-screen bg-[var(--color-ops-bg,#F6F4F0)] text-ops-ink flex flex-col font-sans select-none">
      <main className="w-full max-w-[480px] md:max-w-xl mx-auto flex-1 flex flex-col px-4 py-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-ops-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-ops-brand" />
            <p className="text-sm font-semibold">Đang tải thông tin ca...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center my-6">
            <p className="text-sm font-semibold mb-3">{error}</p>
            <button
              type="button"
              onClick={loadAttendance}
              className="px-4 py-2 bg-ops-brand text-white font-bold rounded-lg text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : step === 'B4' ? (
          /* ============ B4: Xác minh ============ */
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setStep('B3')}
              className="text-sm font-bold text-ops-brand flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Chấm công</span>
            </button>

            <div>
              <p className="text-xs font-bold text-ops-brand uppercase tracking-wider mb-0.5">
                Bước 2 / 3
              </p>
              <h1 className="text-2xl font-bold text-[#2B2118]">Xác minh</h1>
              <p className="text-xs text-ops-muted mt-0.5">
                {verifyTab === 'FACE_SCAN' ? 'Xác minh khuôn mặt để chấm công' : 'Nhập mã PIN dự phòng'}
              </p>
            </div>

            {verifyTab === 'FACE_SCAN' ? (
              /* Khung quét khuôn mặt */
              <div className="space-y-4">
                <div
                  className={`min-h-[240px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors ${
                    isScanning
                      ? 'border-ops-brand bg-red-50/20'
                      : 'border-ops-border bg-white shadow-warm'
                  }`}
                >
                  {isScanning ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-4 border-ops-border border-t-ops-brand animate-spin" />
                      <p className="text-sm font-bold text-ops-ink">Đang quét khuôn mặt...</p>
                      <span className="text-xs text-ops-muted">Giữ điện thoại ổn định và đủ sáng</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ScanFace className="h-16 w-16 text-ops-muted stroke-[1.5]" />
                      <p className="text-sm font-bold text-ops-ink">Đưa mặt vào khung hình</p>
                      <span className="text-xs text-ops-muted">
                        Giữ điện thoại ngang tầm mắt, đủ ánh sáng
                      </span>
                    </div>
                  )}
                </div>

                {scanError && (
                  <p className="text-xs text-danger-600 font-bold text-center">{scanError}</p>
                )}

                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleStartFaceScan}
                  className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base shadow-xs transition-transform disabled:opacity-50"
                >
                  {isScanning ? 'Đang nhận diện...' : 'Quét khuôn mặt'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerifyTab('PIN');
                    setScanError(null);
                  }}
                  className="w-full h-12 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 active:scale-98 text-[#2B2118] font-bold text-sm shadow-xs transition-transform"
                >
                  Nhập mã PIN thay thế
                </button>
              </div>
            ) : (
              /* Bàn phím PIN dự phòng */
              <div className="space-y-4">
                <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm text-center">
                  <h2 className="text-base font-bold text-[#2B2118]">Nhập mã PIN</h2>
                  <p className="text-xs text-ops-muted mt-0.5">Dùng khi không quét được khuôn mặt</p>

                  {/* 4 Chấm tròn PIN */}
                  <div className="flex justify-center gap-4 my-6">
                    {[0, 1, 2, 3].map((idx) => {
                      const isFilled = idx < pin.length;
                      return (
                        <span
                          key={idx}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            isFilled ? 'bg-[#8C1D2C] border-[#8C1D2C] scale-110' : 'border-neutral-400'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {lockedSecondsLeft > 0 ? (
                    <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 mb-4">
                      <Lock className="h-4 w-4" />
                      <span>Đã nhập sai 3 lần &bull; Tạm khóa {lockedSecondsLeft}s</span>
                    </div>
                  ) : pinError ? (
                    <p className="text-xs text-danger-600 font-bold mb-4">{pinError}</p>
                  ) : (
                    <div className="h-4 mb-4" />
                  )}

                  {/* Bàn phím số 64px */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-[320px] mx-auto mb-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        disabled={lockedSecondsLeft > 0}
                        onClick={() => handlePinAppend(digit)}
                        className="h-16 text-2xl font-bold rounded-lg border border-ops-border bg-white hover:bg-neutral-50 active:scale-95 text-[#2B2118] flex items-center justify-center shadow-xs transition-transform disabled:opacity-40"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={lockedSecondsLeft > 0 || pin.length === 0}
                      onClick={handlePinClear}
                      className="h-16 text-sm font-bold rounded-lg border border-ops-border bg-neutral-100 text-[#2B2118] flex items-center justify-center active:scale-95 disabled:opacity-40"
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      disabled={lockedSecondsLeft > 0}
                      onClick={() => handlePinAppend('0')}
                      className="h-16 text-2xl font-bold rounded-lg border border-ops-border bg-white hover:bg-neutral-50 active:scale-95 text-[#2B2118] flex items-center justify-center shadow-xs transition-transform disabled:opacity-40"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      disabled={lockedSecondsLeft > 0 || pin.length === 0}
                      onClick={handlePinBackspace}
                      className="h-16 text-xl font-bold rounded-lg border border-ops-border bg-neutral-100 text-[#2B2118] flex items-center justify-center active:scale-95 disabled:opacity-40"
                    >
                      &larr;
                    </button>
                  </div>

                  <p className="text-xs text-ops-muted">
                    Quên mã PIN? Gặp quản lý để đặt lại &rarr;
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVerifyTab('FACE_SCAN');
                    setPin('');
                    setPinError(null);
                  }}
                  className="w-full h-12 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 text-[#2B2118] font-bold text-sm shadow-xs transition-transform"
                >
                  &larr; Quay lại quét mặt
                </button>
              </div>
            )}
          </div>
        ) : step === 'B5' && result ? (
          /* ============ B5: Kết quả ============ */
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-ops-brand uppercase tracking-wider mb-0.5">
                Bước 3 / 3
              </p>
              <h1 className="text-2xl font-bold text-[#2B2118]">Kết quả chấm công</h1>
              <p className="text-xs text-ops-muted mt-0.5">Thứ Năm, 05/11/2026</p>
            </div>

            {result.kind === 'SUCCESS' ? (
              <div className="space-y-4">
                <div className="bg-white border border-ops-border rounded-lg p-8 shadow-warm text-center">
                  <CheckCircle2 className="h-12 w-12 text-[#8C1D2C] mx-auto mb-2" />
                  <h2 className="text-lg font-bold text-[#2B2118]">Đã chấm công</h2>
                  <div className="text-4xl font-black text-ops-brand my-2">
                    {result.checkedInAt || '07:58'}
                  </div>
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-xs">
                    Đúng giờ
                  </span>
                </div>

                <div className="bg-white border border-ops-border rounded-lg p-5 shadow-warm space-y-2.5 text-sm">
                  <h3 className="font-bold text-[#2B2118] text-base mb-1">Thông tin ca</h3>
                  <div className="flex justify-between py-1 border-b border-dashed border-ops-border">
                    <span className="text-ops-muted">Ca làm việc</span>
                    <b className="text-ops-ink">Ca sáng &bull; 08:00 – 14:00</b>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-ops-border">
                    <span className="text-ops-muted">Khu vực</span>
                    <b className="text-ops-ink">Bếp chính</b>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ops-muted">Phương thức xác minh</span>
                    <b className="text-ops-ink">
                      {result.method === 'FACE_SCAN' ? 'Khuôn mặt' : 'Mã PIN'}
                    </b>
                  </div>
                </div>

                <Link
                  href="/staff"
                  className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base flex items-center justify-center shadow-xs transition-transform"
                >
                  Về trang chủ
                </Link>
              </div>
            ) : result.kind === 'ALREADY_CHECKED_IN' ? (
              <div className="space-y-4">
                <div className="bg-white border border-ops-border rounded-lg p-8 shadow-warm text-center">
                  <Clock className="h-12 w-12 text-amber-600 mx-auto mb-2" />
                  <h2 className="text-lg font-bold text-[#2B2118]">Bạn đã vào ca trước đó</h2>
                  <p className="text-sm text-ops-muted mt-1">
                    Hôm nay bạn đã vào ca lúc <strong>{result.checkedInAt || '07:58'}</strong>
                  </p>
                </div>

                <Link
                  href="/staff"
                  className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base flex items-center justify-center shadow-xs transition-transform"
                >
                  Về trang chủ
                </Link>
              </div>
            ) : (
              /* Network Error */
              <div className="space-y-4">
                <div className="bg-white border border-ops-border rounded-lg p-8 shadow-warm text-center">
                  <AlertTriangle className="h-12 w-12 text-[#D14B3A] mx-auto mb-2" />
                  <h2 className="text-lg font-bold text-[#D14B3A]">Lỗi kết nối máy chủ</h2>
                  <p className="text-sm text-ops-muted mt-1">
                    Không thể ghi nhận giờ vào ca lúc này. Vui lòng thử lại.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('B4')}
                  className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base shadow-xs transition-transform"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep('B3')}
                  className="w-full h-12 rounded-lg border border-ops-border bg-white text-[#2B2118] font-bold text-base transition-transform"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ============ B3: Chấm công ============ */
          <div className="space-y-6">
            <Link
              href="/staff"
              className="text-sm font-bold text-ops-brand flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Trang chủ</span>
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-[#2B2118]">Chấm công</h1>
              <p className="text-xs text-ops-muted mt-0.5">Thứ Năm, 05/11/2026</p>
            </div>

            <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm space-y-4">
              <div>
                <span className="text-lg font-bold text-ops-ink">
                  {attendance?.shiftName || 'Ca sáng'}
                </span>
                <p className="text-xs text-ops-muted">Nhà hàng chính</p>
              </div>

              <div className="text-3xl font-black text-ops-brand">
                {attendance?.shiftHours || '08:00 – 14:00'}
              </div>

              <div className="space-y-2 text-sm border-t border-dashed border-ops-border pt-3">
                <div className="flex justify-between">
                  <span className="text-ops-muted">Khu vực</span>
                  <b className="text-ops-ink">{attendance?.zone || 'Bếp chính'}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-ops-muted">Giờ hiện tại</span>
                  <b className="font-mono text-base font-bold text-ops-ink">{currentTime}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-ops-muted">Trạng thái</span>
                  <b className="text-ops-muted">
                    {isCheckedIn ? 'Đã vào ca' : 'Chưa vào ca'}
                  </b>
                </div>
              </div>

              {isCheckedIn && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-bold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Đã vào ca lúc {attendance?.checkedInAt || '07:58'}</span>
                </div>
              )}
            </div>

            {/* Nút Chấm công (chống chấm trùng: disabled khi đã chấm) */}
            <button
              type="button"
              disabled={isCheckedIn}
              onClick={() => {
                setStep('B4');
                setVerifyTab('FACE_SCAN');
                setScanError(null);
              }}
              className="w-full h-16 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-extrabold text-lg shadow-xs transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckedIn ? 'Đã chấm công' : 'Chấm công'}
            </button>

            <Link
              href="/staff/schedule"
              className="text-center block text-sm font-bold text-ops-brand hover:underline"
            >
              Xem lịch ca &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
