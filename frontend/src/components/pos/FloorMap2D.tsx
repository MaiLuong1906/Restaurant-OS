'use client';

import React from 'react';
import { formatVND } from '@/lib/utils';
import { getTableStatusColor } from '@/components/3d/tableStatusColor';

export interface PosTableItem {
  id: string;
  number: string;
  capacity: number;
  status: 'IDLE' | 'OCCUPIED' | 'BILLING' | string;
  currentTotal: number;
  itemCount: number;
}

interface FloorMap2DProps {
  tables: PosTableItem[];
  selectedTableId: string;
  onSelectTable: (table: PosTableItem) => void;
  reduceMotion?: boolean;
}

export function FloorMap2D({
  tables,
  selectedTableId,
  onSelectTable,
  reduceMotion = false,
}: FloorMap2DProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {tables.map((table) => {
        const isSelected = selectedTableId === table.id;
        const colorSpec = getTableStatusColor(table.status);

        const statusStyles = {
          IDLE: 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-400',
          OCCUPIED: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
          BILLING: reduceMotion
            ? 'border-red-500/60 bg-red-950/30 text-red-200'
            : 'border-red-500/60 bg-red-950/30 text-red-200 animate-pulse',
        }[table.status] || 'border-slate-800 bg-slate-900/40 text-slate-400';

        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onSelectTable(table)}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${statusStyles} ${
              isSelected ? 'ring-2 ring-blue-500 shadow-xl' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-base text-white flex items-center space-x-2">
                <span
                  className="h-2.5 w-2.5 rounded-full inline-block"
                  style={{ backgroundColor: colorSpec.base }}
                />
                <span>{table.number}</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                {table.capacity} chỗ
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span>{table.itemCount > 0 ? `${table.itemCount} món` : 'Trống'}</span>
              <span className="font-bold text-white">
                {table.currentTotal > 0 ? formatVND(table.currentTotal) : '---'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default FloorMap2D;
