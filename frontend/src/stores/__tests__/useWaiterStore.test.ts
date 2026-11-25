import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWaiterStore } from '../useWaiterStore';
import { waiterApi } from '../../services/waiter/waiterApi';

vi.mock('../../services/waiter/waiterApi', () => ({
  waiterApi: {
    fetchTables: vi.fn(),
    fetchActiveOrders: vi.fn(),
    createOrder: vi.fn(),
    serveOrderItem: vi.fn(),
    updateTableStatus: vi.fn(),
    fetchDishes: vi.fn().mockResolvedValue([]),
  },
}));

describe('useWaiterStore — Serve Items & Table Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWaiterStore.setState({
      isSyncing: false,
      hasSyncedBackend: false,
      syncError: null,
      servingItemIds: {},
      toastMessage: null,
    });
  });

  it('1. syncFromBackend tải dữ liệu bàn và đơn hàng thật từ API và map đúng trạng thái', async () => {
    const tableId = '11111111-1111-1111-1111-111111111111';
    const orderId = '22222222-2222-2222-2222-222222222222';
    vi.mocked(waiterApi.fetchTables).mockResolvedValueOnce([
      { id: tableId, tableNumber: 'B01', capacity: 4, status: 'SERVING', currentOrderId: orderId },
    ]);
    vi.mocked(waiterApi.fetchActiveOrders).mockResolvedValueOnce([
      {
        id: orderId,
        tableId,
        orderCode: 'ORD-1001',
        status: 'PLACED',
        totalAmount: 210000,
        customerNotes: null,
        openedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        items: [
          {
            id: 'item-ready',
            dishId: 'dish-1',
            dishNameSnapshot: 'Phở Bò',
            portionId: 'p-1',
            portionNameSnapshot: 'Tô lớn',
            quantity: 1,
            unitPrice: 125000,
            status: 'READY',
            notes: null,
            allergyNote: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'item-waiting',
            dishId: 'dish-2',
            dishNameSnapshot: 'Nem Rán',
            portionId: 'p-2',
            portionNameSnapshot: 'Đĩa',
            quantity: 1,
            unitPrice: 85000,
            status: 'WAITING',
            notes: null,
            allergyNote: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]);

    await useWaiterStore.getState().syncFromBackend();

    const state = useWaiterStore.getState();
    expect(state.hasSyncedBackend).toBe(true);
    expect(state.tables[tableId]).toBeDefined();
    expect(state.tables[tableId].status).toBe('serving');
    expect(state.tables[tableId].orderCode).toBe('ORD-1001');
    expect(state.tables[tableId].confirmedItems).toHaveLength(2);
    expect(state.tables[tableId].confirmedItems[0].status).toBe('ready');
    expect(state.tables[tableId].confirmedItems[1].status).toBe('sent');
  });

  it('2. confirmItemServed gọi API giao món thành công cho món READY và cập nhật sang served', async () => {
    const tableId = '11111111-1111-1111-1111-111111111111';
    useWaiterStore.setState({
      tables: {
        [tableId]: {
          id: tableId,
          name: 'Bàn B01',
          seats: 4,
          guests: 4,
          zone: 'Sảnh chính',
          status: 'serving',
          statusText: 'Đang dùng bữa',
          server: 'Phục vụ',
          timeIn: '12:00',
          elapsed: '10 phút',
          pendingItems: [],
          confirmedItems: [
            {
              id: 'item-ready',
              dishId: 'dish-1',
              name: 'Phở Bò',
              sku: 'STD',
              price: 125000,
              qty: 1,
              category: 'Thực đơn',
              station: 'Bếp KDS',
              status: 'ready',
              statusText: 'Bếp xong — Chờ giao',
              tableId,
            },
          ],
        },
      },
    });

    vi.mocked(waiterApi.serveOrderItem).mockResolvedValueOnce({
      id: 'item-ready',
      dishId: 'dish-1',
      dishNameSnapshot: 'Phở Bò',
      portionId: 'p-1',
      portionNameSnapshot: 'STD',
      quantity: 1,
      unitPrice: 125000,
      status: 'SERVED',
      notes: null,
      allergyNote: null,
    });

    const ok = await useWaiterStore.getState().confirmItemServed(tableId, 'item-ready');
    expect(ok).toBe(true);
    expect(waiterApi.serveOrderItem).toHaveBeenCalledWith('item-ready');
    expect(useWaiterStore.getState().tables[tableId].confirmedItems[0].status).toBe('served');
  });

  it('3. confirmItemServed chặn giao món đang chờ bếp (sent/WAITING) và không gọi API', async () => {
    const tableId = '11111111-1111-1111-1111-111111111111';
    useWaiterStore.setState({
      tables: {
        [tableId]: {
          id: tableId,
          name: 'Bàn B01',
          seats: 4,
          guests: 4,
          zone: 'Sảnh chính',
          status: 'serving',
          statusText: 'Đang dùng bữa',
          server: 'Phục vụ',
          timeIn: '12:00',
          elapsed: '10 phút',
          pendingItems: [],
          confirmedItems: [
            {
              id: 'item-waiting',
              dishId: 'dish-2',
              name: 'Nem Rán',
              sku: 'STD',
              price: 85000,
              qty: 1,
              category: 'Thực đơn',
              station: 'Bếp KDS',
              status: 'sent',
              statusText: 'Chờ bếp / Đang nấu',
              tableId,
            },
          ],
        },
      },
    });

    const ok = await useWaiterStore.getState().confirmItemServed(tableId, 'item-waiting');
    expect(ok).toBe(false);
    expect(waiterApi.serveOrderItem).not.toHaveBeenCalled();
  });

  it('4. confirmItemServed xử lý lỗi 409 từ Backend (giao trùng) mà không fake trạng thái UI', async () => {
    const tableId = '11111111-1111-1111-1111-111111111111';
    useWaiterStore.setState({
      tables: {
        [tableId]: {
          id: tableId,
          name: 'Bàn B01',
          seats: 4,
          guests: 4,
          zone: 'Sảnh chính',
          status: 'serving',
          statusText: 'Đang dùng bữa',
          server: 'Phục vụ',
          timeIn: '12:00',
          elapsed: '10 phút',
          pendingItems: [],
          confirmedItems: [
            {
              id: 'item-ready',
              dishId: 'dish-1',
              name: 'Phở Bò',
              sku: 'STD',
              price: 125000,
              qty: 1,
              category: 'Thực đơn',
              station: 'Bếp KDS',
              status: 'ready',
              statusText: 'Bếp xong — Chờ giao',
              tableId,
            },
          ],
        },
      },
    });

    vi.mocked(waiterApi.serveOrderItem).mockRejectedValueOnce(new Error('Món đã được giao trước đó'));

    const ok = await useWaiterStore.getState().confirmItemServed(tableId, 'item-ready');
    expect(ok).toBe(false);
    expect(useWaiterStore.getState().tables[tableId].confirmedItems[0].status).toBe('ready');
    expect(useWaiterStore.getState().toastMessage).toContain('Món đã được giao trước đó');
  });

  it('5. updateTableStatusApi báo lỗi khi Backend chặn giải phóng bàn còn món chưa phục vụ', async () => {
    const tableId = '11111111-1111-1111-1111-111111111111';
    vi.mocked(waiterApi.updateTableStatus).mockRejectedValueOnce(
      new Error('Không thể giải phóng bàn khi vẫn còn món đang chờ bếp hoặc chưa phục vụ.')
    );

    const ok = await useWaiterStore.getState().updateTableStatusApi(tableId, 'VACANT');
    expect(ok).toBe(false);
    expect(useWaiterStore.getState().toastMessage).toContain('Không thể giải phóng bàn');
  });

  it('6. sendPendingOrderToKitchen gọi POST /orders thật và đồng bộ lại từ Backend', async () => {
    const tableId = '11111111-1111-1111-1111-111111111111';
    useWaiterStore.setState({
      tables: {
        [tableId]: {
          id: tableId,
          name: 'Bàn 01',
          seats: 4,
          guests: 2,
          zone: 'Sảnh chính',
          status: 'vacant',
          statusText: 'Bàn trống',
          server: 'Phục vụ',
          timeIn: '--:--',
          elapsed: '0 phút',
          pendingItems: [
            {
              id: 'p-1',
              dishId: '1596b966-2cb9-444e-be8d-da3161779887',
              name: 'Phở Bò Đặc Biệt',
              sku: 'PB01',
              price: 75000,
              qty: 2,
              category: 'Món chính',
              station: 'Bếp nóng',
              status: 'pending',
              statusText: 'Chờ gửi bếp',
              tableId,
            },
          ],
          confirmedItems: [],
        },
      },
    });

    vi.mocked(waiterApi.createOrder).mockResolvedValueOnce({
      id: 'order-new',
      tableId,
      orderCode: 'ORD-NEW',
      status: 'PLACED',
      totalAmount: 150000,
      customerNotes: null,
      openedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items: [],
    });
    vi.mocked(waiterApi.fetchTables).mockResolvedValueOnce([
      { id: tableId, tableNumber: '01', capacity: 4, status: 'SERVING', currentOrderId: 'order-new' },
    ]);
    vi.mocked(waiterApi.fetchActiveOrders).mockResolvedValueOnce([]);
    vi.mocked(waiterApi.fetchDishes).mockResolvedValueOnce([]);

    const sent = await useWaiterStore.getState().sendPendingOrderToKitchen(tableId, 'Ít hành');
    expect(sent).toBe(1);
    expect(waiterApi.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId,
        customerNotes: 'Ít hành',
        items: [
          expect.objectContaining({
            dishId: '1596b966-2cb9-444e-be8d-da3161779887',
            quantity: 2,
          }),
        ],
      })
    );
    expect(useWaiterStore.getState().tables[tableId].pendingItems).toHaveLength(0);
  });
});
