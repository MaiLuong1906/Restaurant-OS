'use client';

import * as React from 'react';
import { CookingPot, X, AlertTriangle, Send } from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { formatVND } from '@/lib/utils';

export function WaiterSendKitchenModal() {
  const isSendKitchenModalOpen = useWaiterStore((s) => s.isSendKitchenModalOpen);
  const closeSendKitchenModal = useWaiterStore((s) => s.closeSendKitchenModal);
  const selectedTableId = useWaiterStore((s) => s.selectedTableId);
  const tables = useWaiterStore((s) => s.tables);
  const sendPendingOrderToKitchen = useWaiterStore((s) => s.sendPendingOrderToKitchen);
  const showToast = useWaiterStore((s) => s.showToast);

  const [kitchenNote, setKitchenNote] = React.useState('');

  const currentTable = tables[selectedTableId];
  const pendingItems = currentTable?.pendingItems || [];

  if (!isSendKitchenModalOpen || pendingItems.length === 0) {
    return null;
  }

  const totalPendingQty = pendingItems.reduce((acc, i) => acc + i.qty, 0);

  const handleConfirmSend = () => {
    const sentCount = sendPendingOrderToKitchen(selectedTableId, kitchenNote);
    showToast(`Đã gửi đơn (${sentCount} món / ${totalPendingQty} phần) vào Bếp thành công!`);
    setKitchenNote('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sendKitchenModalTitle"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-ops-border animate-in zoom-in-95 duration-200">
        {/* Burgundy Brand Header */}
        <div className="flex items-center justify-between bg-ops-brand px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
              <CookingPot className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h3
                id="sendKitchenModalTitle"
                className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight"
              >
                Xác nhận gửi đơn vào Bếp
              </h3>
              <p className="text-xs text-rose-200 font-normal">
                Điều phối lệnh order tới KDS Bếp nóng, Bếp lạnh & Quầy Bar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSendKitchenModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Table & Order Meta Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-ops-brand-light border border-ops-brand/20 text-xs">
            <div className="flex flex-col">
              <span className="font-bold text-ops-brand text-sm">{currentTable?.name}</span>
              <span className="text-ops-muted text-[11px]">{currentTable?.zone}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-ink text-sm">{pendingItems.length} món mới</span>
              <span className="text-ops-muted text-[11px] block">{totalPendingQty} suất ăn</span>
            </div>
          </div>

          {/* Pending Dishes List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ops-muted">
              Danh sách món sẽ gửi bếp:
            </span>
            <div className="flex flex-col gap-2 divide-y divide-ops-border/60">
              {pendingItems.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-ink">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-sand-200 text-[11px] font-bold text-ink">
                        {item.qty}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-ops-muted mt-0.5">
                      Trạm: {item.station} {item.note ? `• Lưu ý: "${item.note}"` : ''}
                    </span>
                  </div>
                  <span className="font-bold text-ink whitespace-nowrap">
                    {formatVND(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table General Note Input */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-ops-border">
            <label htmlFor="kitchenGeneralNote" className="text-xs font-bold text-ops-muted">
              Ghi chú thêm cho Bếp & Bar:
            </label>
            <input
              id="kitchenGeneralNote"
              type="text"
              value={kitchenNote}
              onChange={(e) => setKitchenNote(e.target.value)}
              placeholder="Ví dụ: Ưu tiên lên trước đồ uống, khách chuẩn bị dùng tiệc..."
              className="w-full rounded-xl border border-ops-border bg-ops-bg px-3.5 py-2 text-xs text-ink placeholder-sand-500 focus:border-ops-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <span>
              Món sau khi gửi sẽ xuất hiện ngay trên màn hình KDS bếp và không thể tự ý hủy nếu bếp đã bắt đầu nấu.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-ops-border bg-ops-bg px-6 py-4">
          <button
            type="button"
            onClick={closeSendKitchenModal}
            className="rounded-xl border border-ops-border bg-white px-4 py-2 text-xs font-semibold text-ops-muted hover:bg-ops-bg hover:text-ink transition-colors"
          >
            Quay lại chỉnh sửa
          </button>

          <button
            type="button"
            onClick={handleConfirmSend}
            className="flex items-center gap-1.5 rounded-xl bg-ops-brand hover:bg-ops-brand-dark px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Xác nhận gửi vào Bếp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
