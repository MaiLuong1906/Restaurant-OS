import {
  LeaveBalance,
  LeaveRequest,
  CreateLeaveRequest,
  WithdrawLeaveRequest,
  Payslip,
  TipRecord,
  TipMonthSummary,
} from '../types';
import { fetchApi, ApiError } from '../lib/api-client';
import { generateIdempotencyKey } from '../lib/utils';
import { useAuthStore } from '../stores/useAuthStore';
import { staffService as mockStaffService } from './mock/mockStaffService';

const DEFAULT_LOCAL_STAFF_UUID = '00000000-0000-4000-8000-000000000001';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ApiFetcher = <T>(endpoint: string, options?: RequestInit) => Promise<T>;

function resolveCurrentStaffUuid(): string {
  const userId = useAuthStore.getState().staffUser?.id;
  if (userId && UUID_REGEX.test(userId)) {
    return userId;
  }
  return DEFAULT_LOCAL_STAFF_UUID;
}

function resolveCurrentStaffName(): string {
  return useAuthStore.getState().staffUser?.fullName || 'Nhân Viên Vận Hành';
}

export class StaffLeavePayrollService {
  private fetcher: ApiFetcher;

  constructor(fetcher: ApiFetcher = fetchApi) {
    this.fetcher = fetcher;
  }

  // ====================================================================
  // UC_STF_04: Đơn xin nghỉ phép (B9 & B10)
  // ====================================================================

  async getLeaveBalance(): Promise<LeaveBalance> {
    const staffId = resolveCurrentStaffUuid();
    try {
      const data = await this.fetcher<LeaveBalance>(
        `/staff/leaves/balance?staffId=${encodeURIComponent(staffId)}`
      );
      return {
        staffId: String(data.staffId || staffId),
        totalDays: Number(data.totalDays ?? 12),
        usedDays: Number(data.usedDays ?? 0),
        remainingDays: Number(data.remainingDays ?? 12),
        pendingRequestsCount: Number(data.pendingRequestsCount ?? 0),
      };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.getLeaveBalance();
      }
      throw error;
    }
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const staffId = resolveCurrentStaffUuid();
    try {
      const data = await this.fetcher<LeaveRequest[]>(
        `/staff/leaves?staffId=${encodeURIComponent(staffId)}`
      );
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return mockStaffService.getLeaveRequests();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.getLeaveRequests();
      }
      throw error;
    }
  }

  async createLeaveRequest(req: CreateLeaveRequest): Promise<LeaveRequest> {
    const idempotencyKey = req.idempotencyKey || generateIdempotencyKey();
    const staffId = resolveCurrentStaffUuid();
    const staffName = resolveCurrentStaffName();

    try {
      return await this.fetcher<LeaveRequest>('/staff/leaves', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          staffId,
          staffName,
          type: req.type,
          startDate: req.startDate,
          endDate: req.endDate,
          reason: req.reason,
          idempotencyKey,
        }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.createLeaveRequest({
          ...req,
          idempotencyKey,
        });
      }
      throw error;
    }
  }

  async withdrawLeaveRequest(req: WithdrawLeaveRequest): Promise<{ ok: boolean }> {
    try {
      await this.fetcher<LeaveRequest>(
        `/staff/leaves/${encodeURIComponent(req.id)}/withdraw`,
        {
          method: 'PATCH',
        }
      );
      try {
        await mockStaffService.withdrawLeaveRequest(req);
      } catch {
        // Ignore if record only existed on backend
      }
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.withdrawLeaveRequest(req);
      }
      throw error;
    }
  }

  // ====================================================================
  // UC_STF_05: Phiếu lương & Tip (B11, B12, B13) - Tiền tệ 100% integer VND
  // ====================================================================

  async getPayslips(params?: { month?: string }): Promise<Payslip[]> {
    const staffId = resolveCurrentStaffUuid();
    const query = new URLSearchParams({ staffId });
    if (params?.month) {
      query.set('month', params.month);
    }

    try {
      const data = await this.fetcher<Payslip[]>(`/staff/payroll/payslips?${query.toString()}`);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return mockStaffService.getPayslips(params);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.getPayslips(params);
      }
      throw error;
    }
  }

  async getPayslipById(payslipId: string): Promise<Payslip> {
    try {
      return await this.fetcher<Payslip>(
        `/staff/payroll/payslips/${encodeURIComponent(payslipId)}`
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.getPayslipById(payslipId);
      }
      throw error;
    }
  }

  async getTipMonths(): Promise<TipMonthSummary[]> {
    const staffId = resolveCurrentStaffUuid();
    try {
      const data = await this.fetcher<TipMonthSummary[]>(
        `/staff/payroll/tips/months?staffId=${encodeURIComponent(staffId)}`
      );
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return mockStaffService.getTipMonths();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.getTipMonths();
      }
      throw error;
    }
  }

  async getTips(params?: { from?: string; to?: string }): Promise<TipRecord[]> {
    const staffId = resolveCurrentStaffUuid();
    const query = new URLSearchParams({ staffId });
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    try {
      const data = await this.fetcher<TipRecord[]>(`/staff/payroll/tips?${query.toString()}`);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return mockStaffService.getTips(params);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.getTips(params);
      }
      throw error;
    }
  }
}

export const staffLeavePayrollService = new StaffLeavePayrollService();
