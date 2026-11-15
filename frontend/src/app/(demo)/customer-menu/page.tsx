'use client';

import * as React from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
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
 * Demo v6: menu khách quét QR — theo design system chung.
 * - Mỗi món có ẢNH MÓN (file local public/images/dishes, ảnh mẫu — team thay bằng
 *   ảnh thật của quán), không còn chữ cái trên nền hồng.
 * - Bộ chọn số lượng +/− (Lucide): chưa thêm thì nút "Thêm" nhỏ, viền xám; đã thêm
 *   thì hiện stepper − số lượng + thay cho nút Thêm nặng.
 * - Hành động chính duy nhất là "Gửi bếp" ở thanh giỏ hàng (primary solid brand).
 * - Font sans Be Vietnam Pro, giá chữ ink đậm (không đỏ), layout desktop 2 cột.
 * - Ghi chú dev không còn trong nội dung: trạng thái demo chỉ còn badge "Demo" ở header.
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

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  return (
    <CustomerLayout
      headerLeft={<span className="text-base font-bold">Nhà Hàng Mẫu — Bàn 04</span>}
      headerRight={<span className="border border-sand-300 bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-sand-600">Demo</span>}
      cartBar={
        <div className="flex items-center justify-between gap-4 rounded-lg bg-ops-ink px-6 py-4 text-white shadow-warm-lg">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold">Giỏ hàng ({cartCount} món)</p>
              <p className="text-xs text-white/70">{formatVND(cartTotal)}</p>
            </div>
          </div>
          <Button size="md">Gửi bếp</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Tabs
          items={CATEGORIES.map((c) => ({ id: c, label: c }))}
          value={category}
          onChange={setCategory}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {dishes.map((dish) => {
            const qty = cart[dish.id] ?? 0;
            return (
              <Card key={dish.id} className="cursor-pointer overflow-hidden p-0">
                <button type="button" className="w-full text-left" onClick={() => setSelected(dish)}>
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image src={dish.image} alt={dish.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                  <div className="flex flex-col gap-2 px-6 pt-6">
                    <p className="text-lg font-bold text-ink">{dish.name}</p>
                    <p className="text-sm text-sand-600">{dish.description}</p>
                    <p className="text-base font-bold text-ink">{formatVND(dish.price)}</p>
                  </div>
                </button>
                <div className="flex justify-end px-6 pb-6 pt-2">
                  {qty === 0 ? (
                    <Button size="sm" variant="secondary" onClick={() => addToCart(dish.id)}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Thêm
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-sand-300 bg-white p-1">
                      <button type="button" aria-label={`Giảm ${dish.name}`} onClick={() => removeFromCart(dish.id)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg hover:bg-cream-dark">
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-8 text-center text-base font-bold" aria-label={`Số lượng ${dish.name}: ${qty}`}>{qty}</span>
                      <button type="button" aria-label={`Tăng ${dish.name}`} onClick={() => addToCart(dish.id)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg bg-ops-ink text-white hover:opacity-90">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <BottomSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="relative h-48 w-full overflow-hidden rounded-lg">
              <Image src={selected.image} alt={selected.name} fill className="object-cover" sizes="100vw" />
            </div>
            <p className="text-sm text-sand-600">{selected.description}</p>
            <p className="text-lg font-bold text-ink">{formatVND(selected.price)}</p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-ink" htmlFor="demo-note">
                Ghi chú dị ứng &amp; yêu cầu
              </label>
              <textarea
                id="demo-note"
                rows={3}
                placeholder="Ví dụ: dị ứng đậu phộng, ít cay…"
                className="w-full rounded-lg border border-sand-300 bg-white px-4 py-2 text-sm text-ink outline-none placeholder:text-sand-500 focus:border-ink"
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
