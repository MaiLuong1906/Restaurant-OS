'use client';

import * as React from 'react';
import { UserPlus, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserResponseDto, UserRoleCode } from '@/types/user';
import { userService } from '@/services/userService';
import { ApiError } from '@/lib/api-client';
import { ROLE_OPTIONS } from '../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: UserResponseDto) => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [modalError, setModalError] = React.useState<string | null>(null);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showPinCode, setShowPinCode] = React.useState(false);

  const [newUser, setNewUser] = React.useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    roleCode: 'CASHIER' as UserRoleCode,
    pinCode: '',
  });

  const resetForm = () => {
    setNewUser({
      fullName: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      roleCode: 'CASHIER',
      pinCode: '',
    });
    setFormErrors({});
    setModalError(null);
    setShowPassword(false);
    setShowPinCode(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderFieldError = (errorMsg?: string) => {
    if (!errorMsg) return null;
    return (
      <div className="mt-1 px-2 py-1 rounded bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 font-medium leading-snug flex items-start gap-1.5 animate-in fade-in">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
        <span className="flex-1">{errorMsg}</span>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setModalError(null);

    // Client-side quick check (Phương án A: Chuẩn hóa bắt buộc)
    const errors: Record<string, string> = {};
    if (!newUser.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên nhân viên';
    }
    if (newUser.username.trim() && !/^[a-zA-Z0-9._-]+$/.test(newUser.username.trim())) {
      errors.username = 'Chỉ dùng chữ, số, dấu . _ - (không dùng @ hoặc khoảng trắng)';
    }
    if (!newUser.password.trim()) {
      errors.password = 'Vui lòng nhập mật khẩu khởi tạo';
    } else if (newUser.password.trim().length < 6) {
      errors.password = 'Mật khẩu tối thiểu 6 ký tự';
    }
    if (!newUser.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ';
    } else if (!/^0\d{9}$/.test(newUser.phone.trim())) {
      errors.phone = 'SĐT phải gồm đúng 10 chữ số (bắt đầu bằng 0)';
    }
    if (!newUser.pinCode.trim()) {
      errors.pinCode = 'Vui lòng cài đặt mã PIN trạm (4-6 số)';
    } else if (!/^\d{4,6}$/.test(newUser.pinCode.trim())) {
      errors.pinCode = 'Mã PIN gồm đúng 4 đến 6 chữ số';
    }
    if (newUser.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim())) {
      errors.email = 'Email không hợp lệ (Ví dụ: nhanvien@restaurant.vn)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await userService.createUser({
        fullName: newUser.fullName.trim(),
        username: newUser.username.trim() || undefined,
        password: newUser.password.trim(),
        email: newUser.email.trim() || undefined,
        phone: newUser.phone.trim(),
        roleCode: newUser.roleCode,
        pinCode: newUser.pinCode.trim(),
      });

      resetForm();
      onSuccess(created);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details && typeof err.details === 'object' && Object.keys(err.details).length > 0) {
          setFormErrors(err.details as Record<string, string>);
        } else {
          const lowerMsg = (err.message || '').toLowerCase();
          if (lowerMsg.includes('tên đăng nhập') || lowerMsg.includes('username')) {
            setFormErrors({ username: err.message || 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác' });
          } else if (lowerMsg.includes('email')) {
            setFormErrors({ email: err.message || 'Email này đã được sử dụng, vui lòng chọn email khác' });
          } else if (lowerMsg.includes('số điện thoại') || lowerMsg.includes('phone')) {
            setFormErrors({ phone: err.message || 'Số điện thoại này đã được sử dụng' });
          } else {
            setModalError(err.message || 'Dữ liệu không hợp lệ hoặc đã tồn tại');
          }
        }
      } else {
        setModalError(err instanceof Error ? err.message : 'Tạo tài khoản thất bại');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cấp Tài Khoản Nhân Sự Mới"
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-2 border-b border-ops-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-500" />
            <h3 className="font-sans text-base font-bold text-ops-ink">Cấp Tài Khoản Nhân Sự Mới</h3>
          </div>
          <button
            onClick={handleClose}
            aria-label="Đóng modal"
            className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner nếu có lỗi chung */}
        {modalError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{modalError}</div>
            <button
              type="button"
              onClick={() => setModalError(null)}
              className="text-rose-400 hover:text-rose-700 transition-colors"
              aria-label="Đóng cảnh báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Họ và tên */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
              Họ và Tên Nhân Viên *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Lê Thùy Linh"
              value={newUser.fullName}
              onChange={(e) => {
                setNewUser({ ...newUser, fullName: e.target.value });
                if (formErrors.fullName) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.fullName;
                    return next;
                  });
                }
                if (modalError) setModalError(null);
              }}
              className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-medium transition-colors ${
                formErrors.fullName
                  ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : 'border-ops-border focus:border-primary-500'
              }`}
            />
            {renderFieldError(formErrors.fullName)}
          </div>

          {/* Username & Mật khẩu */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Username Đăng Nhập (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: linh.cashier (để trống lấy theo SĐT)"
                value={newUser.username}
                onChange={(e) => {
                  setNewUser({ ...newUser, username: e.target.value });
                  if (formErrors.username) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.username;
                      return next;
                    });
                  }
                  if (modalError) setModalError(null);
                }}
                className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono font-bold transition-colors ${
                  formErrors.username
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600 text-rose-900'
                    : 'border-ops-border focus:border-primary-500'
                }`}
              />
              {renderFieldError(formErrors.username)}
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Mật Khẩu Khởi Tạo *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newUser.password}
                  onChange={(e) => {
                    setNewUser({ ...newUser, password: e.target.value });
                    if (formErrors.password) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.password;
                        return next;
                      });
                    }
                    if (modalError) setModalError(null);
                  }}
                  className={`w-full pl-3 pr-9 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono transition-colors ${
                    formErrors.password
                      ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                      : 'border-ops-border focus:border-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {renderFieldError(formErrors.password)}
            </div>
          </div>

          {/* Vai trò */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
              Vai Trò Vận Hành (Hệ thống tự động sinh Mã Nhân Sự) *
            </label>
            <select
              value={newUser.roleCode}
              onChange={(e) => setNewUser({ ...newUser, roleCode: e.target.value as UserRoleCode })}
              className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-primary-500 font-bold"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label} — Trần CK: {opt.defaultCeiling}%
                </option>
              ))}
            </select>
          </div>

          {/* SĐT & Mã PIN */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Số Điện Thoại (10 số VN) *
              </label>
              <input
                type="text"
                placeholder="VD: 0912345678"
                value={newUser.phone}
                onChange={(e) => {
                  setNewUser({ ...newUser, phone: e.target.value });
                  if (formErrors.phone) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.phone;
                      return next;
                    });
                  }
                  if (modalError) setModalError(null);
                }}
                className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono transition-colors ${
                  formErrors.phone
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : 'border-ops-border focus:border-primary-500'
                }`}
              />
              {renderFieldError(formErrors.phone)}
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                Mã PIN Trạm (4-6 Số) *
              </label>
              <div className="relative">
                <input
                  type={showPinCode ? 'text' : 'password'}
                  maxLength={6}
                  placeholder="VD: 1234"
                  value={newUser.pinCode}
                  onChange={(e) => {
                    setNewUser({ ...newUser, pinCode: e.target.value });
                    if (formErrors.pinCode) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.pinCode;
                        return next;
                      });
                    }
                    if (modalError) setModalError(null);
                  }}
                  className={`w-full pl-3 pr-9 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none font-mono text-center tracking-widest font-bold transition-colors ${
                    formErrors.pinCode
                      ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                      : 'border-ops-border focus:border-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPinCode(!showPinCode)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded cursor-pointer"
                  title={showPinCode ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                  tabIndex={-1}
                >
                  {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {renderFieldError(formErrors.pinCode)}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
              Địa Chỉ Email (Tùy chọn)
            </label>
            <input
              type="email"
              placeholder="VD: linh@restaurant.vn"
              value={newUser.email}
              onChange={(e) => {
                setNewUser({ ...newUser, email: e.target.value });
                if (formErrors.email) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
                if (modalError) setModalError(null);
              }}
              className={`w-full px-3 py-2 bg-ops-bg border rounded-lg text-ops-ink focus:outline-none transition-colors ${
                formErrors.email
                  ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : 'border-ops-border focus:border-primary-500'
              }`}
            />
            {renderFieldError(formErrors.email)}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer hover:bg-stone-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Đang Tạo...' : 'Cấp Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
