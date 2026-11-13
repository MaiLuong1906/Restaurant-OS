'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { formatVND, generateIdempotencyKey } from '@/lib/utils';
import { triggerHaptic } from '@/lib/customer-menu-data';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CustomerBottomNav } from '@/components/customer/CustomerBottomNav';
import { CallStaffSheet } from '@/components/customer/CallStaffSheet';
import {
  Utensils,
  Trash2,
  Plus,
  Minus,
  FileEdit,
  ArrowRight,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function CustomerCartPage() {
  const router = useRouter();
  const [editingNoteDishId, setEditingNoteDishId] = useState<string | null>(
    null
  );
  const [tempDishNote, setTempDishNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);

  const {
    tableNumber,
    items,
    customerNotes,
    updateQuantity,
    removeItem,
    updateItemNote,
    setNotes,
    submitOrderToKitchen,
    getTotalAmount,
    getTotalItemCount,
    getPlacedItemCount,
  } = useCartStore();

  const displayTable = tableNumber || 'Bàn 04';
  const cartCount = getTotalItemCount();
  const cartTotal = getTotalAmount();
  const placedCount = getPlacedItemCount();

  const handleSubmitKitchen = () => {
    if (items.length === 0 || isSubmitting) return;
    triggerHaptic(25);
    setIsSubmitting(true);
    const idempotencyKey = generateIdempotencyKey();

    setTimeout(() => {
      submitOrderToKitchen(idempotencyKey);
      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
      setTimeout(() => {
        router.push('/orders');
      }, 900);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] pb-28">
      <CustomerHeader
        title="Phố Cổ"
        subtitle="Giỏ Hàng Tạm Tính"
        tableNumber={displayTable}
        showBack
        onOpenCallStaff={() => setIsCallStaffOpen(true)}
      />

      <main className="mx-auto w-full max-w-md px-4 pt-4 space-y-4">
        {/* Session Status Banner */}
        <div className="flex items-center justify-between rounded-xl bg-[#f5ecea] p-3.5 shadow-2xs border border-[#dcc1b8]/40">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffdbcf] text-[#380d00]">
              <Utensils className="h-5 w-5 text-[#9a401c]" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-[#1e1b1a]">
                {displayTable} • Đơn tạm tính
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#56423c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00873a] animate-pulse" />
                <span>Đang kết nối POS bếp trực tiếp</span>
              </p>
            </div>
          </div>
          <span className="ops-nums shrink-0 rounded-full bg-[#efe6e4] px-3 py-1 text-xs font-bold text-[#9a401c]">
            {cartCount} món
          </span>
        </div>

        {/* Cart Items List */}
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xs border border-[#dcc1b8]/40 space-y-3">
            <p className="font-display text-base font-bold text-[#1e1b1a]">
              Giỏ hàng tạm tính đang trống
            </p>
            <p className="text-xs text-[#56423c]">
              Quý khách có thể chọn thêm các món đặc sản Phố Cổ hoặc xem lại các
              món đã gửi bếp.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push('/menu')}
                className="min-h-[44px] w-full rounded-full bg-[#9a401c] py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-transform"
              >
                Khám phá Thực đơn
              </button>
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="min-h-[44px] w-full rounded-full bg-[#e7e1dd] py-2.5 text-xs font-bold text-[#1d1b19] active:scale-95 transition-transform"
              >
                Xem món đã đặt ({placedCount} món)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const modifierExtra = item.selectedModifiers.reduce(
                (acc, m) => acc + m.extraPrice,
                0
              );
              const unitPrice = item.dish.price + modifierExtra;
              const lineTotal = unitPrice * item.quantity;
              const isEditingThisNote = editingNoteDishId === item.dish.id;

              return (
                <div
                  key={`${item.dish.id}-${JSON.stringify(item.selectedModifiers)}`}
                  className="rounded-xl bg-white p-3.5 shadow-2xs border border-[#dcc1b8]/40 space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    {item.dish.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.dish.imageUrl}
                        alt={item.dish.name}
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-lg object-cover bg-[#efe6e4]"
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-display text-sm font-bold text-[#1e1b1a]">
                          {item.dish.name}
                        </h3>
                        <button
                          type="button"
                          aria-label="Xóa món"
                          onClick={() => removeItem(item.dish.id)}
                          className="p-1 text-[#615e5b] hover:text-[#ba1a1a] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="ops-nums mt-0.5 font-display text-sm font-extrabold text-[#9a401c]">
                        {formatVND(lineTotal)}
                      </div>

                      {item.quantity > 1 && (
                        <div className="ops-nums text-[11px] text-[#615e5b]">
                          {formatVND(unitPrice)} × {item.quantity} phần
                        </div>
                      )}

                      {item.selectedModifiers.length > 0 && (
                        <p className="mt-1 text-[11px] text-[#56423c]">
                          {item.selectedModifiers
                            .map((m) => m.selected)
                            .join(' • ')}
                        </p>
                      )}

                      {item.note && !isEditingThisNote ? (
                        <div className="mt-1.5 flex items-center gap-1.5 rounded bg-[#f5ecea] px-2 py-1 text-[11px] text-[#56423c]">
                          <FileEdit className="h-3.5 w-3.5 text-[#9a401c] shrink-0" />
                          <span className="truncate">{item.note}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isEditingThisNote ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={tempDishNote}
                        onChange={(e) => setTempDishNote(e.target.value)}
                        placeholder="Nhập ghi chú riêng cho món này..."
                        className="flex-1 rounded-lg bg-[#f5ecea] px-3 py-1.5 text-xs text-[#1e1b1a] focus:outline-none focus:ring-1 focus:ring-[#9a401c]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateItemNote(item.dish.id, tempDishNote.trim());
                          setEditingNoteDishId(null);
                        }}
                        className="rounded-lg bg-[#9a401c] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteDishId(item.dish.id);
                        setTempDishNote(item.note || '');
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-[#615e5b] hover:text-[#9a401c] transition-colors"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>{item.note ? 'Đổi ghi chú' : 'Thêm ghi chú'}</span>
                    </button>

                    <div className="flex items-center rounded-full bg-[#f5ecea] p-0.5 shadow-inner">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => updateQuantity(item.dish.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1e1b1a] shadow-2xs active:scale-90 transition-transform"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="ops-nums w-8 text-center text-xs font-bold text-[#1e1b1a]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => updateQuantity(item.dish.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1e1b1a] shadow-2xs active:scale-90 transition-transform"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* General Table Note Section */}
        <div className="rounded-xl bg-white p-3.5 shadow-2xs border border-[#dcc1b8]/40 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="table-general-note"
              className="flex items-center gap-1.5 text-xs font-bold text-[#1e1b1a]"
            >
              <Utensils className="h-4 w-4 text-[#9a401c]" />
              <span>Ghi chú chung cho đầu bếp &amp; quầy bar</span>
            </label>
            <span className="text-[11px] text-[#615e5b]">Tùy chọn</span>
          </div>

          <textarea
            id="table-general-note"
            rows={2}
            value={customerNotes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Mang đồ uống lên trước giúp em, làm ít cay cho trẻ nhỏ..."
            className="w-full resize-none rounded-lg bg-[#f5ecea] p-2.5 text-xs text-[#1e1b1a] placeholder:text-[#615e5b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9a401c]"
          />

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { label: '☕ Lên nước trước', value: 'Mang đồ uống lên trước giúp em' },
              { label: '🌿 Không hành', value: 'Không bỏ hành lá' },
              { label: '🥣 Thêm bát thìa', value: 'Cho thêm bát thìa trẻ em' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setNotes(chip.value)}
                className="shrink-0 rounded-full bg-[#f5ecea] hover:bg-[#efe6e4] px-2.5 py-1 text-[11px] font-medium text-[#56423c] transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action & Summary Card */}
        <div className="rounded-xl bg-white p-3.5 shadow-2xs border border-[#dcc1b8]/40 space-y-2.5">
          {items.length > 0 && (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-[#56423c]">
                Tạm tính giỏ hiện tại ({cartCount} món):
              </span>
              <span className="ops-nums font-display text-base font-extrabold text-[#9a401c]">
                {formatVND(cartTotal)}
              </span>
            </div>
          )}

          {/* Primary Confirm & Send to Kitchen Button */}
          <button
            type="button"
            disabled={items.length === 0 || isSubmitting}
            onClick={handleSubmitKitchen}
            className={`flex h-14 w-full items-center justify-between rounded-full px-5 text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 ${
              isSubmittedSuccess
                ? 'bg-[#00873a]'
                : 'bg-[#9a401c] hover:bg-[#ba5831]'
            }`}
          >
            {isSubmitting ? (
              <div className="flex w-full items-center justify-center gap-2 text-xs font-bold">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang gửi tới Bếp &amp; Quầy bar...</span>
              </div>
            ) : isSubmittedSuccess ? (
              <div className="flex w-full items-center justify-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-5 w-5" />
                <span>Đã gửi bếp thành công!</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="h-4 w-4" />
                    <span className="text-sm font-bold">
                      Gửi Bếp Thực Hiện
                    </span>
                  </div>
                  <span className="text-[11px] text-white/90">
                    Chưa cần thanh toán ngay
                  </span>
                </div>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Request Bill / View Receipt Link */}
          <button
            type="button"
            onClick={() => router.push('/checkout')}
            className="flex w-full items-center justify-between gap-2.5 rounded-xl bg-[#fbf2f0] hover:bg-[#f5ecea] p-3 text-left transition-colors active:scale-[0.98]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7ffc97] text-[#002109]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#1e1b1a]">
                  Yêu cầu thanh toán / Xem hóa đơn
                </p>
                <p className="truncate text-[11px] text-[#615e5b]">
                  Bấm để xem hóa đơn tổng hợp và xác nhận thanh toán
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#615e5b] shrink-0" />
          </button>

          {/* Add More Dishes Button */}
          <button
            type="button"
            onClick={() => router.push('/menu')}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#e7e1dd] hover:bg-[#e9e1df] text-xs font-bold text-[#1d1b19] active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4 text-[#9a401c]" />
            <span>Thêm món khác</span>
          </button>
        </div>

        {/* Operational Info Note */}
        <div className="flex items-center gap-2.5 rounded-xl bg-[#f5ecea] p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7ffc97] text-[#002109]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-[11px] leading-relaxed text-[#56423c]">
            Quý khách có thể thoải mái gọi món nhiều lần. Tiền chỉ được tính
            tổng hợp khi quý khách bấm Yêu cầu thanh toán.
          </p>
        </div>
      </main>

      <CallStaffSheet
        isOpen={isCallStaffOpen}
        tableNumber={displayTable}
        onClose={() => setIsCallStaffOpen(false)}
      />

      <CustomerBottomNav
        activeTab="cart"
        cartCount={cartCount}
        ordersCount={placedCount}
      />
    </div>
  );
}
