'use client';

import * as React from 'react';
import { Plus, Trash2, Layers, AlertCircle } from 'lucide-react';
import { DishOptionGroup, DishOptionItem } from '@/types/dish';

export interface DishOptionsEditorProps {
  optionGroups: DishOptionGroup[];
  onChange: (groups: DishOptionGroup[]) => void;
}

/**
 * Component Cấu Hình Nhóm Tùy Chọn Món Ăn (Dish Options & Modifiers Editor)
 * Dùng trong modal tạo / sửa món ăn tại Master Menu & BOM.
 */
export function DishOptionsEditor({ optionGroups, onChange }: DishOptionsEditorProps) {
  // Thêm một nhóm tùy chọn mới
  const handleAddGroup = () => {
    const newGroup: DishOptionGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      items: [
        {
          id: `opt_${Date.now()}_1`,
          name: '',
          extraPrice: 0,
          isDefault: true,
          isAvailable: true,
        },
      ],
    };
    onChange([...optionGroups, newGroup]);
  };

  // Cập nhật thông tin nhóm
  const handleUpdateGroup = (groupIndex: number, updates: Partial<DishOptionGroup>) => {
    const next = [...optionGroups];
    next[groupIndex] = { ...next[groupIndex], ...updates };
    onChange(next);
  };

  // Xóa nhóm
  const handleRemoveGroup = (groupIndex: number) => {
    onChange(optionGroups.filter((_, idx) => idx !== groupIndex));
  };

  // Thêm một option item vào nhóm
  const handleAddItem = (groupIndex: number) => {
    const group = optionGroups[groupIndex];
    const newItem: DishOptionItem = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      extraPrice: 0,
      isDefault: group.items.length === 0,
      isAvailable: true,
    };
    const nextItems = [...group.items, newItem];
    handleUpdateGroup(groupIndex, { items: nextItems });
  };

  // Cập nhật thông tin option item
  const handleUpdateItem = (
    groupIndex: number,
    itemIndex: number,
    updates: Partial<DishOptionItem>
  ) => {
    const group = optionGroups[groupIndex];
    const nextItems = [...group.items];
    const currentItem = nextItems[itemIndex];

    // Nếu chọn isDefault trong nhóm Single-choice (maxSelections === 1), bỏ default của các item khác
    if (updates.isDefault && group.maxSelections === 1) {
      nextItems.forEach((it, idx) => {
        nextItems[idx] = { ...it, isDefault: idx === itemIndex };
      });
    } else {
      nextItems[itemIndex] = { ...currentItem, ...updates };
    }

    handleUpdateGroup(groupIndex, { items: nextItems });
  };

  // Xóa option item
  const handleRemoveItem = (groupIndex: number, itemIndex: number) => {
    const group = optionGroups[groupIndex];
    const nextItems = group.items.filter((_, idx) => idx !== itemIndex);
    handleUpdateGroup(groupIndex, { items: nextItems });
  };

  return (
    <div className="space-y-4">
      {/* Header gọn gàng & Nút thêm nhóm */}
      <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-ops-brand" />
          Nhóm Tùy Chọn &amp; Topping ({optionGroups.length})
        </span>

        <button
          type="button"
          onClick={handleAddGroup}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border border-stone-200 shrink-0 whitespace-nowrap shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-ops-brand" />
          <span>Thêm tùy chọn</span>
        </button>
      </div>

      {/* Trạng thái chưa có nhóm tùy chọn nào */}
      {optionGroups.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/60 space-y-1.5">
          <Layers className="w-7 h-7 text-stone-300 mx-auto" />
          <p className="text-xs font-semibold text-stone-600">
            Chưa có nhóm tùy chọn nào
          </p>
          <p className="text-[11px] text-stone-400">
            Bấm <strong>&quot;Thêm tùy chọn&quot;</strong> để tạo kích cỡ, mức cay hoặc topping.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group, groupIdx) => {
            const isSingleChoice = (group.maxSelections ?? 1) === 1;

            return (
              <div
                key={group.id || groupIdx}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3.5 relative shadow-2xs"
              >
                {/* Dòng tiêu đề nhóm & Xóa nhóm */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-600 shrink-0">
                      #{groupIdx + 1}.
                    </span>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) =>
                        handleUpdateGroup(groupIdx, { name: e.target.value })
                      }
                      placeholder="Ví dụ: Kích Cỡ, Mức Cay, Topping Thêm..."
                      className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-900 focus:outline-none focus:border-ops-brand"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(groupIdx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa nhóm này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cấu hình bắt buộc / chọn 1 hay nhiều */}
                <div className="flex flex-wrap items-center gap-4 text-xs bg-white p-2.5 rounded-lg border border-stone-200/80">
                  {/* Bắt buộc chọn */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={group.isRequired}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleUpdateGroup(groupIdx, {
                          isRequired: checked,
                          minSelections: checked ? 1 : 0,
                        });
                      }}
                      className="rounded text-ops-brand focus:ring-ops-brand cursor-pointer"
                    />
                    <span className="font-medium text-stone-700">
                      Bắt buộc chọn
                    </span>
                  </label>

                  <div className="h-4 w-px bg-stone-200 hidden sm:block" />

                  {/* Kiểu lựa chọn: Chọn 1 hay Chọn nhiều */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`choice_type_${group.id || groupIdx}`}
                        checked={isSingleChoice}
                        onChange={() =>
                          handleUpdateGroup(groupIdx, {
                            maxSelections: 1,
                            minSelections: group.isRequired ? 1 : 0,
                          })
                        }
                        className="text-ops-brand focus:ring-ops-brand cursor-pointer"
                      />
                      <span className="font-medium text-stone-700">Chọn 1 duy nhất (Radio)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`choice_type_${group.id || groupIdx}`}
                        checked={!isSingleChoice}
                        onChange={() =>
                          handleUpdateGroup(groupIdx, {
                            maxSelections: 5,
                            minSelections: 0,
                          })
                        }
                        className="text-ops-brand focus:ring-ops-brand cursor-pointer"
                      />
                      <span className="font-medium text-stone-700">Chọn nhiều (Topping)</span>
                    </label>
                  </div>
                </div>

                {/* Danh sách các Tùy chọn con (Option Items) */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono uppercase font-bold text-stone-500 flex items-center justify-between">
                    <span>Lựa chọn con &amp; Giá phụ thu:</span>
                    {group.items.length === 0 && (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Nhóm cần ít nhất 1 lựa chọn
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map((item, itemIdx) => (
                      <div
                        key={item.id || itemIdx}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-white rounded-lg border border-stone-200"
                      >
                        {/* Tên lựa chọn */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateItem(groupIdx, itemIdx, { name: e.target.value })
                            }
                            placeholder="Tên lựa chọn (e.g. Size Vừa, Thêm Sốt Nấm...)"
                            className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-ops-brand font-medium"
                          />
                        </div>

                        {/* Giá phụ thu (+ VND) */}
                        <div className="w-full sm:w-36 flex items-center gap-1">
                          <span className="text-xs text-stone-400 font-bold shrink-0">+</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.extraPrice}
                            onChange={(e) =>
                              handleUpdateItem(groupIdx, itemIdx, {
                                extraPrice: Math.max(0, parseInt(e.target.value || '0', 10)),
                              })
                            }
                            placeholder="0"
                            className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded text-xs font-mono font-bold text-stone-900 focus:outline-none focus:bg-white focus:border-ops-brand text-right"
                          />
                          <span className="text-[11px] text-stone-500 font-mono shrink-0">đ</span>
                        </div>

                        {/* Checkbox Mặc định */}
                        <label
                          className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer shrink-0 select-none px-1"
                          title="Tự động chọn khi khách mở món"
                        >
                          <input
                            type={isSingleChoice ? 'radio' : 'checkbox'}
                            name={`default_${group.id || groupIdx}`}
                            checked={Boolean(item.isDefault)}
                            onChange={(e) =>
                              handleUpdateItem(groupIdx, itemIdx, { isDefault: e.target.checked })
                            }
                            className="text-ops-brand focus:ring-ops-brand cursor-pointer"
                          />
                          <span className="text-[11px]">Mặc định</span>
                        </label>

                        {/* Xóa item */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(groupIdx, itemIdx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer transition-colors shrink-0"
                          title="Xóa lựa chọn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Nút thêm lựa chọn con */}
                  <button
                    type="button"
                    onClick={() => handleAddItem(groupIdx)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-ops-brand hover:text-ops-brand-dark hover:bg-ops-brand/5 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm lựa chọn con</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
