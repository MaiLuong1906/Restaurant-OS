import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../useCartStore';
import { Dish } from '@/types';

const MOCK_DISH: Dish = {
  id: 'dish-test-1',
  name: 'Phở Bò Đặc Biệt',
  price: 75000,
  category: 'MAIN',
  isAvailable: true,
};

describe('useCartStore - Quản lý giỏ hàng & Tính tiền nguyên VND', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('phải thêm món vào giỏ và tính đúng tổng tiền VND', () => {
    const store = useCartStore.getState();
    store.addItem(MOCK_DISH);

    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().getTotalItemCount()).toBe(1);
    expect(useCartStore.getState().getTotalAmount()).toBe(75000);
  });

  it('phải tăng số lượng khi thêm cùng một món', () => {
    const store = useCartStore.getState();
    store.addItem(MOCK_DISH);
    store.addItem(MOCK_DISH);

    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().getTotalAmount()).toBe(150000);
  });

  it('phải tính phụ thu modifier chính xác', () => {
    const store = useCartStore.getState();
    store.addItem(MOCK_DISH, [
      { name: 'Topping', selected: 'Thịt bò thêm', extraPrice: 20000 }
    ]);

    expect(useCartStore.getState().getTotalAmount()).toBe(95000);
  });

  it('phải xóa sạch giỏ khi gọi clearCart', () => {
    const store = useCartStore.getState();
    store.addItem(MOCK_DISH);
    store.clearCart();

    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getTotalAmount()).toBe(0);
  });
});
