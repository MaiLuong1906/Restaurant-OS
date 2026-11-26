'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface AdminToastProps {
  message: string | null;
  type?: ToastType;
  onClose?: () => void;
}

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    borderLeft: 'border-l-emerald-600',
    title: 'Thao tác thành công',
  },
  error: {
    icon: AlertCircle,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    borderLeft: 'border-l-rose-600',
    title: 'Lỗi thao tác',
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    borderLeft: 'border-l-amber-600',
    title: 'Cập nhật trạng thái',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-primary-50 text-ops-brand border-primary-200/80',
    borderLeft: 'border-l-ops-brand',
    title: 'Thông báo hệ thống',
  },
};

/**
 * Toast thông báo sang trọng, đồng bộ 100% với Design System của Restaurant OS
 */
export function AdminToast({ message, type: explicitType, onClose }: AdminToastProps) {
  const [dismissedMsg, setDismissedMsg] = React.useState<string | null>(null);

  // Reset trạng thái đóng khi có thông báo mới
  React.useEffect(() => {
    setDismissedMsg(null);
  }, [message]);

  if (!message || message === dismissedMsg) return null;

  // Tự động suy luận loại toast dựa vào nội dung hoặc icon emoji phía trước
  const toastType: ToastType = (() => {
    if (explicitType) return explicitType;
    if (message.includes('❌') || /lỗi|thất bại|không thể|từ chối/i.test(message)) return 'error';
    if (message.includes('⏸') || message.includes('🗑') || /tạm dừng|tạm hết|hết món|xóa/i.test(message))
      return 'warning';
    if (message.includes('✅') || /thành công|đã cập nhật|đã tạo|mở bán/i.test(message)) return 'success';
    return 'info';
  })();

  const config = TYPE_CONFIG[toastType];
  const IconComponent = config.icon;

  // Lọc sạch các emoji thô dạng console log phía trước chuỗi
  const cleanMessage = message.replace(/^[\s✅❌⏸🗑⚠️ℹ️•-]+/, '').trim();

  const handleDismiss = () => {
    setDismissedMsg(message);
    onClose?.();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-stone-200/90 text-stone-900 min-w-[320px] max-w-md border-l-4 ${config.borderLeft} animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      {/* Icon badge */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs ${config.badgeBg}`}
      >
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="font-mono text-xs uppercase font-bold text-stone-600 tracking-wider">
          {config.title}
        </p>
        <p className="text-xs font-semibold text-stone-900 mt-0.5 leading-snug break-words">
          {cleanMessage}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
        title="Đóng"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Hook quản lý trạng thái hiển thị Toast và tự động dọn dẹp timer khi unmount
 */
export function useAdminToast(duration = 3200) {
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = React.useCallback(
    (msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToastMsg(msg);
      timerRef.current = setTimeout(() => setToastMsg(null), duration);
    },
    [duration]
  );

  const hideToast = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastMsg(null);
  }, []);

  return { toastMsg, showToast, hideToast };
}
