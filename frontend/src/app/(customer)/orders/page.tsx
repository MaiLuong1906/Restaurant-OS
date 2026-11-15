'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { formatVND } from '@/lib/utils';
import {
  FALLBACK_DISH_IMAGE,
  triggerHaptic,
} from '@/lib/customer-menu-data';
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
  AlertCircle,
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

  const progressPercent =
    totalOrderedItems > 0
      ? Math.max(
          25,
          Math.min(100, Math.round((servedItemsCount / totalOrderedItems) * 100))
        )
      : 0;

  const firstBatchTime =
    placedBatches.length > 0
      ? placedBatches[placedBatches.length - 1].submittedAt
      : '--:--';
  const latestBatchTime =
    placedBatches.length > 0 ? placedBatches[0].submittedAt : '--:--';

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] pb-28">
      <CustomerHeader
        title="Đơn Đã Đặt"
        subtitle="Tiến độ bếp thời gian thực"
        tableNumber={displayTable}
        showBack
        onOpenCallStaff={() => setIsCallStaffOpen(true)}
      />

      <main className="mx-auto w-full max-w-md px-4 pt-4 space-y-5">
        {placedBatches.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xs border border-[#dcc1b8]/40 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5ecea] text-[#9a401c]">
              <ChefHat className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-bold text-[#1e1b1a]">
              Chưa có món nào được gửi xuống bếp
            </p>
            <p className="text-xs leading-relaxed text-[#56423c]">
              Quý khách vui lòng chọn món từ Thực đơn, sau đó mở Giỏ hàng và bấm{' '}
              <strong>&ldquo;Gửi Bếp Thực Hiện&rdquo;</strong> để theo dõi tiến
              độ chế biến tại đây.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push('/menu')}
                className="min-h-[44px] w-full rounded-full bg-[#9a401c] py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-transform"
              >
                Chọn món trên Thực đơn
              </button>
              {cartCount > 0 && (
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="min-h-[44px] w-full rounded-full bg-[#ffdbcf] py-2.5 text-xs font-bold text-[#380d00] active:scale-95 transition-transform"
                >
                  Mở Giỏ hàng ({cartCount} món chờ gửi bếp)
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Status Overview Card & 4-Step Progress Timeline */}
            <div className="relative overflow-hidden rounded-2xl bg-[#fbf2f0] p-4 shadow-2xs border border-[#dcc1b8]/40">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#006b2c]" />
                    <span className="truncate font-display text-base font-bold text-[#1e1b1a]">
                      Đang phục vụ {displayTable}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#56423c]">
                    Gửi lượt đầu lúc {firstBatchTime} · {totalOrderedItems} phần
                    đã gọi
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#006b2c]/10 px-2.5 py-1 text-[#006b2c]">
                  <Utensils className="h-3.5 w-3.5" />
                  <span className="ops-nums text-[11px] font-bold">
                    Đã lên {servedItemsCount}/{totalOrderedItems}
                  </span>
                </div>
              </div>

              {/* 4-Step Timeline */}
              <div className="mt-4 pt-1">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-4 right-4 top-3.5 h-1 rounded-full bg-[#e9e1df]">
                    <div
                      className="h-full rounded-full bg-[#9a401c] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
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
                    <span className="ops-nums text-[10px] text-[#56423c]">
                      {firstBatchTime}
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9a401c] text-white shadow-xs">
                      <ChefHat className="h-3.5 w-3.5" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-semibold text-[#1e1b1a]">
                      Chế biến
                    </span>
                    <span className="ops-nums text-[10px] text-[#56423c]">
                      {latestBatchTime}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ba5831] text-white shadow-md">
                      <Utensils className="h-3.5 w-3.5" />
                    </div>
                    <span className="mt-1.5 text-[11px] font-bold text-[#9a401c]">
                      Lên món
                    </span>
                    <span className="ops-nums text-[10px] font-semibold text-[#9a401c]">
                      {servedItemsCount}/{totalOrderedItems} phần
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        servedItemsCount === totalOrderedItems &&
                        totalOrderedItems > 0
                          ? 'bg-[#00873a] text-white'
                          : 'bg-[#efe6e4] text-[#56423c]'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="mt-1.5 text-[11px] text-[#56423c]">
                      Dùng bữa
                    </span>
                    <span className="text-[10px] text-[#89726a]">
                      Thưởng thức
                    </span>
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

                {batch.items.map((item) => {
                  const isWaitingOrReady =
                    item.status === 'WAITING' || item.status === 'READY';

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl bg-white p-3.5 shadow-2xs border border-[#dcc1b8]/40 space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f5ecea]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl || FALLBACK_DISH_IMAGE}
                            alt={item.dishName}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_DISH_IMAGE;
                            }}
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
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="ops-nums font-display text-sm font-extrabold text-[#9a401c]">
                              {formatVND(item.unitPrice * item.quantity)}
                            </span>

                            {item.status === 'WAITING' ? (
                              <div className="flex items-center gap-1 rounded-full bg-[#ba5831]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#9a401c]">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  {item.etaText || 'Chờ bếp (~5-7p)'}
                                </span>
                              </div>
                            ) : item.status === 'READY' ? (
                              <div className="flex items-center gap-1 rounded-full bg-[#00873a]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#006b2c]">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Sẵn sàng lên món</span>
                              </div>
                            ) : item.status === 'REJECTED' ? (
                              <div className="flex items-center gap-1 rounded-full bg-[#fbe3de] px-2.5 py-0.5 text-[11px] font-bold text-[#ba1a1a]">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Tạm hết</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 rounded-full bg-[#00873a]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#006b2c]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Đã phục vụ</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expedite Row for Waiting/Ready Item */}
                      {isWaitingOrReady && (
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-[#fbf2f0] px-3 py-1.5">
                          <span className="flex min-w-0 items-center gap-1.5 text-xs text-[#56423c]">
                            <Flame className="h-3.5 w-3.5 shrink-0 text-[#9a401c]" />
                            <span className="truncate">
                              {item.cookingNote ||
                                'Bếp đang tiếp nhận & chế biến nóng'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(15);
                              expeditePlacedItem(item.id);
                            }}
                            className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                              item.expedited
                                ? 'bg-[#00873a] text-white'
                                : 'bg-[#efe6e4] hover:bg-[#e9e1df] text-[#9a401c]'
                            }`}
                          >
                            {item.expedited ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Đã nhắc bếp</span>
                              </>
                            ) : (
                              <>
                                <BellRing className="h-3 w-3" />
                                <span>Giục món</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
          </>
        )}
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
