import { describe, it, expect, beforeEach } from 'vitest';
import { MockKdsService } from '../mockKdsService';
import { MOCK_TICKETS } from '../data/kdsMockData';

describe('MockKdsService', () => {
  let service: MockKdsService;

  beforeEach(() => {
    service = new MockKdsService();
  });

  it('phải trả về đúng 6 tickets và tổng cộng 16 phần món (portions)', async () => {
    const tickets = await service.getTickets();
    expect(tickets.length).toBe(6);

    const totalQuantity = tickets.reduce(
      (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );
    expect(totalQuantity).toBe(16);
  });

  it('tất cả các items chỉ có trạng thái hợp lệ trong A.1 union (không có COOKING)', async () => {
    const tickets = await service.getTickets();
    const allowedStatuses = ['WAITING', 'READY', 'SERVED', 'REJECTED'];

    tickets.forEach((t) => {
      t.items.forEach((item) => {
        expect(allowedStatuses).toContain(item.status);
        expect((item.status as string)).not.toBe('COOKING');
      });
    });
  });

  it('đảm bảo deep-clone: sửa data trả về không làm ô nhiễm dữ liệu gốc', async () => {
    const tickets1 = await service.getTickets();
    tickets1[0].tableNo = 'Bàn Đã Sửa';

    const tickets2 = await service.getTickets();
    expect(tickets2[0].tableNo).toBe('Bàn 04');
  });

  it('cập nhật trạng thái item với idempotencyKey hoạt động chuẩn xác', async () => {
    const key = 'idem-key-1';
    const updated = await service.updateItemStatus('t04', 'item-04-1', 'READY', key);
    const item = updated.items.find((i) => i.id === 'item-04-1');
    expect(item?.status).toBe('READY');

    // Gọi lại cùng idempotencyKey trả về snapshot không đổi
    const repeat = await service.updateItemStatus('t04', 'item-04-1', 'WAITING', key);
    expect(repeat.items.find((i) => i.id === 'item-04-1')?.status).toBe('READY');
  });

  it('xử lý acknowledgeOrderChange: CANCEL_ITEM chuyển item sang REJECTED, EDIT_NOTE cập nhật note', async () => {
    const pending = await service.getPendingOrderChanges();
    expect(pending.length).toBeGreaterThan(0);

    const cancelAlert = pending.find((a) => a.variant === 'CANCEL_ITEM')!;
    const resCancel = await service.acknowledgeOrderChange(cancelAlert.id);
    expect(resCancel.alert.acknowledged).toBe(true);
    const cancelledItem = resCancel.ticket.items.find((i) => i.id === cancelAlert.itemId);
    expect(cancelledItem?.status).toBe('REJECTED');

    const editAlert = pending.find((a) => a.variant === 'EDIT_NOTE')!;
    const resEdit = await service.acknowledgeOrderChange(editAlert.id);
    expect(resEdit.alert.acknowledged).toBe(true);
    const editedItem = resEdit.ticket.items.find((i) => i.id === editAlert.itemId);
    expect(editedItem?.notes).toBe(editAlert.newNote);
  });

  it('quản lý danh sách hết món: markSoldOut và reopenDish hoạt động chuẩn với idempotencyKey', async () => {
    const list = await service.listDishAvailability();
    expect(list.length).toBeGreaterThan(0);

    const availableDish = list.find((d) => d.status === 'AVAILABLE')!;
    const keySoldOut = 'soldout-key-1';
    const marked = await service.markSoldOut(availableDish.dishId, keySoldOut);
    expect(marked.status).toBe('SOLD_OUT');
    expect(marked.remainingPortions).toBe(0);

    // Reopen dish
    const keyReopen = 'reopen-key-1';
    const reopened = await service.reopenDish(availableDish.dishId, 10, keyReopen);
    expect(reopened.status).toBe('AVAILABLE');
    expect(reopened.remainingPortions).toBe(10);

    // Reopen invalid quantity phải throw
    await expect(service.reopenDish(availableDish.dishId, 0, 'key-invalid')).rejects.toThrow();
  });

  it('quản lý ghi hủy món: stats, validation, trừ kho và idempotencyKey', async () => {
    const statsBefore = await service.getWasteTodayStats();
    expect(statsBefore.logCount).toBeGreaterThan(0);

    const options = await service.getWasteDishOptions();
    const inStock = options.find((d) => d.stockQuantity > 0)!;

    // Reject non-head-chef
    await expect(
      service.createWasteLog({
        dishId: inStock.dishId,
        quantity: 1,
        reason: 'Nấu hỏng',
        recordedByRole: 'STAFF',
        idempotencyKey: 'waste-unauthorized',
      })
    ).rejects.toThrow();

    // Reject 'Lý do khác' thiếu note
    await expect(
      service.createWasteLog({
        dishId: inStock.dishId,
        quantity: 1,
        reason: 'Lý do khác',
        note: '',
        recordedByRole: 'HEAD_CHEF',
        idempotencyKey: 'waste-missing-note',
      })
    ).rejects.toThrow();

    // Success create waste log
    const key = 'waste-key-success';
    const log = await service.createWasteLog({
      dishId: inStock.dishId,
      quantity: 1,
      reason: 'Nấu hỏng',
      recordedByRole: 'HEAD_CHEF',
      idempotencyKey: key,
    });
    expect(log.dishId).toBe(inStock.dishId);
    expect(log.quantity).toBe(1);

    // Duplicate idempotencyKey
    const dup = await service.createWasteLog({
      dishId: inStock.dishId,
      quantity: 1,
      reason: 'Nấu hỏng',
      recordedByRole: 'HEAD_CHEF',
      idempotencyKey: key,
    });
    expect(dup.id).toBe(log.id);

    const statsAfter = await service.getWasteTodayStats();
    expect(statsAfter.logCount).toBe(statsBefore.logCount + 1);
    expect(statsAfter.portionCount).toBe(statsBefore.portionCount + 1);
  });
});
