import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, getCartLineId } from '../useCartStore';
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
    useCartStore.getState().clearPlacedBatches();
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
      { name: 'Topping', selected: 'Thịt bò thêm', extraPrice: 20000 },
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

  it('phải tách dòng khi cùng món có modifier khác nhau và thao tác xóa/tăng giảm độc lập theo lineId', () => {
    const store = useCartStore.getState();
    const largeMod = [
      { name: 'Kích thước phần', selected: 'Phần lớn', extraPrice: 50000 },
    ];

    // Thêm dòng chuẩn (không modifier) và dòng phần lớn
    store.addItem(MOCK_DISH, []);
    store.addItem(MOCK_DISH, largeMod);

    expect(useCartStore.getState().items.length).toBe(2);
    expect(useCartStore.getState().getDishQuantityInCart(MOCK_DISH.id)).toBe(2);

    const standardLineId = getCartLineId(MOCK_DISH.id, []);
    const largeLineId = getCartLineId(MOCK_DISH.id, largeMod);

    // Tăng số lượng chỉ riêng dòng phần lớn
    store.updateQuantity(largeLineId, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(useCartStore.getState().items[1].quantity).toBe(3);

    // Cập nhật ghi chú chỉ riêng dòng chuẩn
    store.updateItemNote(standardLineId, 'Không hành');
    expect(useCartStore.getState().items[0].note).toBe('Không hành');
    expect(useCartStore.getState().items[1].note).toBe('');

    // Xóa dòng chuẩn không làm mất dòng phần lớn
    store.removeItem(standardLineId);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].selectedModifiers).toEqual(largeMod);
  });

  it('phải gửi đơn xuống bếp với trạng thái WAITING, lưu idempotencyKey và làm trống giỏ', () => {
    const store = useCartStore.getState();
    store.addItem(
      MOCK_DISH,
      [{ name: 'Món kèm', selected: 'Thêm quẩy', extraPrice: 10000 }],
      'Nước béo',
      2
    );

    store.submitOrderToKitchen('idem-uuid-123456');

    const state = useCartStore.getState();
    expect(state.items.length).toBe(0);
    expect(state.lastIdempotencyKey).toBe('idem-uuid-123456');
    expect(state.placedBatches.length).toBe(1);
    expect(state.placedBatches[0].items[0].status).toBe('WAITING');
    expect(state.placedBatches[0].items[0].unitPrice).toBe(85000);
    expect(state.placedBatches[0].items[0].quantity).toBe(2);
    expect(state.getPlacedItemCount()).toBe(2);
    expect(state.getPlacedSubtotal()).toBe(170000);
  });

  it('phải đánh dấu giục món (expeditePlacedItem) chính xác', () => {
    const store = useCartStore.getState();
    store.addItem(MOCK_DISH);
    store.submitOrderToKitchen('idem-expedite-001');

    const placedItemId =
      useCartStore.getState().placedBatches[0].items[0].id;
    expect(
      useCartStore.getState().placedBatches[0].items[0].expedited
    ).toBe(false);

    store.expeditePlacedItem(placedItemId);
    expect(
      useCartStore.getState().placedBatches[0].items[0].expedited
    ).toBe(true);
  });
});
