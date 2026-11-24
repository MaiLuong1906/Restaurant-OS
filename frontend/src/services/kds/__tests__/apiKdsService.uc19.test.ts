import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiKdsService } from '../ApiKdsService';
import { Ticket, OrderItem } from '../../../types';

describe('ApiKdsService UC19 (K3 & K4)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('updateTicketStatus gửi PATCH /kds/tickets/{id}/complete với body {} và header X-Request-ID', async () => {
    const mockTicket: Ticket = {
      id: 'ticket-1',
      tableId: 'table-1',
      tableNo: 'Bàn 04',
      status: 'READY',
      createdAt: '2026-11-23T10:00:00Z',
      items: [
        {
          id: 'item-1',
          orderId: 'ticket-1',
          dishId: 'dish-1',
          dishName: 'Phở Bò',
          quantity: 2,
          unitPrice: 65000,
          modifiers: [],
          status: 'READY',
          createdAt: '2026-11-23T10:00:00Z',
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockTicket }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const service = new ApiKdsService();
    const res = await service.updateTicketStatus('ticket-1', 'READY', 'req-uuid-123');

    expect(res.status).toBe('READY');
    expect(res.items.every((i) => i.status === 'READY')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/kds/tickets/ticket-1/complete');
    expect(options.method).toBe('PATCH');
    expect(options.body).toBe('{}');
    expect(options.headers['X-Request-ID']).toBe('req-uuid-123');
  });

  it('updateItemStatus chặn gửi SERVED từ màn hình bếp', async () => {
    const service = new ApiKdsService();
    await expect(
      service.updateItemStatus('ticket-1', 'item-1', 'SERVED', 'req-1')
    ).rejects.toThrow(/READY hoặc REJECTED/);
  });

  it('updateItemStatus với REJECTED bắt buộc lý do 5-200 ký tự (thiếu hoặc quá ngắn/dài thì lỗi)', async () => {
    const service = new ApiKdsService();

    await expect(
      service.updateItemStatus('ticket-1', 'item-1', 'REJECTED', 'req-1')
    ).rejects.toThrow(/5 đến 200 ký tự/);

    await expect(
      service.updateItemStatus('ticket-1', 'item-1', 'REJECTED', 'req-2', 'hết')
    ).rejects.toThrow(/5 đến 200 ký tự/);

    await expect(
      service.updateItemStatus('ticket-1', 'item-1', 'REJECTED', 'req-3', 'a'.repeat(201))
    ).rejects.toThrow(/5 đến 200 ký tự/);
  });

  it('updateItemStatus với REJECTED hợp lệ gọi PATCH /kds/items/{id}/status rồi lấy lại ticket', async () => {
    const updatedItem: OrderItem = {
      id: 'item-1',
      orderId: 'ticket-1',
      dishId: 'dish-1',
      dishName: 'Cà Phê Muối',
      quantity: 1,
      unitPrice: 35000,
      modifiers: [],
      status: 'REJECTED',
      createdAt: '2026-11-23T10:00:00Z',
    };

    const updatedTicket: Ticket = {
      id: 'ticket-1',
      tableId: 'table-1',
      tableNo: 'Bàn 04',
      status: 'REJECTED',
      createdAt: '2026-11-23T10:00:00Z',
      items: [updatedItem],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: updatedItem }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: updatedTicket }),
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const service = new ApiKdsService();
    const ticket = await service.updateItemStatus(
      'ticket-1',
      'item-1',
      'REJECTED',
      'req-reject-1',
      '  Hết nguyên liệu cà phê muối  '
    );

    expect(ticket.status).toBe('REJECTED');
    expect(ticket.items[0].status).toBe('REJECTED');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [patchUrl, patchOptions] = fetchMock.mock.calls[0];
    expect(patchUrl).toContain('/kds/items/item-1/status');
    expect(patchOptions.method).toBe('PATCH');
    expect(patchOptions.headers['X-Request-ID']).toBe('req-reject-1');
    expect(JSON.parse(patchOptions.body)).toEqual({
      status: 'REJECTED',
      reason: 'Hết nguyên liệu cà phê muối',
    });

    const [getUrl] = fetchMock.mock.calls[1];
    expect(getUrl).toContain('/kds/tickets/ticket-1');
  });
});
