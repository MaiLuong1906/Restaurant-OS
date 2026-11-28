import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchApi } from '../api-client';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCartStore } from '../../stores/useCartStore';

describe('fetchApi & Table Token injection test suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
    useCartStore.getState().setTable('', '', null);
  });

  it('attaches X-Table-Token header for customer orders when tableToken exists in store', async () => {
    useCartStore.getState().setTable('00000000-0000-0000-0000-000000000001', 'Bàn 01', 'token-table-qr-01');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 'order-1' } }),
    } as Response);

    await fetchApi('/orders', { method: 'POST', body: JSON.stringify({ items: [] }) });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(calledHeaders['X-Table-Token']).toBe('token-table-qr-01');
  });

  it('does NOT leak X-Table-Token into staff or admin endpoints even if tableToken exists', async () => {
    useCartStore.getState().setTable('00000000-0000-0000-0000-000000000001', 'Bàn 01', 'token-table-qr-01');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    await fetchApi('/admin/dishes');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(calledHeaders['X-Table-Token']).toBeUndefined();
  });

  it('throws ApiError with appropriate status and code when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy bàn' },
      }),
    } as Response);

    await expect(fetchApi('/tables/not-found')).rejects.toThrow('Không tìm thấy bàn');
  });
});
