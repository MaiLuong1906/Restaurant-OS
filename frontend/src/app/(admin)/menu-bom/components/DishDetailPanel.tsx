'use client';

import * as React from 'react';
import { Edit2, Trash2, Package, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { DISH_CATEGORY_LABELS, DishCategory, DishResponseDto } from '@/types/dish';

export interface DishDetailPanelProps {
  dish: DishResponseDto | null;
  onEdit: (dish: DishResponseDto) => void;
  onDelete: (dish: DishResponseDto) => void;
}

/**
 * Panel chi tiết món ăn — Dumb Component
 * - Nếu isCombo: hiển thị danh sách comboItems
 * - Nếu không: hiển thị BOM placeholder (Coming Soon)
 */
export function DishDetailPanel({ dish, onEdit, onDelete }: DishDetailPanelProps) {
  if (!dish) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-300">
        <UtensilsCrossed className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-sm font-semibold text-stone-400">Chọn một món để xem chi tiết</p>
      </div>
    );
  }

  const categoryLabel =
    DISH_CATEGORY_LABELS[dish.category as DishCategory] ?? dish.category;

  const comboTotal = dish.comboItems.reduce(
    (sum, item) => sum + item.dishPrice * item.quantity,
    0
  );

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* Header: tên + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-ops text-lg font-bold text-stone-900 truncate">{dish.name}</h2>
            {dish.isCombo && (
              <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-mono text-xs font-extrabold uppercase border border-amber-200">
                COMBO
              </span>
            )}
            <span
              className={`shrink-0 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                dish.isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {dish.isAvailable ? '● Đang bán' : '○ Tạm hết'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              {categoryLabel}
            </span>
            {dish.description && (
              <span className="text-xs text-stone-500 italic truncate max-w-[300px]">
                {dish.description}
              </span>
            )}
          </div>
          {!dish.isAvailable && dish.soldOutReason && (
            <p className="text-xs text-rose-500 font-semibold mt-1">
              Lý do hết: {dish.soldOutReason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(dish)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg font-mono text-xs font-bold uppercase cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onDelete(dish)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-mono text-xs font-bold uppercase cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
        <div>
          <span className="font-mono text-xs uppercase text-stone-500 block font-bold tracking-wider">
            Giá Bán Niêm Yết
          </span>
          <span className="font-mono text-lg font-extrabold text-stone-900 mt-1 block">
            {formatVND(dish.price)}
          </span>
        </div>
        {dish.isCombo && (
          <>
            <div>
              <span className="font-mono text-xs uppercase text-stone-500 block font-bold tracking-wider">
                Tổng Giá Vốn Combo
              </span>
              <span className="font-mono text-lg font-extrabold text-ops-brand mt-1 block">
                {formatVND(comboTotal)}
              </span>
            </div>
            <div>
              <span className="font-mono text-xs uppercase text-stone-500 block font-bold tracking-wider">
                Tiết Kiệm (Khách)
              </span>
              <span className="font-mono text-lg font-extrabold text-emerald-700 mt-1 block">
                {formatVND(Math.max(0, comboTotal - dish.price))}
              </span>
            </div>
          </>
        )}
        {!dish.isCombo && (
          <>
            <div className="col-span-2 flex items-center justify-center text-stone-300">
              <span className="text-xs font-semibold italic">
                * BOM định lượng nguyên liệu — Coming in next Sprint
              </span>
            </div>
          </>
        )}
      </div>

      {/* Combo Items Table */}
      {dish.isCombo && dish.comboItems.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center gap-2 pb-2 shrink-0">
            <Package className="w-4 h-4 text-amber-600" />
            <span className="font-mono text-xs uppercase font-bold text-stone-700 tracking-wider">
              Thành Phần Combo ({dish.comboItems.length} món)
            </span>
          </div>
          <div className="overflow-y-auto border border-stone-200 rounded-xl shadow-2xs bg-white flex-1 max-h-[300px]">
            <table className="w-full text-left text-xs border-collapse min-w-[480px]">
              <thead className="sticky top-0 z-10 bg-stone-100 shadow-2xs">
                <tr className="border-b border-stone-200 text-stone-600 font-mono text-[10px] uppercase">
                  <th className="py-3 px-3 font-bold">Tên Món</th>
                  <th className="py-3 px-3 font-bold text-center">SL</th>
                  <th className="py-3 px-3 font-bold text-right">Đơn Giá</th>
                  <th className="py-3 px-3 font-bold text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {dish.comboItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        {item.dishImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.dishImageUrl}
                            alt={item.dishName}
                            className="w-8 h-8 rounded-md object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-stone-400" />
                          </div>
                        )}
                        <div>
                          <strong className="text-stone-900 font-bold text-xs block">
                            {item.dishName}
                          </strong>
                          <span className="text-stone-400 text-[10px]">
                            {DISH_CATEGORY_LABELS[item.dishCategory as DishCategory] ??
                              item.dishCategory}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-stone-900">×{item.quantity}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-stone-700 font-semibold">
                      {formatVND(item.dishPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-stone-900">
                      {formatVND(item.dishPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50 border-t-2 border-stone-200">
                <tr>
                  <td colSpan={3} className="py-3 px-3 font-mono text-xs font-bold text-stone-600 uppercase">
                    <div className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Tổng Giá Vốn Thành Phần
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-ops-brand text-sm">
                    {formatVND(comboTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* BOM Placeholder (non-combo) */}
      {!dish.isCombo && (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl py-12 text-stone-300">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm font-semibold text-stone-400">BOM Định Lượng Nguyên Liệu</p>
          <p className="text-xs text-stone-400 mt-1">Tính năng sẽ ra mắt trong Sprint tiếp theo</p>
        </div>
      )}
    </div>
  );
}
