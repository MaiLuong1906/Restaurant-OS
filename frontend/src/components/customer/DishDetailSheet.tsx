'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CustomerDish,
  FALLBACK_DISH_IMAGE,
  triggerHaptic,
} from '@/lib/customer-menu-data';
import { formatVND } from '@/lib/utils';
import {
  X,
  Plus,
  Minus,
  Check,
  Leaf,
  Info,
  Utensils,
} from 'lucide-react';

export interface DishDetailSheetProps {
  dish: CustomerDish | null;
  onClose: () => void;
  onAddToCart: (
    dish: CustomerDish,
    selectedModifiers: { name: string; selected: string; extraPrice: number }[],
    note: string,
    quantity: number
  ) => void;
}

export function DishDetailSheet({
  dish,
  onClose,
  onAddToCart,
}: DishDetailSheetProps) {
  const [selectedPortionId, setSelectedPortionId] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [chefNote, setChefNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dish) {
      setSelectedPortionId(dish.portionSizes?.[0]?.id || '');
      setSelectedAddonIds([]);
      setChefNote('');
      setQuantity(1);
      setAddedSuccess(false);
    }
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [dish]);

  useEffect(() => {
    if (!dish) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dish, onClose]);

  if (!dish) return null;

  const portionOptions = dish.portionSizes ?? [];
  const addonOptions = dish.addons ?? [];
  const isAvailable = dish.isAvailable !== false;

  const activePortion =
    portionOptions.find((p) => p.id === selectedPortionId) || portionOptions[0];
  const portionDelta = activePortion ? activePortion.price - dish.price : 0;

  const addonsExtraTotal = addonOptions
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.extraPrice, 0);

  const unitFinalPrice = dish.price + portionDelta + addonsExtraTotal;
  const totalAmount = unitFinalPrice * quantity;

  const toggleAddon = (id: string) => {
    triggerHaptic(10);
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmAdd = () => {
    if (addedSuccess) return;
    triggerHaptic(20);
    const modifiers: { name: string; selected: string; extraPrice: number }[] =
      [];

    // Chỉ đẩy modifier Kích thước phần khi khách chọn phần khác mặc định (extraPrice > 0)
    // để khi chọn phần chuẩn sẽ gộp chung dòng với nút Thêm nhanh trên card
    if (
      activePortion &&
      portionOptions.length > 0 &&
      (portionDelta !== 0 || activePortion.id !== portionOptions[0].id)
    ) {
      modifiers.push({
        name: 'Kích thước phần',
        selected: activePortion.label,
        extraPrice: portionDelta,
      });
    }

    addonOptions
      .filter((a) => selectedAddonIds.includes(a.id))
      .forEach((addon) => {
        modifiers.push({
          name: 'Món kèm',
          selected: addon.label,
          extraPrice: addon.extraPrice,
        });
      });

    onAddToCart(dish, modifiers, chefNote.trim(), quantity);
    setAddedSuccess(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết món ${dish.name}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-[#342f2e]/55 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-[#fff8f6] text-[#1e1b1a] shadow-2xl"
      >
        {/* Top Grab Pill */}
        <div className="flex w-full items-center justify-center pt-2 pb-1 bg-[#fff8f6]">
          <div className="h-1 w-10 rounded-full bg-[#e7e1dd]" />
        </div>

        {/* Hero Image */}
        <div className="relative h-52 w-full shrink-0 overflow-hidden bg-[#efe6e4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dish.imageUrl || FALLBACK_DISH_IMAGE}
            alt={dish.name}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_DISH_IMAGE;
            }}
            className="h-full w-full object-cover select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f6] via-transparent to-black/30" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết món"
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff8f6]/90 text-[#1e1b1a] shadow-md active:scale-95 transition-transform"
          >
            <X className="h-5 w-5" />
          </button>

          {dish.isVegetarian ? (
            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-[#00873a] px-2.5 py-1 text-white shadow-xs">
              <Leaf className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Món Chay Thanh Đạm
              </span>
            </div>
          ) : (
            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-[#9a401c] px-2.5 py-1 text-white shadow-xs">
              <Utensils className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Chuẩn Vị Truyền Thống
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Options */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-5">
          {/* Title & Base Price */}
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-[#1e1b1a]">
              {dish.name}
            </h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="ops-nums font-display text-lg font-bold text-[#9a401c]">
                {formatVND(dish.price)}
              </span>
              {dish.badge ? (
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  !isAvailable
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-[#efe6e4] text-[#56423c]'
                }`}>
                  {dish.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#56423c]">
              {dish.description}
            </p>
          </div>

          {!isAvailable && (
            <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900 flex items-center gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                Món ăn này hiện đang tạm hết phục vụ tại bếp. Quý khách vui lòng tham khảo các món ăn khác trong thực đơn.
              </span>
            </div>
          )}

          {/* Group 1: Portion Size (Radio) - Chỉ hiển thị khi món có dữ liệu portionSizes */}
          {portionOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold text-[#1e1b1a]">
                    Kích thước phần
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9a401c]" />
                </div>
                <span className="rounded-full bg-[#ffdbcf] px-2.5 py-0.5 text-[11px] font-bold text-[#9a401c]">
                  Bắt buộc
                </span>
              </div>
              <p className="text-xs text-[#615e5b]">
                Vui lòng chọn 1 kích cỡ phù hợp khẩu phần của bạn
              </p>

              <div className="space-y-2 pt-1">
                {portionOptions.map((option) => {
                  const isSelected = activePortion?.id === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setSelectedPortionId(option.id);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all ${
                        isSelected
                          ? 'bg-[#f5ecea] ring-1.5 ring-[#9a401c]'
                          : 'bg-[#fbf2f0] hover:bg-[#f5ecea]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            isSelected ? 'bg-[#9a401c]' : 'bg-[#e9e1df]'
                          }`}
                        >
                          {isSelected ? (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1e1b1a]">
                            {option.label}
                          </p>
                          <p className="text-[11px] text-[#615e5b]">
                            {option.subtext}
                          </p>
                        </div>
                      </div>
                      <span className="ops-nums text-xs font-bold text-[#1e1b1a]">
                        {formatVND(option.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group 2: Add-ons (Checkbox) - Chỉ hiển thị khi món có dữ liệu addons */}
          {addonOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-[#1e1b1a]">
                  Món ăn kèm thêm
                </span>
                <span className="text-[11px] font-medium text-[#615e5b]">
                  Tùy chọn
                </span>
              </div>
              <p className="text-xs text-[#615e5b]">
                Chọn thêm đồ ăn kèm theo sở thích vị giác của bạn
              </p>

              <div className="space-y-2 pt-1">
                {addonOptions.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all ${
                        isChecked
                          ? 'bg-[#f5ecea] ring-1.5 ring-[#9a401c]'
                          : 'bg-[#fbf2f0] hover:bg-[#f5ecea]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md ${
                            isChecked
                              ? 'bg-[#9a401c] text-white'
                              : 'bg-[#e9e1df]'
                          }`}
                        >
                          {isChecked ? <Check className="h-3.5 w-3.5" /> : null}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1e1b1a]">
                            {addon.label}
                          </p>
                          <p className="text-[11px] text-[#615e5b]">
                            {addon.subtext}
                          </p>
                        </div>
                      </div>
                      <span className="ops-nums text-xs font-bold text-[#9a401c]">
                        +{formatVND(addon.extraPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group 3: Chef Note */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-[#1e1b1a]">
                Ghi chú cho đầu bếp
              </span>
              <span className="text-[11px] text-[#615e5b]">Không bắt buộc</span>
            </div>
            <textarea
              rows={3}
              value={chefNote}
              onChange={(e) => setChefNote(e.target.value)}
              placeholder="Ví dụ: Ít ớt cay, rán giòn kỹ, để nước chấm riêng không lấy hạt tiêu..."
              className="w-full resize-none rounded-xl bg-[#fbf2f0] p-3.5 text-xs text-[#1e1b1a] placeholder:text-[#89726a] focus:bg-[#efe6e4] focus:outline-none focus:ring-1 focus:ring-[#9a401c]"
            />
            <div className="flex items-center gap-1.5 px-1 text-[11px] text-[#615e5b]">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                Đầu bếp sẽ chuẩn bị món theo đúng khẩu vị riêng của quý khách.
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Add-to-Cart Bar */}
        <div className="shrink-0 border-t border-[#dcc1b8]/50 bg-[#fff8f6] px-4 py-3.5 shadow-[0_-6px_24px_-6px_rgba(41,37,36,0.12)]">
          {isAvailable ? (
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex shrink-0 items-center justify-between rounded-full bg-[#efe6e4] px-1.5 py-1 min-w-[110px]">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Giảm số lượng"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8f6] text-[#1e1b1a] shadow-xs active:scale-90 transition-transform disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="ops-nums px-2 text-sm font-bold text-[#1e1b1a]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Tăng số lượng"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8f6] text-[#1e1b1a] shadow-xs active:scale-90 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add CTA */}
              <button
                type="button"
                onClick={handleConfirmAdd}
                className={`flex min-h-[48px] flex-1 items-center justify-between rounded-full px-4 text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] ${
                  addedSuccess
                    ? 'bg-[#00873a]'
                    : 'bg-[#9a401c] hover:bg-[#ba5831]'
                }`}
              >
                {addedSuccess ? (
                  <span className="flex w-full items-center justify-center gap-1.5">
                    <Check className="h-4 w-4" />
                    <span>Đã thêm vào giỏ!</span>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Utensils className="h-4 w-4" />
                      <span>Thêm vào giỏ</span>
                    </span>
                    <span className="ops-nums text-sm font-extrabold">
                      {formatVND(totalAmount)}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="flex min-h-[48px] w-full items-center justify-center rounded-full px-4 text-xs font-bold text-stone-500 bg-stone-200 cursor-not-allowed"
            >
              Món ăn tạm hết • Không thể đặt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
