'use client';

import * as React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { UserResponseDto } from '@/types/user';

interface UserTableProps {
  users: UserResponseDto[];
  isLoading: boolean;
  onPromoteClick: (u: UserResponseDto) => void;
  onResetPinClick: (u: UserResponseDto) => void;
  onToggleStatusClick: (u: UserResponseDto) => void;
  onDeleteClick: (u: UserResponseDto) => void;
}

export function UserTable({
  users,
  isLoading,
  onPromoteClick,
  onResetPinClick,
  onToggleStatusClick,
  onDeleteClick,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-mono text-xs uppercase">
            <th className="py-3 px-4 font-bold">Mã &amp; Nhân Sự</th>
            <th className="py-3 px-3 font-bold">Username / Email</th>
            <th className="py-3 px-3 font-bold">Vai Trò Hệ Thống</th>
            <th className="py-3 px-3 font-bold text-center">Mã PIN Trạm</th>
            <th className="py-3 px-3 text-right font-bold">Trần CK%</th>
            <th className="py-3 px-3 text-center font-bold">Trạng Thái</th>
            <th className="py-3 px-4 text-center font-bold">Thao Tác Quản Trị</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ops-border">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-ops-brand mb-2" />
                <span>Đang đồng bộ dữ liệu nhân sự từ máy chủ...</span>
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-stone-500">
                <span>Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.</span>
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-ops-bg transition-colors">
                {/* Cột 1: Mã nhân viên & Họ tên */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded bg-stone-900 text-white shadow-2xs">
                      {u.employeeCode}
                    </span>
                    <div>
                      <span className="font-bold text-ops-ink block">{u.fullName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">ID: {u.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </td>

                {/* Cột 2: Username & Email & Phone */}
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-stone-800 block">@{u.username}</span>
                  <span className="text-[11px] text-ops-muted block">{u.email || '—'}</span>
                  {u.phone && <span className="text-[10px] text-stone-500 font-mono">{u.phone}</span>}
                </td>

                {/* Cột 3: Vai trò */}
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      u.roleCode === 'OWNER'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : u.roleCode === 'MANAGER'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          : u.roleCode === 'CASHIER'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : u.roleCode === 'CHEF'
                              ? 'bg-orange-100 text-orange-900 border border-orange-300'
                              : 'bg-stone-100 text-stone-800 border border-stone-200'
                    }`}
                  >
                    {u.roleName}
                  </span>
                </td>

                {/* Cột 4: PIN trạm */}
                <td className="py-3 px-3 text-center font-mono font-bold text-ops-ink">
                  {u.pinMasked || (u.hasPin ? '•••• (Đã kích hoạt)' : 'Chưa cài đặt')}
                </td>

                {/* Cột 5: Trần chiết khấu */}
                <td className="py-3 px-3 text-right font-mono font-bold text-primary-500">
                  {u.discountCeiling}%
                </td>

                {/* Cột 6: Trạng thái isActive */}
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold inline-flex items-center gap-1 ${
                      u.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {u.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>HOẠT ĐỘNG</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-rose-600" />
                        <span>TẠM KHÓA</span>
                      </>
                    )}
                  </span>
                </td>

                {/* Cột 7: Thao tác quản trị */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {/* Nút Đổi vai trò */}
                    <button
                      onClick={() => onPromoteClick(u)}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-mono text-[10px] uppercase font-bold flex items-center gap-0.5 cursor-pointer border border-stone-300 transition-colors"
                      title="Thăng chức / Đổi vai trò (Tự đổi mã & trần chiết khấu)"
                    >
                      <ArrowUpRight className="w-3 h-3 text-indigo-700" />
                      <span>Đổi Role</span>
                    </button>

                    {/* Nút Đổi PIN */}
                    <button
                      onClick={() => onResetPinClick(u)}
                      className="px-2 py-1 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink rounded font-mono text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Cập nhật mã PIN xác thực trạm POS/KDS"
                    >
                      <KeyRound className="w-3 h-3 text-amber-700" />
                      <span>PIN</span>
                    </button>

                    {/* Nút Khóa / Mở Khóa */}
                    <button
                      onClick={() => onToggleStatusClick(u)}
                      className={`px-2 py-1 border rounded font-mono text-[10px] uppercase font-semibold cursor-pointer flex items-center gap-1 transition-colors ${
                        u.isActive
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={u.isActive ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {u.isActive ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Khóa</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Mở</span>
                        </>
                      )}
                    </button>

                    {/* Nút Xóa Mềm */}
                    <button
                      onClick={() => onDeleteClick(u)}
                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Xóa tài khoản nhân sự"
                      aria-label="Xóa tài khoản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
