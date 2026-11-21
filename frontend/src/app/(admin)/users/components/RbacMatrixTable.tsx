'use client';

import * as React from 'react';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { RbacRow } from '../types';

interface RbacMatrixTableProps {
  matrix: RbacRow[];
  onTogglePermission: (rowId: string, roleKey: 'owner' | 'manager' | 'chef' | 'staff') => void;
}

export function RbacMatrixTable({ matrix, onTogglePermission }: RbacMatrixTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xs border border-stone-200 overflow-hidden space-y-4">
      <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
        <div>
          <h3 className="font-ops text-base font-bold text-stone-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-ops-brand" />
            <span>Ma Trận Quyền Hạn RBAC (Role-Based Access Control)</span>
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Quy định phân quyền chi tiết cho từng vai trò vận hành trong nhà hàng. Bấm vào icon để bật/tắt quyền.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-mono text-xs uppercase">
              <th className="py-3 px-4 font-bold">Tính Năng / Hành Động Nghiệp Vụ</th>
              <th className="py-3 px-3 text-center font-bold text-amber-900 bg-amber-50/50">Chủ Quán</th>
              <th className="py-3 px-3 text-center font-bold text-indigo-900 bg-indigo-50/50">Quản Lý Ca</th>
              <th className="py-3 px-3 text-center font-bold text-orange-900 bg-orange-50/50">Bếp Trưởng</th>
              <th className="py-3 px-3 text-center font-bold text-stone-700">Nhân Viên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border">
            {matrix.map((row) => (
              <tr key={row.id} className="hover:bg-ops-bg transition-colors">
                <td className="py-3 px-4 font-medium text-stone-900">{row.feature}</td>

                {/* Owner */}
                <td
                  onClick={() => onTogglePermission(row.id, 'owner')}
                  className="py-3 px-3 text-center cursor-not-allowed bg-amber-50/30"
                  title="Quyền của Chủ quán là cố định"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                </td>

                {/* Manager */}
                <td
                  onClick={() => onTogglePermission(row.id, 'manager')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50 bg-indigo-50/30"
                >
                  {row.manager ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                  )}
                </td>

                {/* Chef */}
                <td
                  onClick={() => onTogglePermission(row.id, 'chef')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50 bg-orange-50/30"
                >
                  {row.chef ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                  )}
                </td>

                {/* Staff */}
                <td
                  onClick={() => onTogglePermission(row.id, 'staff')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-stone-200/50"
                >
                  {row.staff ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
