'use client';

import * as React from 'react';
import { Plus, Trash2, UtensilsCrossed, Upload, X, Loader2 } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import {
  DISH_CATEGORY_LABELS,
  DishCategory,
  DishResponseDto,
  ComboItemRequest,
  CreateDishRequest,
  UpdateDishRequest,
} from '@/types/dish';
import { AdminModal } from '@/components/admin/AdminModal';
import { dishService } from '@/services/dishService';
import { storageService, UploadResult } from '@/services/storageService';

// Danh sách category cố định theo enum backend
const ALL_CATEGORIES: DishCategory[] = [
  'MAIN',
  'APPETIZER',
  'SIDE_DISH',
  'DESSERT',
  'DRINK',
  'COMBO',
];

export interface DishFormModalProps {
  mode: 'create' | 'edit';
  dish?: DishResponseDto;           // Chỉ dùng khi mode = 'edit'
  availableDishes: DishResponseDto[]; // Món lẻ có thể chọn làm thành phần combo
  isSubmitting: boolean;
  onSubmit: (data: CreateDishRequest | UpdateDishRequest) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  name: string;
  description: string;
  price: string;        // string để dễ input, convert khi submit
  category: DishCategory;
  imageUrl: string;
  isAvailable: boolean;
  isCombo: boolean;
  comboItems: ComboItemRequest[];
}

function getInitialState(dish?: DishResponseDto): FormState {
  if (!dish) {
    return {
      name: '',
      description: '',
      price: '50000',
      category: 'MAIN',
      imageUrl: '',
      isAvailable: true,
      isCombo: false,
      comboItems: [],
    };
  }
  return {
    name: dish.name,
    description: dish.description ?? '',
    price: String(dish.price),
    category: dish.category as DishCategory,
    imageUrl: dish.imageUrl ?? '',
    isAvailable: dish.isAvailable,
    isCombo: dish.isCombo,
    comboItems: dish.comboItems.map((ci) => ({ dishId: ci.dishId, quantity: ci.quantity })),
  };
}

/**
 * Modal tạo / chỉnh sửa món ăn — Dumb Component
 * Validation client-side: tên, giá, không trùng dishId trong combo
 */
