'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { formatVND } from '@/lib/utils';
import { triggerHaptic } from '@/lib/customer-menu-data';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CustomerBottomNav } from '@/components/customer/CustomerBottomNav';
import { CallStaffSheet } from '@/components/customer/CallStaffSheet';
import {
  Check,
  ChefHat,
  Utensils,
  Sparkles,
  Clock,
  Flame,
  BellRing,
  CheckCircle2,
  PlusCircle,
  Headphones,
  Receipt,
  ChevronRight,
} from 'lucide-react';

export default function CustomerOrdersTrackingPage() {
  const router = useRouter();
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);

  const {
    tableNumber,
    placedBatches,
    expeditePlacedItem,
    getTotalItemCount,
    getPlacedSubtotal,
    getPlacedItemCount,
  } = useCartStore();

  const displayTable = tableNumber || 'Bàn 04';
  const cartCount = getTotalItemCount();
  const placedSubtotal = getPlacedSubtotal();
  const totalOrderedItems = getPlacedItemCount();

  const allItems = placedBatches.flatMap((b) => b.items);
  const servedItemsCount = allItems
    .filter((i) => i.status === 'SERVED')
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] pb-28">
      <CustomerHeader
        title="Phố Cổ"
        subtitle="Món Đã Đặt & Tiến Độ Bếp"
        tableNumber={displayTable}
        showBack
        onOpenCallStaff={() => setIsCallStaffOpen(true)}
      />

      <main className="mx-auto w-full max-w-md px-4 pt-4 space-y-5">
        {/* Status Overview Card & 4-Step Progress Timeline */}
        <div className="relative overflow-hidden rounded-2xl bg-[#fbf2f0] p-4 shadow-2xs border border-[#dcc1b8]/40">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#006b2c] animate-pulse" />
                <span className="font-display text-base font-bold text-[#1e1b1a]">
                  Đang phục vụ {displayTable}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#56423c]">
                Bắt đầu dùng bữa từ 11:30 · {totalOrderedItems} phần đã gọi
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-[#006b2c]/10 px-2.5 py-1 text-[#006b2c]">
              <Utensils className="h-3.5 w-3.5" />
              <span className="ops-nums text-[11px] font-bold">
                {servedItemsCount}/{totalOrderedItems} phần đã lên
              </span>
            </div>
          </div>

          {/* 4-Step Timeline */}
          <div className="mt-4 pt-1">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-4 right-4 top-3.5 h-1 rounded-full bg-[#e9e1df]">
                <div
                  className="h-full rounded-full bg-[#9a401c]"
                  style={{ width: '75%' }}
                />
              </div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9a401c] text-white shadow-xs">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="mt-1.5 text-[11px] font-semibold text-[#1e1b1a]">
                  Gửi bếp
                </span>
                <span className="text-[10px] text-[#56423c]">11:32</span>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9a401c] text-white shadow-xs">
                  <ChefHat className="h-3.5 w-3.5" />
                </div>
                <span className="mt-1.5 text-[11px] font-semibold text-[#1e1b1a]">
                  Đang nấu
                </span>
                <span className="text-[10px] text-[#56423c]">11:35</span>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ba5831] text-white shadow-md animate-pulse">
                  <Utensils className="h-3.5 w-3.5" />
                </div>
                <span className="mt-1.5 text-[11px] font-bold text-[#9a401c]">
                  Lên món
                </span>
                <span className="ops-nums text-[10px] font-semibold text-[#9a401c]">
                  {servedItemsCount}/{totalOrderedItems} món
                </span>
              </div>

              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#efe6e4] text-[#56423c]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="mt-1.5 text-[11px] text-[#56423c]">
                  Dùng bữa
                </span>
                <span className="text-[10px] text-[#89726a]">Thưởng thức</span>
              </div>
            </div>
          </div>
        </div>

        {/* Batches List */}
        {placedBatches.map((batch) => (
          <div key={batch.id} className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    batch.isCompleted ? 'bg-[#615e5b]' : 'bg-[#9a401c]'
                  }`}
                />
                <h2 className="font-display text-sm font-bold text-[#1e1b1a]">
                  {batch.title}
                </h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  batch.isCompleted
                    ? 'bg-[#e7e1dd] text-[#676461]'
                    : 'bg-[#ffdbcf] text-[#9a401c]'
                }`}
              >
                {batch.items.length} món
                {batch.isCompleted ? ' · Hoàn tất' : ''}
              </span>
            </div>

            {batch.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-white p-3.5 shadow-2xs border border-[#dcc1b8]/40 space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f5ecea]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.dishName}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="ops-nums absolute top-1 left-1 rounded bg-[#e1d8d6]/90 px-1.5 py-0.5 text-[10px] font-bold text-[#1e1b1a]">
                      {item.unitLabel}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-sm font-bold text-[#1e1b1a]">
                      {item.dishName}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#56423c]">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="ops-nums font-display text-sm font-extrabold text-[#9a401c]">
                        {formatVND(item.unitPrice * item.quantity)}
                      </span>

                      {item.status === 'COOKING' ? (
                        <div className="flex items-center gap-1 rounded-full bg-[#ba5831]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#9a401c]">
                          <Clock className="h-3.5 w-3.5 animate-spin" />
                          <span>{item.etaText || 'Đang nấu (~5-7p)'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-[#00873a]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#006b2c]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Đã phục vụ ✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expedite Row for Cooking Item */}
                {item.status === 'COOKING' && (
                  <div className="flex items-center justify-between rounded-lg bg-[#fbf2f0] px-3 py-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-[#56423c]">
                      <Flame className="h-3.5 w-3.5 text-[#9a401c]" />
                      <span>
                        {item.cookingNote || 'Bếp đang đun sôi nước lẩu'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
                        expeditePlacedItem(item.id);
                      }}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                        item.expedited
                          ? 'bg-[#00873a] text-white'
                          : 'bg-[#efe6e4] hover:bg-[#e9e1df] text-[#9a401c]'
                      }`}
                    >
                      <BellRing className="h-3 w-3" />
                      <span>
                        {item.expedited ? 'Đã nhắc bếp ✓' : 'Giục món'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Subtotal & Quick Table Actions */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between rounded-xl bg-[#f5ecea] px-4 py-3">
            <div>
              <p className="text-[11px] font-medium text-[#56423c]">
                Tạm tính {totalOrderedItems} phần đã gọi
              </p>
              <p className="ops-nums font-display text-lg font-extrabold text-[#9a401c]">
                {formatVND(placedSubtotal)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#56423c]">
              <Utensils className="h-4 w-4 text-[#9a401c]" />
              <span>{displayTable}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/menu')}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#efe6e4] hover:bg-[#e9e1df] px-4 py-2.5 text-xs font-bold text-[#1e1b1a] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="h-4 w-4 text-[#9a401c]" />
              <span>Gọi thêm món</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCallStaffOpen(true)}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#efe6e4] hover:bg-[#e9e1df] px-4 py-2.5 text-xs font-bold text-[#1e1b1a] active:scale-[0.98] transition-all"
            >
              <Headphones className="h-4 w-4 text-[#006b2c]" />
              <span>Gọi nhân viên</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push('/checkout')}
            className="flex min-h-[52px] w-full items-center justify-between rounded-xl bg-[#9a401c] hover:bg-[#ba5831] px-4 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <span>Yêu cầu thanh toán &amp; Hóa đơn</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </main>

      <CallStaffSheet
        isOpen={isCallStaffOpen}
        tableNumber={displayTable}
        onClose={() => setIsCallStaffOpen(false)}
      />

      <CustomerBottomNav
        activeTab="orders"
        cartCount={cartCount}
        ordersCount={totalOrderedItems}
      />
    </div>
  );
}
