import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiKdsService } from '../ApiKdsService';
import { ApiError } from '../../../lib/api-client';
import { Ticket } from '../../../types';

describe('ApiKdsService UC18 (K5 - completeBatch)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('completeBatch gửi POST /kds/batches/complete với body {itemIds} + header X-Request-ID và trả về Ticket[]', async () => {
    const mockTickets: Ticket[] = [
      {
        id: 'ticket-1',
        tableId: 'table-1',
        tableNo: 'Bàn 01',
        status: 'READY',
        createdAt: '2026-11-25T10:00:00Z',
        items: [
          {
            id: 'item-1',
            orderId: 'ticket-1',
            dishId: 'dish-1',
            dishName: 'Cà Phê Muối',
            quantity: 1,
            unitPrice: 35000,
            modifiers: [],
            status: 'READY',
            createdAt: '2026-11-25T10:00:00Z',
          },
        ],
      },
      {
        id: 'ticket-2',
        tableId: 'table-2',
        tableNo: 'Bàn 02',
        status: 'WAITING',
        createdAt: '2026-11-25T10:02:00Z',
        items: [
          {
            id: 'item-2',
            orderId: 'ticket-2',
            dishId: 'dish-1',
            dishName: 'Cà Phê Muối',
            quantity: 1,
            unitPrice: 35000,
            modifiers: [],
            status: 'READY',
            createdAt: '2026-11-25T10:02:00Z',
          },
        ],
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockTickets }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const service = new ApiKdsService();
    const res = await service.completeBatch(['item-1', 'item-2'], 'req-batch-1');

    expect(res).toHaveLength(2);
    expect(res[0].id).toBe('ticket-1');
    expect(res[1].id).toBe('ticket-2');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/kds/batches/complete');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ itemIds: ['item-1', 'item-2'] });
    expect(options.headers['X-Request-ID']).toBe('req-batch-1');
  });

  it.each([
    {
      status: 409,
      code: 'CONFLICT',
      message: 'Không thể hoàn tất mẻ vì có món đã ở trạng thái REJECTED',
    },
    {
      status: 404,
      code: 'NOT_FOUND',
      message: 'Không tìm thấy một hoặc nhiều món trong mẻ nấu',
    },
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Danh sách món không được để trống',
    },
  ])('completeBatch ném ApiError đúng message và status khi BE trả $status', async ({ status, code, message }) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => ({
        success: false,
        message,
        error: { code, message },
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const service = new ApiKdsService();
    await expect(service.completeBatch(['item-1'], 'req-err')).rejects.toMatchObject({
      name: 'ApiError',
      status,
      code,
      message,
    } satisfies Partial<ApiError>);
  });

  it('completeBatch gửi cùng X-Request-ID khi gọi lại 2 lần', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const service = new ApiKdsService();
    await service.completeBatch(['item-1'], 'same-key-123');
    await service.completeBatch(['item-1'], 'same-key-123');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers['X-Request-ID']).toBe('same-key-123');
    expect(fetchMock.mock.calls[1][1].headers['X-Request-ID']).toBe('same-key-123');
  });
});
