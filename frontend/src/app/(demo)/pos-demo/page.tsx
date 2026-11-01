'use client';

import * as React from 'react';
import { PosLayout } from '@/components/layouts/PosLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DEMO_TABLES, type TableStatus } from '@/lib/demo-data';
import { cn, formatVND } from '@/lib/utils';

const STATUS_BG: Record<TableStatus, string> = {
  empty: 'bg-table-empty text-white',
  inuse: 'bg-table-inuse text-brown-900',
  overdue: 'bg-table-overdue text-white animate-blink',
  cleaning: 'bg-table-cleaning text-white',
};

const STATUS_LABEL: Record<TableStatus, string> = {
  empty: 'Bàn trống',
  inuse: 'Đang dùng',
  overdue: 'Quá SLA',
  cleaning: 'Cần dọn',
};

/**
 * Demo: POS sơ đồ bàn bằng CSS grid — KHÔNG dùng Three.js.
 * Màu trạng thái lấy từ token --color-table-* trong @theme.
 * Hành động chính duy nhất là "Thanh toán" (primary, cỡ lg); các nút còn lại
 * đã hạ xuống secondary/ghost để không tranh spotlight.
 */
export default function DemoPosPage() {
  const [selectedId, setSelectedId] = React.useState<string>('t4');
  const selected = DEMO_TABLES.find((t) => t.id === selectedId) ?? DEMO_TABLES[0];

  return (
    <PosLayout
      headerLeft={<span className="text-base font-bold">POS Thu Ngân — Demo</span>}
      headerRight={<span className="text-sm font-semibold text-sand-600">Két: 14.850.000 ₫</span>}
      mapArea={
        <Card title="Sơ đồ bàn — Tầng 1" description="Bấm vào một bàn để xem chi tiết ở rail bên phải.">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {DEMO_TABLES.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedId(table.id)}
                  aria-pressed={table.id === selectedId}
                  className={cn(
                    'flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-card font-bold transition-[transform,box-shadow] duration-200 hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    STATUS_BG[table.status],
                    table.id === selectedId && 'ring-4 ring-brown-600 ring-offset-2 ring-offset-white',
                  )}
                >
                  <span>{table.label}</span>
                  <span className="text-xs font-semibold opacity-90">{STATUS_LABEL[table.status]}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABEL) as TableStatus[]).map((s) => (
                <Badge key={s} variant={`table-${s}` as 'table-empty' | 'table-inuse' | 'table-overdue' | 'table-cleaning'}>
                  {STATUS_LABEL[s]}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      }
      sideRail={
        <Card title={`${selected.label} — Chi tiết đơn`} description="Dữ liệu mẫu, chưa nối API.">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-sm">
              <p>
                Trạng thái: <Badge variant={`table-${selected.status}` as 'table-empty' | 'table-inuse' | 'table-overdue' | 'table-cleaning'}>{STATUS_LABEL[selected.status]}</Badge>
              </p>
              <p>Số khách: {selected.guests}</p>
              <p>
                Tạm tính: <strong>{formatVND(selected.total)}</strong>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="md" variant="secondary" className="w-full">Gộp bàn</Button>
              <Button size="md" variant="secondary" className="w-full">Chuyển bàn</Button>
              <Button size="md" variant="ghost" className="w-full">Tách hóa đơn</Button>
              <Button size="lg" className="w-full">Thanh toán</Button>
            </div>
          </div>
        </Card>
      }
    />
  );
}
