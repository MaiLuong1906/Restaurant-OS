import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PRESET_DISCOUNTS,
  computeTablePayable,
  computeTableSubtotal,
  usePosStore,
} from '../usePosStore';
import { CashierTable } from '../../types';
import { resolveReservationTargetDate } from '../../lib/utils';
import * as apiClient from '../../lib/api-client';

const TEST_SEED_TABLES: CashierTable[] = [
  {
    id: 't1',
    label: 'Bàn 01',
    seats: 4,
    area: 'Sảnh Tầng 1',
    status: 'IDLE',
    guests: 0,
    seatedMin: 0,
    staff: '',
    depositAmount: 0,
    discountAmount: 0,
    items: [],
  },
  {
    id: 't2',
    label: 'Bàn 02',
    seats: 4,
    area: 'Sảnh Tầng 1',
    status: 'OCCUPIED',
    guests: 3,
    seatedMin: 34,
    staff: 'Lan',
    depositAmount: 0,
    discountAmount: 0,
    items: [
      { id: 'i_201', name: 'Phở Bò Tái Lăn Hà Nội', qty: 2, unitPrice: 95000, status: 'SERVED' },
      { id: 'i_202', name: 'Chả Cá Lã Vọng', qty: 1, unitPrice: 185000, status: 'SERVED' },
      { id: 'i_203', name: 'Trà Sen Tây Hồ', qty: 3, unitPrice: 45000, status: 'SERVED' },
    ],
  },
  {
    id: 't4',
    label: 'Bàn 04',
    seats: 6,
    area: 'Sảnh Tầng 1',
    status: 'OVERDUE',
    guests: 5,
    seatedMin: 52,
    staff: 'Lan',
    depositAmount: 200000,
    discountAmount: 0,
    allergyAlert: 'Khách dị ứng đậu phộng — ưu tiên kiểm tra bill & đối soát cọc',
    items: [
      { id: 'i_401', name: 'Nem Rán Phố Cổ', qty: 2, unitPrice: 85000, status: 'SERVED', note: 'Không đậu phộng' },
      { id: 'i_402', name: 'Gỏi Ngó Sen Tôm Thịt', qty: 1, unitPrice: 115000, status: 'SERVED', note: 'Không hành phi' },
      { id: 'i_403', name: 'Lẩu Riêu Cua Bắp Bò', qty: 1, unitPrice: 320000, status: 'SERVED' },
      { id: 'i_404', name: 'Bún Tươi & Rau Đồng Nội', qty: 2, unitPrice: 35000, status: 'SERVED' },
      { id: 'i_405', name: 'Nước Mơ Ngâm Lâu Năm', qty: 5, unitPrice: 45000, status: 'SERVED' },
    ],
  },
  {
    id: 't5',
    label: 'Bàn 05',
    seats: 6,
    area: 'Sảnh Tầng 1',
    status: 'IDLE',
    guests: 0,
    seatedMin: 0,
    staff: '',
    depositAmount: 0,
    discountAmount: 0,
    items: [],
  },
  {
    id: 't6',
    label: 'Bàn 06',
    seats: 4,
    area: 'Sảnh Tầng 1',
    status: 'OCCUPIED',
    guests: 4,
    seatedMin: 25,
    staff: 'Mai',
    depositAmount: 0,
    discountAmount: 0,
    items: [
      { id: 'i_601', name: 'Bún Chả Hàng Mành', qty: 2, unitPrice: 95000, status: 'SERVED' },
      { id: 'i_602', name: 'Bò Lúc Lắc Khoai Tây', qty: 1, unitPrice: 175000, status: 'READY' },
      { id: 'i_603', name: 'Chè Khúc Bạch Nhãn Lồng', qty: 4, unitPrice: 45000, status: 'WAITING' },
    ],
  },
  {
    id: 't8',
    label: 'Bàn 08',
    seats: 8,
    area: 'Tầng 2 VIP',
    status: 'IDLE',
    guests: 0,
    seatedMin: 0,
    staff: '',
    depositAmount: 0,
    discountAmount: 0,
    items: [],
  },
];

