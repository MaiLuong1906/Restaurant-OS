'use client';

import * as React from 'react';
import { Search } from 'lucide-react';

interface UserFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  roleFilter: string;
  onRoleChange: (r: string) => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'LOCKED';
  onStatusChange: (s: 'ALL' | 'ACTIVE' | 'LOCKED') => void;
}

const ROLE_TABS = [
  { id: 'ALL', label: 'Tất Cả' },
  { id: 'OWNER', label: 'Chủ Quán' },
  { id: 'MANAGER', label: 'Quản Lý' },
  { id: 'CASHIER', label: 'Thu Ngân' },
  { id: 'CHEF', label: 'Bếp / Pha Chế' },
  { id: 'WAITER', label: 'Phục Vụ' },
  { id: 'STAFF', label: 'Nhân Viên' },
] as const;

export function UserFilterBar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
}: UserFilterBarProps) {
  return (
    <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Role filter buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onRoleChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer ${
              roleFilter === tab.id
                ? 'bg-ops-brand text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status filter & Search bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as 'ALL' | 'ACTIVE' | 'LOCKED')}
          aria-label="Lọc theo trạng thái hoạt động"
          className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-700 font-bold focus:outline-none focus:border-ops-brand cursor-pointer"
        >
          <option value="ALL">Mọi Trạng Thái</option>
          <option value="ACTIVE">Chỉ Đang Hoạt Động</option>
          <option value="LOCKED">Chỉ Đang Bị Khóa</option>
        </select>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã (TN001), Tên, SĐT..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand w-64"
          />
        </div>
      </div>
    </div>
  );
}
