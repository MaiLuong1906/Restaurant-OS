'use client';

import * as React from 'react';
import { KeyRound, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserResponseDto } from '@/types/user';
import { userService } from '@/services/userService';
import { ApiError } from '@/lib/api-client';

interface ResetPinModalProps {
  user: UserResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ResetPinModal({ user, onClose, onSuccess, showToast }: ResetPinModalProps) {
  const [newPin, setNewPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setNewPin('');
    setShowPin(false);
    setPinError(null);
  }, [user]);

  if (!user) return null;

  const handleResetPin = async () => {
    setPinError(null);
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      setPinError('Mã PIN mới phải gồm đúng 4 đến 6 chữ số');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.updatePin(user.employeeCode || user.id, {
        pinCode: newPin,
      });
      showToast(`Đã đổi mã PIN trạm thành công cho ${user.fullName}!`);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Đổi mã PIN thất bại';
      setPinError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đổi Mã PIN Trạm"
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-ops-border">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-700" />
            <h3 className="font-sans text-sm font-bold text-ops-ink">Đổi Mã PIN Trạm</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-ops-muted">
          Cấp lại mã PIN mới cho nhân sự <strong className="text-ops-ink">{user.fullName}</strong> (Mã:{' '}
          <span className="font-mono font-bold text-stone-900">{user.employeeCode}</span>):
        </p>

        {/* Error Banner nếu có lỗi */}
        {pinError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-tight">{pinError}</span>
          </div>
        )}

        <div>
          <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
            Mã PIN Mới (4 - 6 Chữ Số)
          </label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={6}
              value={newPin}
              onChange={(e) => {
                setNewPin(e.target.value);
                if (pinError) setPinError(null);
              }}
              placeholder="Nhập 4-6 số"
              className={`w-full pl-3 pr-10 text-center text-xl font-mono font-bold tracking-widest py-2 bg-ops-bg border rounded-lg focus:outline-none transition-colors ${
                pinError
                  ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : 'border-ops-border focus:border-primary-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded cursor-pointer"
              title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50"
          >
            Hủy
          </button>
          <button
            onClick={handleResetPin}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang Lưu...' : 'Lưu PIN Mới'}
          </button>
        </div>
      </div>
    </div>
  );
}
