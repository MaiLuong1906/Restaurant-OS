'use client';

import * as React from 'react';
import { AlertTriangle, Trash2, UtensilsCrossed } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { DishResponseDto } from '@/types/dish';
import { AdminModal } from '@/components/admin/AdminModal';

export interface DeleteDishModalProps {
  dish: DishResponseDto;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Modal xác nhận xóa món ăn — Dumb Component
 */
export function DeleteDishModal({ dish, isDeleting, onConfirm, onClose }: DeleteDishModalProps) {
  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title="Xác Nhận Xóa Món Ăn"
      icon={<Trash2 className="w-5 h-5" />}
      description="Thao tác này không thể hoàn tác"
      maxWidth="sm"
      ariaLabel="Xác nhận xóa món ăn"
      footer={
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Xóa Vĩnh Viễn
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        {/* Dish preview */}
        <div className="flex items-center gap-3 w-full p-3 bg-stone-50 rounded-xl border border-stone-200">
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-6 h-6 text-stone-400" />
            </div>
          )}
          <div className="text-left min-w-0">
            <strong className="text-stone-900 font-bold block truncate">{dish.name}</strong>
            <span className="text-xs text-stone-500">{dish.category}</span>
            <span className="font-mono text-sm font-extrabold text-stone-900 block">
              {formatVND(dish.price)}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 font-semibold">
            {dish.isCombo
              ? 'Xóa combo này sẽ xóa toàn bộ dữ liệu liên kết các món thành phần. Hành động không thể hoàn tác.'
              : 'Xóa món ăn sẽ xóa vĩnh viễn khỏi thực đơn. Nếu món đang là thành phần của combo, hãy kiểm tra trước.'}
          </p>
        </div>
      </div>
    </AdminModal>
  );
}