export function DishFormModal({
  mode,
  dish,
  availableDishes,
  isSubmitting,
  onSubmit,
  onClose,
}: DishFormModalProps) {
  const [form, setForm] = React.useState<FormState>(() => getInitialState(dish));
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState | 'combo' | 'image', string>>>({});
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [storageType, setStorageType] = React.useState<'supabase' | 'base64' | null>(() => {
    if (!dish?.imageUrl) return null;
    return dish.imageUrl.startsWith('data:') ? 'base64' : 'supabase';
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Khi edit và dish thay đổi — reset form
  React.useEffect(() => {
    setForm(getInitialState(dish));
    setErrors({});
    if (dish?.imageUrl) {
      setStorageType(dish.imageUrl.startsWith('data:') ? 'base64' : 'supabase');
    } else {
      setStorageType(null);
    }
  }, [dish]);

  // Xử lý upload file hình ảnh qua Hybrid Storage Service
  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Kích thước file vượt quá 5MB' }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setIsUploadingImage(true);
    try {
      const result: UploadResult = await storageService.uploadDishImage(file);
      setForm((p) => ({ ...p, imageUrl: result.url }));
      setStorageType(result.storageType);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image: err instanceof Error ? err.message : 'Lỗi khi xử lý file ảnh',
      }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Khi chuyển isCombo = false → xóa comboItems
  const handleIsComboChange = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isCombo: checked,
      category: checked ? 'COMBO' : (prev.category === 'COMBO' ? 'MAIN' : prev.category),
      comboItems: checked ? prev.comboItems : [],
    }));
  };

  const handleAddComboItem = () => {
    // Thêm item trống đầu tiên chưa có trong danh sách
    const usedIds = new Set(form.comboItems.map((ci) => ci.dishId));
    const nextDish = availableDishes.find((d) => !usedIds.has(d.id));
    if (!nextDish) return;
    setForm((prev) => ({
      ...prev,
      comboItems: [...prev.comboItems, { dishId: nextDish.id, quantity: 1 }],
    }));
  };

  const handleRemoveComboItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      comboItems: prev.comboItems.filter((_, i) => i !== index),
    }));
  };

  const handleComboItemChange = (
    index: number,
    field: 'dishId' | 'quantity',
    value: string | number
  ) => {
    setForm((prev) => {
      const updated = [...prev.comboItems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, comboItems: updated };
    });
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = 'Tên món không được để trống';
    const price = Number(form.price);
    if (isNaN(price) || price < 0 || !Number.isInteger(price)) {
      newErrors.price = 'Giá phải là số nguyên VND không âm';
    }
    if (form.isCombo) {
      if (form.comboItems.length < 2) {
        newErrors.combo = 'Combo phải có ít nhất 2 món thành phần';
      } else {
        const validation = dishService.validateComboItems(form.comboItems);
        if (!validation.valid) newErrors.combo = validation.error;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const price = Number(form.price);
    const payload: CreateDishRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price,
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
      isAvailable: form.isAvailable,
      isCombo: form.isCombo,
      comboItems: form.isCombo ? form.comboItems : undefined,
    };

    await onSubmit(payload);
  };

  const title = mode === 'create' ? 'Thêm Món Ăn Mới' : `Chỉnh Sửa: ${dish?.name ?? ''}`;

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title={title}
      icon={<UtensilsCrossed className="w-5 h-5" />}
      description={
        mode === 'create'
          ? 'Điền đầy đủ thông tin để thêm vào thực đơn'
          : 'Cập nhật thông tin món ăn'
      }
      maxWidth="lg"
      ariaLabel={title}
      footer={
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="dish-form"
            disabled={isSubmitting || isUploadingImage}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs disabled:opacity-60"
          >
            {isSubmitting || isUploadingImage ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {isUploadingImage ? 'Đang tải ảnh...' : 'Đang lưu...'}
              </>
            ) : mode === 'create' ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                Tạo Món
              </>
            ) : (
              'Lưu Thay Đổi'
            )}
          </button>
        </div>
      }
    >
      <form id="dish-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Tên */}
        <div>
          <label className="font-mono text-[10px] uppercase font-bold text-stone-500 block mb-1">
            Tên Món Ăn *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Phở Bò Đặc Biệt"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-ops-brand font-medium transition-colors"
          />
          {errors.name && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.name}</p>}
        </div>

        {/* Mô tả */}
        <div>
          <label className="font-mono text-[10px] uppercase font-bold text-stone-500 block mb-1">
            Mô Tả (tùy chọn)
          </label>
          <textarea
            rows={2}
            placeholder="Mô tả ngắn về món ăn..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-ops-brand font-medium resize-none transition-colors"
          />
        </div>

        {/* Giá + Danh mục */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-stone-500 block mb-1">
              Giá Bán (VND) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-ops-brand font-mono font-bold transition-colors"
            />
            {errors.price && (
              <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-stone-500 block mb-1">
              Danh Mục
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as DishCategory }))}
              disabled={form.isCombo}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-ops-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ALL_CATEGORIES.filter((c) => form.isCombo ? c === 'COMBO' : c !== 'COMBO').map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {DISH_CATEGORY_LABELS[cat]}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Hình Ảnh Món Ăn (File Upload) */}
        <div>
          <label className="font-mono text-[10px] uppercase font-bold text-stone-500 block mb-1">
            Hình Ảnh Món Ăn
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {isUploadingImage ? (
            <div className="flex flex-col items-center justify-center p-6 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <Loader2 className="w-6 h-6 text-ops-brand animate-spin" />
              <p className="text-xs font-bold text-stone-700">Đang tối ưu &amp; lưu trữ ảnh...</p>
              <p className="text-[10px] text-stone-500">Tự động kết nối Supabase Storage</p>
            </div>
          ) : form.imageUrl ? (
            <div className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover border border-stone-200 shadow-2xs shrink-0 bg-stone-100"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-stone-900 truncate">Ảnh món ăn đã chọn</p>
                  {storageType === 'supabase' && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      ☁️ Supabase CDN
                    </span>
                  )}
                  {storageType === 'base64' && (
                    <span className="text-[10px] bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      📦 Base64
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Định dạng PNG, JPG, WEBP</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md font-mono text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3 h-3 text-ops-brand" />
                    Đổi ảnh khác
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, imageUrl: '' }));
                      setStorageType(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-stone-200 hover:border-rose-200 rounded-md font-mono text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <X className="w-3 h-3" />
                    Xóa ảnh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragging
                  ? 'border-ops-brand bg-amber-50/50'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/60 hover:bg-stone-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 shadow-2xs mb-1.5">
                <Upload className="w-5 h-5 text-ops-brand" />
              </div>
              <p className="text-xs font-bold text-stone-800">
                Nhấn để chọn ảnh hoặc kéo thả vào đây
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB • Tự động tối ưu dung lượng)
              </p>
            </div>
          )}
          {errors.image && (
            <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.image}</p>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 p-3 bg-stone-50 rounded-xl border border-stone-200">
          {/* isAvailable */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={form.isAvailable}
              onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                form.isAvailable ? 'bg-emerald-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  form.isAvailable ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="font-mono text-xs font-bold text-stone-700">
              {form.isAvailable ? 'Đang mở bán' : 'Tạm hết món'}
            </span>
          </label>

          {/* isCombo */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={form.isCombo}
              onClick={() => handleIsComboChange(!form.isCombo)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                form.isCombo ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  form.isCombo ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="font-mono text-xs font-bold text-stone-700">Là Combo</span>
          </label>
        </div>

        {/* Combo Items Section */}
        {form.isCombo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Thành Phần Combo *
              </span>
              <button
                type="button"
                onClick={handleAddComboItem}
                disabled={form.comboItems.length >= availableDishes.length}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg font-mono text-[10px] font-bold uppercase cursor-pointer transition-colors disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                Thêm Món
              </button>
            </div>

            {errors.combo && (
              <p className="text-rose-500 text-[10px] font-semibold">{errors.combo}</p>
            )}

            {form.comboItems.length === 0 && (
              <p className="text-stone-400 text-xs italic text-center py-4 border border-dashed border-stone-200 rounded-xl">
                Chưa có món thành phần — Bấm &ldquo;Thêm Món&rdquo; để bắt đầu
              </p>
            )}

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {form.comboItems.map((item, index) => {
                const usedIds = new Set(form.comboItems.map((ci, i) => i !== index ? ci.dishId : ''));
                const selectedDish = availableDishes.find((d) => d.id === item.dishId);

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    {/* Dish selector */}
                    <select
                      value={item.dishId}
                      onChange={(e) => handleComboItemChange(index, 'dishId', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-900 text-xs font-medium focus:outline-none focus:border-ops-brand transition-colors min-w-0"
                    >
                      {availableDishes
                        .filter((d) => d.id === item.dishId || !usedIds.has(d.id))
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {formatVND(d.price)}
                          </option>
                        ))}
                    </select>

                    {/* Quantity */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] text-stone-500 font-bold">SL:</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(e) =>
                          handleComboItemChange(
                            index,
                            'quantity',
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-14 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-900 font-mono font-bold text-xs text-center focus:outline-none focus:border-ops-brand transition-colors"
                      />
                    </div>

                    {/* Price preview */}
                    {selectedDish && (
                      <span className="font-mono text-[10px] font-bold text-stone-500 shrink-0 w-20 text-right">
                        {formatVND(selectedDish.price * item.quantity)}
                      </span>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveComboItem(index)}
                      className="shrink-0 p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Combo total preview */}
            {form.comboItems.length > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-mono text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                  Tổng Giá Vốn Thành Phần
                </span>
                <span className="font-mono text-sm font-extrabold text-amber-700">
                  {formatVND(
                    form.comboItems.reduce((sum, item) => {
                      const d = availableDishes.find((d) => d.id === item.dishId);
                      return sum + (d?.price ?? 0) * item.quantity;
                    }, 0)
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </form>
    </AdminModal>
  );
}
