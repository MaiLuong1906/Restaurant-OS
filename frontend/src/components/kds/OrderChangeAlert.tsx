'use client';

import * as React from 'react';
import { OrderChangeAlertData } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface OrderChangeAlertProps {
  alert: OrderChangeAlertData | null;
  open: boolean;
  onConfirm: (alertId: string) => void;
  onDefer: (alertId: string) => void;
  isConfirming?: boolean;
}

export function OrderChangeAlert({
  alert,
  open,
  onConfirm,
  onDefer,
  isConfirming,
}: OrderChangeAlertProps) {
  if (!open || !alert) return null;

  const isCancel = alert.variant === 'CANCEL_ITEM';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Đơn ${alert.tableNo} đã thay đổi`}
    >
      <div className="w-full max-w-[480px] bg-white rounded-lg shadow-2xl p-6 border border-ops-border animate-in fade-in zoom-in-95 duration-150">
        {/* Header modal */}
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="h-7 w-7 text-danger-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-[#2B2118]">
              Đơn {alert.tableNo} đã thay đổi
            </h2>
          </div>
        </div>

        {/* Nội dung cảnh báo theo 2 biến thể */}
        {isCancel ? (
          <div>
            <p className="text-sm text-ops-ink mb-3 font-medium">
              <strong>{alert.dishName}</strong> ×{alert.quantity} đã bị hủy — {alert.reason || 'khách đổi ý'}.
            </p>
            <div className="p-3 bg-[#F6F4F0] border border-ops-border rounded-lg text-sm text-[#2B2118] font-bold mb-5">
              Món này đang nấu. Dừng lại ngay, đừng hoàn tất ticket.
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-ops-ink mb-3 font-medium">
              <strong>{alert.dishName}</strong> đã đổi ghi chú.
            </p>

            <div className="p-3 bg-[#F6F4F0] border border-ops-border rounded-lg text-sm mb-3 space-y-1">
              <div className="flex justify-between items-center text-xs text-ops-muted">
                <span>Trước</span>
                <span className="font-semibold text-ops-ink">{alert.previousNote || 'Không có ghi chú'}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-ops-muted text-xs">Sau</span>
                <span className="text-[#8C1D2C]">{alert.newNote}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium mb-5">
              Xác nhận này chỉ đổi ghi chú, không hủy món.
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={isConfirming}
            onClick={() => onConfirm(alert.id)}
            className="w-full h-12 rounded-lg bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-98 text-white font-bold text-sm shadow-xs transition-transform disabled:opacity-50"
          >
            {isCancel ? 'Xác nhận ngừng món' : 'Xác nhận cập nhật ghi chú'}
          </button>

          <button
            type="button"
            onClick={() => onDefer(alert.id)}
            className="w-full h-12 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 active:scale-98 text-[#2B2118] font-semibold text-sm transition-transform"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
