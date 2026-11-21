'use client';

import * as React from 'react';
import { ArrowUpRight, X, AlertCircle } from 'lucide-react';
import { UserResponseDto, UserRoleCode } from '@/types/user';
import { userService } from '@/services/userService';
import { ApiError } from '@/lib/api-client';
import { ROLE_OPTIONS } from '../types';

interface PromoteUserModalProps {
  user: UserResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function PromoteUserModal({ user, onClose, onSuccess, showToast }: PromoteUserModalProps) {
  const [selectedRole, setSelectedRole] = React.useState<UserRoleCode>('MANAGER');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.roleCode === 'MANAGER' ? 'OWNER' : 'MANAGER');
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handlePromoteRole = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await userService.updateUser(user.employeeCode || user.id, {
        roleCode: selectedRole,
      });
      showToast(
        `Thăng chức thành công! Mã mới: ${updated.employeeCode}, Vai trò: ${updated.roleName}, Trần CK: ${updated.discountCeiling}%`
      );
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Thăng chức thất bại';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thăng Chức Nhân Sự"
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-ops-border">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-indigo-700" />
            <h3 className="font-sans text-sm font-bold text-ops-ink">Thăng Chức / Đổi Vai Trò</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner nếu có lỗi */}
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-tight">{error}</span>
          </div>
        )}

        <div className="text-xs space-y-2 text-stone-600">
          <p>
            Đổi vai trò cho: <strong className="text-stone-900">{user.fullName}</strong>
          </p>
          <div className="p-2.5 rounded bg-stone-50 border border-stone-200 text-[11px] space-y-1">
            <div>
              Mã hiện tại: <span className="font-mono font-bold text-stone-900">{user.employeeCode}</span>
            </div>
            <div>
              Vai trò hiện tại: <span className="font-bold text-stone-900">{user.roleName}</span>
            </div>
            <div>
              Trần chiết khấu hiện tại: <span className="font-mono font-bold text-stone-900">{user.discountCeiling}%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
            Chọn Vai Trò Mới
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRoleCode)}
            className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-bold text-xs cursor-pointer"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label} — Trần CK {opt.defaultCeiling}%
              </option>
            ))}
          </select>
          <p className="text-[10px] text-amber-700 mt-1.5 italic">
            * Hệ thống sẽ tự động cấp lại Mã Nhân Sự mới theo tiền tố vai trò và tự động cập nhật hạn mức chiết khấu!
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50"
          >
            Hủy
          </button>
          <button
            onClick={handlePromoteRole}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-mono uppercase rounded font-bold cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