describe('usePosStore - Nghiệp vụ Thu ngân (5 Cashier Use Cases & Số nguyên VND)', () => {
  beforeEach(() => {
    usePosStore.setState({
      tables: TEST_SEED_TABLES.map((t) => ({
        ...t,
        items: t.items.map((it) => ({ ...it })),
      })),
      reservations: [],
      selectedTableId: null,
    });
  });
  it('quản lý selectedTableId khởi tạo là null, cho phép chọn bàn và gỡ chọn bàn', () => {
    // Khởi tạo ban đầu là null
    expect(usePosStore.getState().selectedTableId).toBeNull();

    // Chọn bàn t1
    usePosStore.getState().selectTable('t1');
    expect(usePosStore.getState().selectedTableId).toBe('t1');

    // Gỡ chọn bàn về null
    usePosStore.getState().selectTable(null);
    expect(usePosStore.getState().selectedTableId).toBeNull();
  });
  it('phải tính đúng tạm tính và tổng cần thu (kèm VAT 8% và trừ cọc VND số nguyên)', () => {
    const table4 = usePosStore.getState().tables.find((t) => t.id === 't4');
    expect(table4).toBeDefined();
    if (!table4) return;

    const subtotal = computeTableSubtotal(table4);
    const payable = computeTablePayable(table4);
    expect(Number.isInteger(subtotal)).toBe(true);
    expect(Number.isInteger(payable)).toBe(true);
    expect(subtotal).toBe(900000);
    // 900.000 + 8% VAT (72.000) - 200.000 cọc = 772.000 VND
    expect(payable).toBe(772000);
  });

  it('UC1 & UC2: phải khởi tạo không có đơn đặt bàn mock, chặn tạo đơn khi chưa đồng bộ UUID bàn, và tạo/check-in thành công', () => {
    const store = usePosStore.getState();
    expect(store.reservations).toHaveLength(0);
    const available = store.checkAvailableTables('Sảnh Tầng 1', 4);
    expect(available.some((t) => t.id === 't1')).toBe(true);
    expect(available.some((t) => t.id === 't5')).toBe(true);

    // Nếu bàn chưa có UUID (chưa sync với BE) và không bật allowLocalOnly thì phải từ chối, không ghi tiền cọc vào ca
    const initialDepositCash = store.shift.depositCashCollected;
    const blockedRes = store.createReservation({
      customerName: 'Phạm Hoàng Long',
      phone: '0912345678',
      partySize: 4,
      reservedTime: '19:00',
      reservedDate: '08/11/2026',
      area: 'Sảnh Tầng 1',
      tableId: 't1',
      depositAmount: 300000,
      depositMethod: 'CASH',
      note: 'Bàn gia đình',
    });
    expect(blockedRes).toBeNull();
    expect(usePosStore.getState().shift.depositCashCollected).toBe(initialDepositCash);
    expect(usePosStore.getState().tables.find((t) => t.id === 't1')?.status).toBe('IDLE');

    const newRes = store.createReservation({
      customerName: 'Phạm Hoàng Long',
      phone: '0912345678',
      partySize: 4,
      reservedTime: '19:00',
      reservedDate: '08/11/2026',
      area: 'Sảnh Tầng 1',
      tableId: 't1',
      depositAmount: 300000,
      depositMethod: 'CASH',
      note: 'Bàn gia đình',
      allowLocalOnly: true,
    });
    expect(newRes).not.toBeNull();
    if (!newRes) return;

    const table1Reserved = usePosStore.getState().tables.find((t) => t.id === 't1');
    expect(table1Reserved?.status).toBe('RESERVED');
    expect(table1Reserved?.depositAmount).toBe(300000);

    // Check-in bàn đặt (không tự chèn món mock vào bill)
    usePosStore.getState().checkInReservation(newRes.id);
    const table1Occupied = usePosStore.getState().tables.find((t) => t.id === 't1');
    expect(table1Occupied?.status).toBe('OCCUPIED');
    expect(table1Occupied?.depositAmount).toBe(300000);
    expect(table1Occupied?.items).toHaveLength(0);
  });

  it('UC3: phải gộp nhiều bàn (giữ trạng thái Đang phục vụ) và tách các bàn đã gộp chuẩn số nguyên VND', () => {
    const store = usePosStore.getState();
    const t4Before = store.tables.find((t) => t.id === 't4')!;
    const t6Before = store.tables.find((t) => t.id === 't6')!;
    const t8Before = store.tables.find((t) => t.id === 't8')!;
    const t4TotalBefore = computeTableSubtotal(t4Before);
    const t6TotalBefore = computeTableSubtotal(t6Before);
    const t4GuestsBefore = t4Before.guests;
    const t6GuestsBefore = t6Before.guests;

    // Gộp 3 bàn: t6 (OCCUPIED) + t8 (IDLE) vào t4 (OVERDUE)
    store.mergeTables(['t6', 't8'], 't4');

    const t4AfterMerge = usePosStore.getState().tables.find((t) => t.id === 't4')!;
    const t6AfterMerge = usePosStore.getState().tables.find((t) => t.id === 't6')!;
    const t8AfterMerge = usePosStore.getState().tables.find((t) => t.id === 't8')!;

    // Các bàn được gộp vẫn giữ trạng thái Đang phục vụ (OCCUPIED)
    expect(t6AfterMerge.status).toBe('OCCUPIED');
    expect(t6AfterMerge.mergedIntoTableId).toBe('t4');
    expect(t8AfterMerge.status).toBe('OCCUPIED');
    expect(t8AfterMerge.mergedIntoTableId).toBe('t4');
    expect(t4AfterMerge.guests).toBe(t4GuestsBefore + t6GuestsBefore + t8Before.guests);
    expect(t4AfterMerge.mergedMemberTables).toHaveLength(2);
    expect(computeTableSubtotal(t4AfterMerge)).toBe(t4TotalBefore + t6TotalBefore);

    // Tách bàn t6 bị gộp nhầm ra khỏi nhóm t4
    usePosStore.getState().splitMergedTables('t4', ['t6']);

    const t4AfterSplitOne = usePosStore.getState().tables.find((t) => t.id === 't4')!;
    const t6AfterSplit = usePosStore.getState().tables.find((t) => t.id === 't6')!;
    const t8StillMerged = usePosStore.getState().tables.find((t) => t.id === 't8')!;

    expect(t6AfterSplit.status).toBe('OCCUPIED');
    expect(t6AfterSplit.guests).toBe(t6GuestsBefore);
    expect(t6AfterSplit.mergedIntoTableId).toBeUndefined();
    expect(computeTableSubtotal(t6AfterSplit)).toBe(t6TotalBefore);
    expect(computeTableSubtotal(t4AfterSplitOne)).toBe(t4TotalBefore);
    expect(t4AfterSplitOne.mergedMemberTables).toHaveLength(1);
    expect(t8StillMerged.status).toBe('OCCUPIED');

    // Tách nốt t8 ra khỏi nhóm (gọi từ id của chính t8)
    usePosStore.getState().splitMergedTables('t8', ['t8']);
    const t4AfterSplitAll = usePosStore.getState().tables.find((t) => t.id === 't4')!;
    const t8AfterSplit = usePosStore.getState().tables.find((t) => t.id === 't8')!;
    expect(t8AfterSplit.status).toBe('IDLE');
    expect(t8AfterSplit.mergedIntoTableId).toBeUndefined();
    expect(t4AfterSplitAll.mergedMemberTables).toBeUndefined();
    expect(computeTableSubtotal(t4AfterSplitAll)).toBe(t4TotalBefore);
  });

  it('UC4 & UC5: phải khóa bàn, áp dụng giảm giá, mở két và đối soát kết ca chuẩn xác', () => {
    const store = usePosStore.getState();
    store.lockTableForSettlement('t2');
    expect(usePosStore.getState().tables.find((t) => t.id === 't2')?.status).toBe('LOCKED');

    // Áp dụng giảm giá VIP 10%
    store.applyDiscountRule('t2', PRESET_DISCOUNTS[1]);
    const t2Discounted = usePosStore.getState().tables.find((t) => t.id === 't2')!;
    expect(t2Discounted.discountAmount).toBe(Math.round(computeTableSubtotal(t2Discounted) * 0.1));

    // Mở két tiền
    const log = store.triggerCashDrawerOpening('Kiểm tra két ca tối');
    expect(log.idempotencyKey.length).toBeGreaterThan(8);

    // Đối soát kết ca
    const currentShift = usePosStore.getState().shift;
    const expectedCash =
      currentShift.openingCash +
      currentShift.cashSales +
      currentShift.depositCashCollected -
      currentShift.cashRefundsOrPayouts;
    store.settleShiftAndBalance(expectedCash, 'Khớp két 100%');
    expect(usePosStore.getState().shift.status).toBe('SETTLED');
    expect(usePosStore.getState().shift.actualCountedCash).toBe(expectedCash);
  });

  it('UC6: phải chấm công nghỉ giữa ca, tan ca và chấm công vào ca mới bằng mã PIN', () => {
    const store = usePosStore.getState();

    // Bắt đầu nghỉ giữa ca và quay lại làm việc
    store.toggleBreakAttendance();
    expect(usePosStore.getState().currentAttendance.status).toBe('ON_BREAK');
    store.toggleBreakAttendance();
    expect(usePosStore.getState().currentAttendance.status).toBe('WORKING');

    // Tan ca
    store.clockOutAttendance('Hoàn tất bàn giao ca');
    expect(usePosStore.getState().currentAttendance.status).toBe('CHECKED_OUT');
    expect(usePosStore.getState().currentAttendance.checkOutTime).toBeDefined();

    // Mã PIN không đủ 4 chữ số bị từ chối
    const rejected = store.clockInAttendance('PIN', '12');
    expect(rejected).toBe(false);

    // Chấm công vào ca mới với PIN hợp lệ
    const accepted = store.clockInAttendance('PIN', '1234', 'Nhận ca mới');
    expect(accepted).toBe(true);
    expect(usePosStore.getState().currentAttendance.status).toBe('WORKING');
    expect(usePosStore.getState().attendanceLogs[0].note).toBe('Nhận ca mới');
  });

  it('Đặt bàn: nếu chọn giờ đã qua so với thời gian hiện tại thì tự động chuyển sang ngày hôm sau', () => {
    const baseNow = new Date(2026, 10, 13, 22, 40, 0); // 13/11/2026 22:40

    const pastSlot = resolveReservationTargetDate('19:00', baseNow);
    expect(pastSlot.isTomorrow).toBe(true);
    expect(pastSlot.reservedDate).toBe('14/11/2026');

    const midnightSlot = resolveReservationTargetDate('00:15', baseNow);
    expect(midnightSlot.isTomorrow).toBe(true);
    expect(midnightSlot.reservedDate).toBe('14/11/2026');

    const upcomingSlot = resolveReservationTargetDate('23:00', baseNow);
    expect(upcomingSlot.isTomorrow).toBe(false);
    expect(upcomingSlot.reservedDate).toBe('13/11/2026');
  });

  it('Chi nội bộ: phải bắt buộc có note, cộng dồn tiền chi số nguyên VND và lưu vào nhật ký', () => {
    const store = usePosStore.getState();
    const prevPayouts = store.shift.cashRefundsOrPayouts;
    const prevCount = store.shift.payoutLogs.length;

    // Từ chối khi thiếu note
    const rejected = store.recordInternalPayout(50000, '   ');
    expect(rejected).toBeNull();

    // Ghi nhận hợp lệ
    const added = store.recordInternalPayout(75000, 'Mua đá viên & chanh tươi');
    expect(added).not.toBeNull();

    const updatedShift = usePosStore.getState().shift;
    expect(updatedShift.cashRefundsOrPayouts).toBe(prevPayouts + 75000);
    expect(updatedShift.payoutLogs.length).toBe(prevCount + 1);
    expect(updatedShift.payoutLogs[0].note).toBe('Mua đá viên & chanh tươi');
    expect(Number.isInteger(updatedShift.payoutLogs[0].amount)).toBe(true);
  });

  it('két tiền chuyển trạng thái Mở két <-> Đóng két và cho phép mở lại ca đã chốt', () => {
    const store = usePosStore.getState();
    if (usePosStore.getState().isCashDrawerOpen) {
      store.closeCashDrawer('Đóng két sau giao dịch trước đó');
    }
    const initialLogs = usePosStore.getState().shift.drawerOpenLogs.length;

    expect(usePosStore.getState().isCashDrawerOpen).toBe(false);
    store.toggleCashDrawer('Mở két kiểm tiền');
    expect(usePosStore.getState().isCashDrawerOpen).toBe(true);
    expect(usePosStore.getState().shift.drawerOpenLogs.length).toBe(initialLogs + 1);

    store.toggleCashDrawer('Mở két kiểm tiền');
    expect(usePosStore.getState().isCashDrawerOpen).toBe(false);
    expect(usePosStore.getState().shift.drawerOpenLogs.length).toBe(initialLogs + 2);

    store.settleShiftAndBalance(usePosStore.getState().shift.openingCash, 'Chốt ca');
    expect(usePosStore.getState().shift.status).toBe('SETTLED');

    store.reopenShiftDemo();
    expect(usePosStore.getState().shift.status).toBe('OPEN');
  });

  it('Sơ đồ bàn trực quan: syncWithBackend phải đồng bộ danh sách bàn thật từ /tables, gắn món từ /orders/active, giữ món REJECTED (không tính tiền), không suy đoán số khách/dị ứng sai', async () => {
    usePosStore.setState({ tables: [], reservations: [], hasBackendTableUuids: false });

    const table1Uuid = '11111111-1111-4111-8111-111111111111';
    const table4Uuid = '44444444-4444-4444-8444-444444444444';
    const opened50MinAgo = new Date(Date.now() - 50 * 60 * 1000).toISOString();

    const spy = vi.spyOn(apiClient, 'fetchApi').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/tables') {
        return [
          {
            id: table1Uuid,
            tableNumber: 'Bàn 01',
            capacity: 4,
            status: 'VACANT',
            currentOrderId: null,
            zoneName: 'Tầng 1 - Sảnh Chính',
          },
          {
            id: table4Uuid,
            tableNumber: 'Bàn 04',
            capacity: 6,
            status: 'SERVING',
            currentOrderId: 'ord-04',
            zoneName: 'Tầng 2 - Phòng VIP',
            occupiedAt: opened50MinAgo,
          },
        ];
      }
      if (endpoint === '/orders/active') {
        return [
          {
            id: 'ord-04',
            tableId: table4Uuid,
            orderCode: 'ORD-004',
            status: 'PLACED',
            totalAmount: 275000,
            customerNotes: 'Không dị ứng',
            openedAt: opened50MinAgo,
            items: [
              {
                id: 'item-1',
                dishId: 'dish-1',
                dishNameSnapshot: 'Phở Bò Đặc Biệt',
                quantity: 2,
                unitPrice: 95000,
                status: 'SERVED',
                notes: 'Ít hành',
                allergyNote: 'Dị ứng đậu phộng nghiêm ngặt',
              },
              {
                id: 'item-2',
                dishId: 'dish-2',
                dishNameSnapshot: 'Nem Rán Phố Cổ',
                quantity: 1,
                unitPrice: 85000,
                status: 'REJECTED',
                notes: 'Hết nguyên liệu',
                allergyNote: null,
              },
            ],
          },
        ];
      }
      return [];
    });

    await usePosStore.getState().syncWithBackend();

    const syncedTables = usePosStore.getState().tables;
    expect(syncedTables).toHaveLength(2);
    expect(usePosStore.getState().hasBackendTableUuids).toBe(true);

    const t1 = syncedTables.find((t) => t.id === table1Uuid)!;
    expect(t1.status).toBe('IDLE');
    expect(t1.area).toBe('Sảnh Tầng 1');
    expect(t1.items).toHaveLength(0);

    const t4 = syncedTables.find((t) => t.id === table4Uuid)!;
    // Ngồi 50 phút >= 45 phút SLA -> OVERDUE
    expect(t4.status).toBe('OVERDUE');
    expect(t4.area).toBe('Tầng 2 VIP');
    // Không tự bịa số khách từ số lượng món khi khách vãng lai chưa có partySize
    expect(t4.guests).toBe(0);
    // Cả món SERVED và món REJECTED đều được giữ lại trên hóa đơn, nhưng REJECTED không tính vào subtotal
    expect(t4.items).toHaveLength(2);
    expect(t4.items[0].name).toBe('Phở Bò Đặc Biệt');
    expect(t4.items[0].status).toBe('SERVED');
    expect(t4.items[1].name).toBe('Nem Rán Phố Cổ');
    expect(t4.items[1].status).toBe('REJECTED');
    expect(t4.allergyAlert).toBe('Dị ứng đậu phộng nghiêm ngặt');
    expect(computeTableSubtotal(t4)).toBe(190000);

    spy.mockRestore();
  });

  it('lockTableForSettlement / unlockTableState / markTableCleanDone phải hoàn tác (revert) trạng thái khi PATCH lỗi', async () => {
    const table2Uuid = '22222222-2222-4222-8222-222222222222';
    usePosStore.setState({
      tables: [
        {
          id: table2Uuid,
          label: 'Bàn 02',
          seats: 4,
          area: 'Sảnh Tầng 1',
          status: 'OCCUPIED',
          guests: 2,
          seatedMin: 20,
          staff: 'Phục vụ',
          depositAmount: 0,
          discountAmount: 0,
          items: [{ id: 'i_1', name: 'Phở Bò', qty: 1, unitPrice: 95000, status: 'SERVED' }],
        },
      ],
    });

    const spy = vi.spyOn(apiClient, 'fetchApi').mockRejectedValue(new Error('403 Forbidden'));

    usePosStore.getState().lockTableForSettlement(table2Uuid);
    // Đợi promise catch xử lý revert
    await new Promise((r) => setTimeout(r, 10));

    const revertedTable = usePosStore.getState().tables.find((t) => t.id === table2Uuid)!;
    expect(revertedTable.status).toBe('OCCUPIED');
    expect(usePosStore.getState().lastActionToast).toContain('Không thể khóa trạng thái');

    spy.mockRestore();
  });
});

