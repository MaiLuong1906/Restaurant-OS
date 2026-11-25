import { describe, it, expect, beforeEach } from 'vitest';
import { StaffLeavePayrollService, ApiFetcher } from '../staffLeavePayrollService';
import { ApiError } from '../../lib/api-client';

interface RecordedCall {
  endpoint: string;
  options?: RequestInit;
}

describe('StaffLeavePayrollService', () => {
  let calls: RecordedCall[];
  let nextResolver: (endpoint: string, options?: RequestInit) => Promise<unknown>;
  let service: StaffLeavePayrollService;

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

    service = new StaffLeavePayrollService(mockFetcher);
  });

  it('getLeaveBalance gọi GET /staff/leaves/balance và chuẩn hóa kết quả', async () => {
    nextResolver = async () => ({
      staffId: '00000000-0000-0000-0000-000000000021',
      totalDays: 12,
      usedDays: 4,
      remainingDays: 8,
      pendingRequestsCount: 1,
    });

    const balance = await service.getLeaveBalance();

    expect(calls).toHaveLength(1);
    expect(calls[0].endpoint).toContain('/staff/leaves/balance?staffId=');
    expect(balance.totalDays).toBe(12);
    expect(balance.remainingDays).toBe(8);
  });

  it('bảo toàn Empty State: trả về đúng mảng rỗng [] khi backend trả [] mà không ghi đè bằng mock', async () => {
    nextResolver = async () => [];

    const leaves = await service.getLeaveRequests();
    const payslips = await service.getPayslips();
    const tipMonths = await service.getTipMonths();
    const tips = await service.getTips();

    expect(leaves).toEqual([]);
    expect(payslips).toEqual([]);
    expect(tipMonths).toEqual([]);
    expect(tips).toEqual([]);
  });

  it('createLeaveRequest gửi POST /staff/leaves kèm header Idempotency-Key', async () => {
    nextResolver = async () => ({
      id: 'leave-uuid-1',
      staffId: '00000000-0000-0000-0000-000000000021',
      staffName: 'Nhân Viên Vận Hành',
      type: 'ANNUAL',
      startDate: '2026-11-16',
      endDate: '2026-11-17',
      reason: 'Về quê',
      status: 'PENDING',
      createdAt: '2026-11-05T08:00:00Z',
      calendarDays: 2,
      affectedShifts: 2,
      idempotencyKey: 'idem-leave-999',
    });

    const created = await service.createLeaveRequest({
      type: 'ANNUAL',
      startDate: '2026-11-16',
      endDate: '2026-11-17',
      reason: 'Về quê',
      idempotencyKey: 'idem-leave-999',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].endpoint).toBe('/staff/leaves');
    expect(calls[0].options?.method).toBe('POST');
    expect(calls[0].options?.headers).toEqual({ 'Idempotency-Key': 'idem-leave-999' });
    expect(created.status).toBe('PENDING');
    expect(created.calendarDays).toBe(2);
  });

  it('withdrawLeaveRequest gọi PATCH /staff/leaves/{id}/withdraw', async () => {
    nextResolver = async () => ({
      id: 'leave-uuid-1',
      status: 'CANCELLED',
    });

    const res = await service.withdrawLeaveRequest({ id: 'leave-uuid-1' });

    expect(calls).toHaveLength(1);
    expect(calls[0].endpoint).toBe('/staff/leaves/leave-uuid-1/withdraw');
    expect(calls[0].options?.method).toBe('PATCH');
    expect(res.ok).toBe(true);
  });

  it('getPayslips và getTipMonths trả về số tiền nguyên VND và tự động fallback sang mock khi NETWORK_ERROR', async () => {
    nextResolver = async () => {
      throw new ApiError('NETWORK_ERROR', 'Backend offline', 0);
    };

    const payslips = await service.getPayslips();
    expect(payslips.length).toBeGreaterThan(0);
    expect(Number.isInteger(payslips[0].netSalary)).toBe(true);

    const tipMonths = await service.getTipMonths();
    expect(tipMonths.length).toBeGreaterThan(0);
    expect(Number.isInteger(tipMonths[0].totalAmount)).toBe(true);
  });
});
