'use client';

import * as React from 'react';
import { CreditCard, Hash, Shield, CheckCircle2 } from 'lucide-react';

interface UserKpiCardsProps {
  totalCount: number;
  activeCount: number;
  lockedCount: number;
  pinCount: number;
  maxCeiling: number;
}

export function UserKpiCards({
  totalCount,
  activeCount,
  lockedCount,
  pinCount,
  maxCeiling,
}: UserKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Tổng tài khoản */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
              Tổng Tài Khoản Đã Cấp
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-ops text-3xl font-extrabold text-stone-900">{totalCount}</span>
              <span className="font-mono text-xs uppercase text-emerald-700 font-bold">
                {activeCount} Hoạt Động
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-ops-brand">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
          <span>Đang bị tạm khóa:</span>
          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            {lockedCount < 10 ? `0${lockedCount}` : lockedCount} Tài khoản
          </span>
        </div>
      </div>

      {/* KPI 2: Mã PIN */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
              Nhân Sự Có Mã PIN
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-ops text-3xl font-extrabold text-ops-brand">
                {pinCount < 10 ? `0${pinCount}` : pinCount}
              </span>
              <span className="font-mono text-xs uppercase text-amber-700 font-bold">
                Đã Kích Hoạt
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <Hash className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
          <span>Xác thực ngoại lệ:</span>
          <span className="font-mono font-bold text-stone-900">Duyệt Hủy / Chiết Khấu POS</span>
        </div>
      </div>

      {/* KPI 3: Trần chiết khấu */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
              Hạn Mức Chiết Khấu Cao Nhất
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-ops text-3xl font-extrabold text-stone-900">{maxCeiling}%</span>
              <span className="font-mono text-xs uppercase text-stone-500 font-bold">Cấp Toàn Quyền</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-800">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
          <span>Trần Quản lý ca:</span>
          <span className="font-mono font-bold text-ops-brand">20% (Tự động áp dụng)</span>
        </div>
      </div>

      {/* KPI 4: Định danh & bảo mật */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
              Định Danh &amp; Bảo Mật
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-ops text-3xl font-extrabold text-emerald-700">100%</span>
              <span className="font-mono text-xs uppercase text-emerald-700 font-bold">Triple-Lookup</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
          <span>Định danh nhân sự:</span>
          <span className="font-mono font-bold text-emerald-800">Mã vai trò (CH, QL, TN, NV...)</span>
        </div>
      </div>
    </div>
  );
}
