'use client';

import * as React from 'react';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DEMO_DISHES, type DemoDish, type DishCategory } from '@/lib/demo-data';
import { formatVND } from '@/lib/utils';

const CATEGORIES: Array<'Tất cả' | DishCategory> = [
  'Tất cả',
  'Khai vị',
  'Món chính',
  'Lẩu',
  'Đồ uống',
  'Tráng miệng',
];

/**
 * Demo: menu khách quét QR — chỉ dùng component dùng chung + token. Dữ liệu mẫu.
 * Hành động chính duy nhất của màn hình là "Gửi bếp" ở thanh giỏ hàng (primary solid);
 * nút "+ Thêm" trên từng món đã hạ xuống secondary outline để không tranh spotlight.
 */
export default function DemoCustomerMenuPage() {
  const [category, setCategory] = React.useState<string>('Tất cả');
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [selected, setSelected] = React.useState<DemoDish | null>(null);

  const dishes = category === 'Tất cả' ? DEMO_DISHES : DEMO_DISHES.filter((d) => d.category === category);
  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const cartTotal = DEMO_DISHES.reduce((sum, d) => sum + (cart[d.id] ?? 0) * d.price, 0);

  const addToCart = (id: string, qty = 1) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + qty }));
  };

  return (
    <CustomerLayout
      headerLeft={<span className="text-base font-bold">Nhà Hàng Mẫu — Bàn 04</span>}
      headerRight={<span className="text-xs font-semibold text-sand-600">Demo</span>}
      cartBar={
        <div className="flex items-center justify-between gap-4 rounded-card bg-brown-800 px-6 py-4 text-white shadow-warm-lg">
          <div>
            <p className="text-sm font-bold">Giỏ hàng ({cartCount} món)</p>
            <p className="text-xs text-sand-200">{formatVND(cartTotal)}</p>
          </div>
          <Button size="md">Gửi bếp</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-sand-600">
          Trang demo — dữ liệu mẫu, chưa nối API. Quét QR bàn 04 để gọi món.
        </p>
        <Tabs
          items={CATEGORIES.map((c) => ({ id: c, label: c }))}
          value={category}
          onChange={setCategory}
        />
        <div className="grid grid-cols-1 gap-6">
          {dishes.map((dish) => (
            <Card key={dish.id} className="cursor-pointer">
              <div className="flex flex-col gap-4">
                <button type="button" className="w-full text-left" onClick={() => setSelected(dish)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="font-display text-h3 font-semibold text-ink">{dish.name}</p>
                      <p className="text-sm text-sand-600">{dish.description}</p>
                      <p className="font-display text-base font-semibold text-primary-700">{formatVND(dish.price)}</p>
                    </div>
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-blob bg-gradient-to-br from-primary-100 to-sand-200 font-display text-2xl font-semibold text-primary-700">
                      {dish.name.charAt(0)}
                    </span>
                  </div>
                </button>
                <div className="flex justify-end">
                  <Button size="md" variant="secondary" onClick={() => addToCart(dish.id)}>
                    + Thêm
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-sand-600">{selected.description}</p>
            <p className="font-display text-lg font-semibold text-primary-700">{formatVND(selected.price)}</p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-ink" htmlFor="demo-note">
                Ghi chú dị ứng &amp; yêu cầu
              </label>
              <textarea
                id="demo-note"
                rows={3}
                placeholder="Ví dụ: dị ứng đậu phộng, ít cay…"
                className="w-full rounded-card border border-sand-300 bg-white px-4 py-2 text-sm text-ink outline-none placeholder:text-sand-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                addToCart(selected.id);
                setSelected(null);
              }}
            >
              Xác nhận thêm món
            </Button>
          </div>
        ) : null}
      </BottomSheet>
    </CustomerLayout>
  );
}
