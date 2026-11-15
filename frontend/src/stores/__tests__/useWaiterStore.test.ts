import { describe, it, expect, beforeEach } from 'vitest';
import { useWaiterStore, removeVietnameseTones, INITIAL_TABLES } from '../useWaiterStore';
import { WaiterMenuItem } from '@/types/waiter';

describe('useWaiterStore', () => {
  const sampleMenuItem: WaiterMenuItem = {
    id: 'test-m1',
    sku: 'TEST01',
    name: 'Phở Bò Thăn Áp Chảo',
    category: 'Món chính',
    price: 125000,
    description: 'Thơm ngon bổ dưỡng',
    station: 'Bếp nóng',
    isAvailable: true,
  };

  beforeEach(() => {
    // Reset store to fresh initial state
    useWaiterStore.setState({
      selectedTableId: '04',
      activeTab: 'floor',
      activeZoneFilter: 'all',
      trackingTableFilter: 'all',
      tables: JSON.parse(JSON.stringify(INITIAL_TABLES)),
      isSendKitchenModalOpen: false,
      toastMessage: null,
    });
  });

  it('removeVietnameseTones loại bỏ chính xác dấu tiếng Việt', () => {
    expect(removeVietnameseTones('Phở Bò Thăn Áp Chảo')).toBe('pho bo than ap chao');
    expect(removeVietnameseTones('Gỏi ngó sen tôm thịt')).toBe('goi ngo sen tom thit');
    expect(removeVietnameseTones('Đậu phộng')).toBe('dau phong');
    expect(removeVietnameseTones('')).toBe('');
  });

  it('setSelectedTable cập nhật mã bàn và chuẩn hóa 2 chữ số', () => {
    const store = useWaiterStore.getState();
    store.setSelectedTable('11');
    expect(useWaiterStore.getState().selectedTableId).toBe('11');

    store.setSelectedTable('4');
    expect(useWaiterStore.getState().selectedTableId).toBe('04');
  });

  it('addItemToOrder thêm món vào pendingItems của đúng bàn', () => {
    const store = useWaiterStore.getState();
    store.addItemToOrder('04', sampleMenuItem, 'Ít ớt');

    const table04 = useWaiterStore.getState().tables['04'];
    expect(table04.pendingItems).toHaveLength(1);
    expect(table04.pendingItems[0].name).toBe('Phở Bò Thăn Áp Chảo');
    expect(table04.pendingItems[0].qty).toBe(1);
    expect(table04.pendingItems[0].note).toBe('Ít ớt');

    // Thêm lần 2 cùng ghi chú -> tăng qty
    store.addItemToOrder('04', sampleMenuItem, 'Ít ớt');
    const table04Updated = useWaiterStore.getState().tables['04'];
    expect(table04Updated.pendingItems).toHaveLength(1);
    expect(table04Updated.pendingItems[0].qty).toBe(2);

    // Bàn 11 không bị ảnh hưởng
    const table11 = useWaiterStore.getState().tables['11'];
    expect(table11.pendingItems).toHaveLength(0);
  });

  it('updateItemQty tăng giảm số lượng món và xóa khi về 0', () => {
    const store = useWaiterStore.getState();
    store.addItemToOrder('04', sampleMenuItem);
    const itemId = useWaiterStore.getState().tables['04'].pendingItems[0].id;

    store.updateItemQty('04', itemId, 2);
    expect(useWaiterStore.getState().tables['04'].pendingItems[0].qty).toBe(3);

    store.updateItemQty('04', itemId, -3);
    expect(useWaiterStore.getState().tables['04'].pendingItems).toHaveLength(0);
  });

  it('openSendKitchenModal chỉ mở khi có pendingItems', () => {
    const store = useWaiterStore.getState();
    store.setSelectedTable('04');

    // Chưa có món mới
    const openedEmpty = store.openSendKitchenModal();
    expect(openedEmpty).toBe(false);
    expect(useWaiterStore.getState().isSendKitchenModalOpen).toBe(false);

    // Đã có món mới
    store.addItemToOrder('04', sampleMenuItem);
    const openedWithItem = store.openSendKitchenModal();
    expect(openedWithItem).toBe(true);
    expect(useWaiterStore.getState().isSendKitchenModalOpen).toBe(true);
  });

  it('sendPendingOrderToKitchen chuyển pending sang confirmed và đổi status bàn', () => {
    const store = useWaiterStore.getState();
    store.addItemToOrder('10', sampleMenuItem); // Bàn 10 vốn đang vacant

    expect(useWaiterStore.getState().tables['10'].status).toBe('vacant');
    expect(useWaiterStore.getState().tables['10'].pendingItems).toHaveLength(1);

    const sentCount = store.sendPendingOrderToKitchen('10', 'Bàn VIP ngoài trời');
    expect(sentCount).toBe(1);

    const table10 = useWaiterStore.getState().tables['10'];
    expect(table10.status).toBe('serving');
    expect(table10.pendingItems).toHaveLength(0);
    expect(table10.confirmedItems).toHaveLength(1);
    expect(table10.confirmedItems[0].name).toBe('Phở Bò Thăn Áp Chảo');
    expect(table10.confirmedItems[0].status).toBe('sent');
    expect(useWaiterStore.getState().isSendKitchenModalOpen).toBe(false);
  });

  it('confirmItemServed cập nhật trạng thái món đã lên', () => {
    const store = useWaiterStore.getState();
    const table04 = useWaiterStore.getState().tables['04'];
    const targetItem = table04.confirmedItems.find((i) => i.status === 'cooking');
    expect(targetItem).toBeDefined();

    store.confirmItemServed('04', targetItem!.id);
    const updatedItem = useWaiterStore.getState().tables['04'].confirmedItems.find(
      (i) => i.id === targetItem!.id
    );
    expect(updatedItem?.status).toBe('served');
    expect(updatedItem?.statusText).toBe('Đã lên món');
  });

  it('tiến độ món giữa Bàn 11 và Bàn 04 hoàn toàn độc lập', () => {
    const table04 = useWaiterStore.getState().tables['04'];
    const table11 = useWaiterStore.getState().tables['11'];

    expect(table04.confirmedItems.some((i) => i.name.includes('Lẩu Riêu Cua'))).toBe(true);
    expect(table11.confirmedItems.some((i) => i.name.includes('Lẩu Riêu Cua'))).toBe(false);

    // Bàn 11 có Nem rán bị delayed
    const delayed11 = table11.confirmedItems.find((i) => i.status === 'delayed');
    expect(delayed11).toBeDefined();
    expect(delayed11?.name).toContain('Nem Rán');
  });

  it('transferTable chuyển toàn bộ order sang bàn mới và đặt bàn cũ thành vacant', () => {
    const store = useWaiterStore.getState();
    store.transferTable('04', '10');

    const table04 = useWaiterStore.getState().tables['04'];
    const table10 = useWaiterStore.getState().tables['10'];

    expect(table04.status).toBe('vacant');
    expect(table04.confirmedItems).toHaveLength(0);

    expect(table10.status).toBe('serving');
    expect(table10.confirmedItems.length).toBeGreaterThan(0);
    expect(useWaiterStore.getState().selectedTableId).toBe('10');
  });
});
