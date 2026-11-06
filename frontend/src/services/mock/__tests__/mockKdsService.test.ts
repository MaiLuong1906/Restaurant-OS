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
});
