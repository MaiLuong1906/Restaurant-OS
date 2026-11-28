import { describe, it, expect, beforeEach } from 'vitest';
import { StaffScheduleService, ApiFetcher } from '../staffScheduleService';
import { ApiError } from '../../lib/api-client';

interface RecordedCall {
  endpoint: string;
  options?: RequestInit;
}

describe('StaffScheduleService', () => {
  let calls: RecordedCall[];
  let nextResolver: (endpoint: string, options?: RequestInit) => Promise<unknown>;
  let service: StaffScheduleService;

  beforeEach(() => {
    calls = [];
    nextResolver = async () => undefined;

    const mockFetcher: ApiFetcher = async <T>(
      endpoint: string,
      options?: RequestInit
    ): Promise<T> => {
      calls.push({ endpoint, options });
      return (await nextResolver(endpoint, options)) as T;
    };

    service = new StaffScheduleService(mockFetcher);
  });

  it('listOpenShifts gọi REST API /staff/schedule/open-shifts và chuẩn hóa dữ liệu trả về', async () => {
    nextResolver = async () => [
      {
        id: '11111111-1111-4111-8111-111111111111',
        dateKey: '2026-11-06',
        startTime: '08:00:00',
        endTime: '14:00:00',
        role: 'WAITER',
        title: 'Ca sáng phục vụ',
        zone: 'Sảnh Tầng 1',
        slotsTotal: 3,
        slotsTaken: 1,
        postedById: '22222222-2222-4222-8222-222222222222',
      },
    ];

    const result = await service.listOpenShifts('2026-11-06');

    expect(calls).toHaveLength(1);
    expect(calls[0].endpoint).toBe('/staff/schedule/open-shifts?dateKey=2026-11-06');
    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe('08:00');
    expect(result[0].endTime).toBe('14:00');
    expect(result[0].slotsTotal).toBe(3);
  });

  it('listOpenShifts tự động fallback sang mock khi gặp NETWORK_ERROR (backend chưa bật)', async () => {
    nextResolver = async () => {
      throw new ApiError('NETWORK_ERROR', 'Failed to fetch', 0);
    };

    const result = await service.listOpenShifts('2026-11-06');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('registerShift gửi POST kèm Idempotency-Key và đồng bộ trạng thái PENDING vào lịch tuần', async () => {
    nextResolver = async () => ({
      id: '33333333-3333-4333-8333-333333333333',
      staffId: '00000000-0000-4000-8000-000000000001',
      openShiftId: '11111111-1111-4111-8111-111111111111',
      dateKey: '2026-11-06',
      status: 'REGISTERED',
      note: 'Làm ca sáng',
      idempotencyKey: 'idem-reg-999',
    });

    const reg = await service.registerShift({
      openShiftId: '11111111-1111-4111-8111-111111111111',
      dateKey: '2026-11-06',
      note: 'Làm ca sáng',
      idempotencyKey: 'idem-reg-999',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].endpoint).toBe('/staff/schedule/registrations');
    expect(calls[0].options?.method).toBe('POST');
    expect(calls[0].options?.headers).toEqual({ 'Idempotency-Key': 'idem-reg-999' });
    expect(reg.status).toBe('PENDING');
    expect(reg.idempotencyKey).toBe('idem-reg-999');

    const weekSchedule = await service.getWeekSchedule('2026-11-02');
    const targetDay = weekSchedule.days.find((d) => d.dateKey === '2026-11-06');
    expect(targetDay?.registrations.some((r) => r.id === reg.id)).toBe(true);
  });

  it('registerShift giữ nguyên lỗi nghiệp vụ từ backend (400 INVALID_ARGUMENT khi hết chỗ)', async () => {
    nextResolver = async () => {
      throw new ApiError('INVALID_ARGUMENT', 'Ca làm việc đã hết chỗ khả dụng', 400);
    };

    await expect(
      service.registerShift({
        openShiftId: '11111111-1111-4111-8111-111111111111',
        dateKey: '2026-11-06',
        idempotencyKey: 'idem-full-1',
      })
    ).rejects.toThrow('Ca làm việc đã hết chỗ khả dụng');
  });

  it('cancelRegistration gọi DELETE /staff/schedule/registrations/{id} và xóa bản ghi chờ duyệt', async () => {
    nextResolver = async () => undefined;

    const res = await service.cancelRegistration({
      registrationId: '33333333-3333-4333-8333-333333333333',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].endpoint).toBe(
      '/staff/schedule/registrations/33333333-3333-4333-8333-333333333333'
    );
    expect(calls[0].options?.method).toBe('DELETE');
    expect(res.ok).toBe(true);
  });

  it('createShiftSwap tạo yêu cầu đổi ca ở trạng thái PENDING_PEER với idempotencyKey', async () => {
    const peers = await service.listSwapPeers();
    expect(peers.length).toBeGreaterThan(0);

    const swap = await service.createShiftSwap({
      requesterShiftId: 'shift-1',
      peerId: peers[0].staffId,
      reason: 'Bận lịch học',
      idempotencyKey: 'idem-swap-fe-1',
    });

    expect(swap.status).toBe('PENDING_PEER');
    expect(swap.idempotencyKey).toBe('idem-swap-fe-1');
  });
});
