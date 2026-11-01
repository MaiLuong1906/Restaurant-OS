'use client';

import * as React from 'react';
import { KdsLayout } from '@/components/layouts/KdsLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { DEMO_KDS_ORDERS, type DemoKdsOrder, type KdsStatus } from '@/lib/demo-data';

const COLUMNS: Array<{ id: KdsStatus; label: string }> = [
  { id: 'waiting', label: 'Chờ nấu' },
  { id: 'cooking', label: 'Đang nấu' },
  { id: 'done', label: 'Xong' },
];

const SLA_MINUTES = 15;

/**
 * Demo: bảng KDS — 3 cột, nút size kds (>= 64px), chỉ báo SLA 15 phút. Dữ liệu mẫu.
 * NGOẠI LỆ nền tối: giữ nền tối theo token kds-bg; nút chính đã chuyển sang terracotta Warm Earth.
 * Mỗi thẻ chỉ có đúng một hành động chính (Nhận món / Báo xong).
 */
export default function DemoKdsBoardPage() {
  const [station, setStation] = React.useState<string>('all');
  const [orders, setOrders] = React.useState<DemoKdsOrder[]>(DEMO_KDS_ORDERS);
  const [soundOn, setSoundOn] = React.useState(true);

  const move = (order: DemoKdsOrder, next: KdsStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
  };

  return (
    <KdsLayout
      title="KDS Bếp — Demo"
      stationFilter={
        <Tabs
          dark
          items={[
            { id: 'all', label: 'Tất cả trạm' },
            { id: 'grill', label: 'Bếp Nướng' },
            { id: 'hotpot', label: 'Bếp Lẩu' },
          ]}
          value={station}
          onChange={setStation}
        />
      }
      soundToggle={
        <Button variant="ghost" size="sm" className="text-kds-text hover:bg-kds-card" onClick={() => setSoundOn((v) => !v)}>
          Chuông: {soundOn ? 'BẬT' : 'TẮT'}
        </Button>
      }
      clock={<span className="text-sm font-semibold tabular-nums">19:42</span>}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-kds-muted">
          Trang demo — dữ liệu mẫu, chưa nối STOMP. SLA bếp: {SLA_MINUTES} phút.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <section key={col.id} aria-label={col.label} className="flex flex-col gap-4">
              <h2 className="text-sm font-bold tracking-wide text-kds-muted">
                {col.label.toUpperCase()} ({orders.filter((o) => o.status === col.id).length})
              </h2>
              <div className="flex flex-col gap-4">
                {orders
                  .filter((o) => o.status === col.id)
                  .map((order) => (
                    <article key={order.id} className="flex flex-col gap-4 rounded-card border border-kds-border bg-kds-card p-6 break-words">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-2xl font-extrabold">{order.table}</p>
                        {order.batch ? <Badge variant="default">{order.batch}</Badge> : null}
                      </div>
                      <p className="font-semibold">
                        {order.dish} × {order.quantity}
                      </p>
                      {order.allergy ? (
                        <p className="text-sm font-bold text-kds-danger">{order.allergy}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={order.overdue ? 'sla-overdue' : 'sla-ok'} blink={order.overdue}>
                          {order.overdue
                            ? `Quá SLA ${order.elapsedMin - SLA_MINUTES} phút`
                            : `${order.elapsedMin} phút / SLA ${SLA_MINUTES} phút`}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        {order.status === 'waiting' ? (
                          <Button size="kds" className="w-full" onClick={() => move(order, 'cooking')}>
                            Nhận món
                          </Button>
                        ) : null}
                        {order.status === 'cooking' ? (
                          <Button size="kds" className="w-full" onClick={() => move(order, 'done')}>
                            Báo xong
                          </Button>
                        ) : null}
                        {order.status === 'done' ? (
                          <p className="py-2 text-center text-sm font-semibold text-kds-accent">
                            Chờ phục vụ
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </KdsLayout>
  );
}
