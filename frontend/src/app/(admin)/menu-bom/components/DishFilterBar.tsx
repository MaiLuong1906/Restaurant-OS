'use client';

import * as React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { DISH_CATEGORY_LABELS, DishCategory } from '@/types/dish';

export interface DishFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (value: string) => void;
  totalCount: number;
}

/**
 * Thanh bộ lọc danh mục món ăn — Dumb Component (không có state riêng)
 */
export function DishFilterBar({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  availabilityFilter,
  onAvailabilityChange,
  totalCount,
}: DishFilterBarProps) {
  return (
    <div className="space-y-3 shrink-0">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm kiếm tên món, danh mục..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand transition-colors"
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 shrink-0" />

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs font-mono font-bold border border-stone-200 bg-white rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:border-ops-brand cursor-pointer"
        >
          <option value="ALL">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {DISH_CATEGORY_LABELS[cat as DishCategory] ?? cat}
            </option>
          ))}
        </select>

        {/* Availability filter */}
        <select
          value={availabilityFilter}
          onChange={(e) => onAvailabilityChange(e.target.value)}
          className="text-xs font-mono font-bold border border-stone-200 bg-white rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:border-ops-brand cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Đang bán</option>
          <option value="UNAVAILABLE">Tạm hết</option>
        </select>

        {/* Count badge */}
        <span className="ml-auto font-mono text-xs font-bold text-stone-500">
          {totalCount} món
        </span>
      </div>
    </div>
  );
}
