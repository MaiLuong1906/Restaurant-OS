'use client';

import * as React from 'react';
import { formatVND } from '@/lib/utils';
import { DISH_CATEGORY_LABELS, DishCategory, DishResponseDto } from '@/types/dish';

export interface DishCatalogListProps {
  dishes: DishResponseDto[];
  selectedId: string | null;
  onSelect: (dish: DishResponseDto) => void;
  onToggle: (dish: DishResponseDto, e: React.MouseEvent) => void;
  isLoading: boolean;
}

/** Skeleton row khi đang load */
function SkeletonRow() {
  return (
    <div className="p-3.5 rounded-xl border border-stone-100 flex items-center gap-3 animate-pulse">
      <div className="w-14 h-14 rounded-lg bg-stone-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-stone-200 rounded w-3/4" />
        <div className="h-2.5 bg-stone-100 rounded w-1/2" />
        <div className="h-2.5 bg-stone-100 rounded w-1/3" />
      </div>
    </div>
  );
}

/**
 * Danh sách món ăn — Dumb Component
 * Hiển thị ảnh, tên, danh mục, giá, badge COMBO và switch bật/tắt bán
 */
export function DishCatalogList({
  dishes,
  selectedId,
  onSelect,
  onToggle,
  isLoading,
}: DishCatalogListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!dishes.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-stone-400">
        <span className="text-4xl mb-3">🍽️</span>
        <p className="text-xs font-semibold">Không tìm thấy món ăn nào</p>
        <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc thêm món mới</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
      {dishes.map((dish) => {
        const isCurrent = dish.id === selectedId;
        const categoryLabel =
          DISH_CATEGORY_LABELS[dish.category as DishCategory] ?? dish.category;

        return (
          <div
            key={dish.id}
            onClick={() => onSelect(dish)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              isCurrent
                ? 'bg-stone-50 border-ops-brand shadow-xs'
                : 'bg-white border-stone-200 hover:bg-stone-50'
            }`}
          >
            {/* Left: image + info */}
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  dish.imageUrl ||
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'
                }
                alt={dish.name}
                className="w-14 h-14 rounded-lg object-cover aspect-square border border-stone-200 shrink-0 shadow-2xs bg-stone-100"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className="text-stone-900 text-sm font-bold truncate block max-w-[160px]">
                    {dish.name}
                  </strong>
                  {dish.isCombo && (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-mono text-xs font-extrabold uppercase border border-amber-200">
                      COMBO
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500 font-medium block">{categoryLabel}</span>
                <div className="flex items-center gap-1.5 pt-0.5 font-mono text-xs">
                  <span className="font-extrabold text-stone-900">{formatVND(dish.price)}</span>
                  {!dish.isAvailable && dish.soldOutReason && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span className="text-rose-500 font-semibold truncate max-w-[80px]" title={dish.soldOutReason}>
                        {dish.soldOutReason}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Availability Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={dish.isAvailable}
              onClick={(e) => onToggle(dish, e)}
              className="flex items-center gap-1.5 group cursor-pointer shrink-0 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors min-h-[48px]"
              title={
                dish.isAvailable
                  ? 'Đang mở bán — Bấm để tạm dừng'
                  : 'Đang tạm hết — Bấm để mở bán lại'
              }
            >
              <span
                className={`text-xs font-bold transition-colors hidden sm:block ${
                  dish.isAvailable ? 'text-emerald-700' : 'text-stone-400'
                }`}
              >
                {dish.isAvailable ? 'Đang bán' : 'Tạm hết'}
              </span>
              <div
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  dish.isAvailable ? 'bg-emerald-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    dish.isAvailable ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
