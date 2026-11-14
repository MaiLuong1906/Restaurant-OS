import { describe, it, expect } from 'vitest';
import {
  PRESET_DISCOUNTS,
  computeTablePayable,
  computeTableSubtotal,
  usePosStore,
} from '../usePosStore';
import { resolveReservationTargetDate } from '../../lib/utils';

describe('usePosStore - Nghiệp vụ Thu ngân (5 Cashier Use Cases & Số nguyên VND)', () => {
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

  it('UC1 & UC2: phải kiểm tra bàn trống, tạo đặt bàn có thu cọc và check-in thành công', () => {
    const store = usePosStore.getState();
    const available = store.checkAvailableTables('Sảnh Tầng 1', 4);
    expect(available.some((t) => t.id === 't1')).toBe(true);

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
    });

    const table1Reserved = usePosStore.getState().tables.find((t) => t.id === 't1');
    expect(table1Reserved?.status).toBe('RESERVED');
    expect(table1Reserved?.depositAmount).toBe(300000);

    // Check-in bàn đặt
    usePosStore.getState().checkInReservation(newRes.id);
    const table1Occupied = usePosStore.getState().tables.find((t) => t.id === 't1');
    expect(table1Occupied?.status).toBe('OCCUPIED');
    expect(table1Occupied?.depositAmount).toBe(300000);
  });

  it('UC3: phải tách hóa đơn chia đều theo số nguyên VND không phát sinh số lẻ', () => {
    usePosStore.getState().splitInvoiceEqual('t4', 3);
    const table4 = usePosStore.getState().tables.find((t) => t.id === 't4');
    expect(table4?.splits?.length).toBe(3);

    const sumParts = (table4?.splits ?? []).reduce((acc, s) => acc + s.amount, 0);
    expect(sumParts).toBe(computeTablePayable(table4!));
    for (const part of table4?.splits ?? []) {
      expect(Number.isInteger(part.amount)).toBe(true);
    }
    usePosStore.getState().clearSplitInvoice('t4');
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
});

