import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKdsService } from '../ApiKdsService';
import { fetchApi } from '../../../lib/api-client';
import type { OrderChangeAlertData, Ticket } from '../../../types';

vi.mock('../../../lib/api-client', () => ({
  fetchApi: vi.fn(),
}));

describe('ApiKdsService — Case 5 OrderChangeAlerts', () => {
  let service: ApiKdsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ApiKdsService();
  });

  it('getPendingOrderChanges gọi GET /kds/order-changes và trả về danh sách cảnh báo', async () => {
    const mockAlerts: OrderChangeAlertData[] = [
      {
        id: 'alert-1',
        ticketId: 'ticket-1',
        itemId: 'item-1',
        dishName: 'Phở Bò',
        tableNo: 'Bàn 02',
        quantity: 1,
        variant: 'CANCEL_ITEM',
        reason: 'Khách hủy món',
        acknowledged: false,
        createdAt: '2026-11-28T10:00:00Z',
      },
    ];
    vi.mocked(fetchApi).mockResolvedValueOnce(mockAlerts);

    const result = await service.getPendingOrderChanges();

    expect(fetchApi).toHaveBeenCalledWith('/kds/order-changes');
    expect(result).toEqual(mockAlerts);
  });

  it('acknowledgeOrderChange gọi POST /kds/order-changes/{id}/acknowledge và lấy lại ticket', async () => {
    const mockAlert: OrderChangeAlertData = {
      id: 'alert-1',
      ticketId: 'ticket-1',
      itemId: 'item-1',
      dishName: 'Phở Bò',
      tableNo: 'Bàn 02',
      quantity: 1,
      variant: 'CANCEL_ITEM',
      reason: 'Khách hủy món',
      acknowledged: true,
      createdAt: '2026-11-28T10:00:00Z',
    };
    const mockTicket = {
      id: 'ticket-1',
      tableNo: 'Bàn 02',
      items: [],
      status: 'WAITING',
    } as unknown as Ticket;

    vi.mocked(fetchApi)
      .mockResolvedValueOnce(mockAlert)
      .mockResolvedValueOnce(mockTicket);

    const result = await service.acknowledgeOrderChange('alert-1', 'idem-1');

    expect(fetchApi).toHaveBeenNthCalledWith(1, '/kds/order-changes/alert-1/acknowledge', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': 'idem-1' },
    });
    expect(fetchApi).toHaveBeenNthCalledWith(2, '/kds/tickets/ticket-1');
    expect(result).toEqual({ alert: mockAlert, ticket: mockTicket });
  });

  it('deferOrderChange gọi POST /kds/order-changes/{id}/defer', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({});

    await service.deferOrderChange('alert-1');

    expect(fetchApi).toHaveBeenCalledWith('/kds/order-changes/alert-1/defer', {
      method: 'POST',
    });
  });
});
