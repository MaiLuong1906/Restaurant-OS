import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKdsService } from '../ApiKdsService';
import { fetchApi } from '../../../lib/api-client';

vi.mock('../../../lib/api-client', () => ({
  fetchApi: vi.fn(),
}));

describe('ApiKdsService — Case 4 Dish Availability (Sold-Out / Reopen)', () => {
  let service: ApiKdsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ApiKdsService();
  });

  it('listDishAvailability gọi 2 lần GET /dishes?isAvailable=true và false rồi gộp cả AVAILABLE lẫn SOLD_OUT', async () => {
    vi.mocked(fetchApi)
      .mockResolvedValueOnce([
        { id: 'dish-1', name: 'Phở Bò', category: 'Món chính', isAvailable: true },
      ])
      .mockResolvedValueOnce([
        { id: 'dish-2', name: 'Bún Chả', category: 'Món chính', isAvailable: false, soldOutReason: 'Hết thịt' },
      ]);

    const list = await service.listDishAvailability();

    expect(fetchApi).toHaveBeenCalledWith('/dishes?isAvailable=true');
    expect(fetchApi).toHaveBeenCalledWith('/dishes?isAvailable=false');
    expect(list).toEqual([
      { dishId: 'dish-1', dishName: 'Phở Bò', status: 'AVAILABLE', remainingPortions: 1, waitingTables: [] },
      { dishId: 'dish-2', dishName: 'Bún Chả', status: 'SOLD_OUT', remainingPortions: 0, waitingTables: [] },
    ]);
  });

  it('markSoldOut thành công gọi PATCH /dishes/{id}/availability và trả về SOLD_OUT', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({
      id: 'dish-1',
      name: 'Phở Bò',
      category: 'Món chính',
      isAvailable: false,
      soldOutReason: 'Bếp báo hết món',
    });

    const updated = await service.markSoldOut('dish-1', 'idem-sold-1');

    expect(fetchApi).toHaveBeenCalledWith('/dishes/dish-1/availability', {
      method: 'PATCH',
      headers: { 'X-Idempotency-Key': 'idem-sold-1' },
      body: JSON.stringify({ isAvailable: false, soldOutReason: 'Bếp báo hết món' }),
    });
    expect(updated.status).toBe('SOLD_OUT');
    expect(updated.remainingPortions).toBe(0);
  });

  it('markSoldOut ném lỗi khi BE từ chối để UI rollback về trạng thái cũ', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('403 Forbidden'));

    await expect(service.markSoldOut('dish-1', 'idem-sold-err')).rejects.toThrow('403 Forbidden');
  });

  it('reopenDish gọi PATCH /dishes/{id}/availability với isAvailable=true và trả về AVAILABLE', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({
      id: 'dish-1',
      name: 'Phở Bò',
      category: 'Món chính',
      isAvailable: true,
      soldOutReason: null,
    });

    const updated = await service.reopenDish('dish-1', 10, 'idem-reopen-1');

    expect(fetchApi).toHaveBeenCalledWith('/dishes/dish-1/availability', {
      method: 'PATCH',
      headers: { 'X-Idempotency-Key': 'idem-reopen-1' },
      body: JSON.stringify({ isAvailable: true, soldOutReason: null }),
    });
    expect(updated.status).toBe('AVAILABLE');
    expect(updated.remainingPortions).toBe(10);
  });
});
