'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { UserResponseDto } from '@/types/user';
import { userService } from '@/services/userService';
import { ApiError } from '@/lib/api-client';

interface DeleteUserModalProps {
  user: UserResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function DeleteUserModal({ user, onClose, onSuccess, showToast }: DeleteUserModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!user) return null;

  const handleDeleteUser = async () => {
    setIsSubmitting(true);
    try {
      await userService.deleteUser(user.employeeCode || user.id);
      showToast(`Đã xóa tài khoản nhân sự ${user.fullName} thành công!`);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Xóa tài khoản thất bại';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xác nhận xóa tài khoản"
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 text-rose-700 pb-2 border-b border-stone-200">
          <Trash2 className="w-5 h-5" />
          <h3 className="font-sans text-sm font-bold">Xác Nhận Xóa Tài Khoản</h3>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Bạn có chắc chắn muốn xóa tài khoản của <strong className="text-stone-900">{user.fullName}</strong> (Mã:{' '}
          <span className="font-mono font-bold">{user.employeeCode}</span>)?
          <br />
          <span className="text-[11px] text-rose-600 block mt-1">
            * Thao tác này sẽ xóa mềm tài khoản. Nhân sự sẽ không thể đăng nhập và không còn xuất hiện trong danh sách làm việc.
          </span>
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-ops-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50"
          >
            Hủy
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-mono uppercase rounded font-bold cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
