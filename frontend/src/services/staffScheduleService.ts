import {
  OpenShift,
  Shift,
  ShiftRegistration,
  ShiftSwapRequest,
  SwapPeerCandidate,
  RegisterShiftRequest,
  CancelRegistrationRequest,
  CreateShiftSwapRequest,
  WeekSchedule,
  ScheduleSummary,
} from '@/types';
import { fetchApi, ApiError } from '@/lib/api-client';
import { generateIdempotencyKey } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { staffService as mockStaffService } from '@/services/mock/mockStaffService';

const DEFAULT_LOCAL_STAFF_UUID = '00000000-0000-4000-8000-000000000001';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveCurrentStaffUuid(): string {
  const userId = useAuthStore.getState().staffUser?.id;
  if (userId && UUID_REGEX.test(userId)) {
    return userId;
  }
  return DEFAULT_LOCAL_STAFF_UUID;
}

function normalizeOpenShift(raw: Partial<OpenShift> & { id: string; dateKey: string }): OpenShift {
  return {
    id: String(raw.id),
    dateKey: String(raw.dateKey),
    startTime: raw.startTime ? String(raw.startTime).slice(0, 5) : '08:00',
    endTime: raw.endTime ? String(raw.endTime).slice(0, 5) : '14:00',
    role: raw.role || 'WAITER',
    title: raw.title || 'Ca mở',
    zone: raw.zone || 'Sảnh chính',
    slotsTotal: Number(raw.slotsTotal ?? 1),
    slotsTaken: Number(raw.slotsTaken ?? 0),
    postedById: String(raw.postedById || DEFAULT_LOCAL_STAFF_UUID),
    postedAt: raw.postedAt || new Date().toISOString(),
    note: raw.note,
  };
}

function normalizeRegistration(
  raw: Partial<ShiftRegistration> & { id: string; openShiftId: string; dateKey: string },
  fallbackIdempotencyKey: string
): ShiftRegistration {
  const rawStatus = String(raw.status || 'PENDING').toUpperCase();
  const normalizedStatus =
    rawStatus === 'REGISTERED' || rawStatus === 'PENDING'
      ? 'PENDING'
      : rawStatus === 'APPROVED'
        ? 'APPROVED'
        : rawStatus === 'REJECTED'
          ? 'REJECTED'
          : 'CANCELLED';

  return {
    id: String(raw.id),
    staffId: String(raw.staffId || resolveCurrentStaffUuid()),
    openShiftId: String(raw.openShiftId),
    dateKey: String(raw.dateKey),
    status: normalizedStatus,
    createdAt: raw.createdAt || new Date().toISOString(),
    idempotencyKey: raw.idempotencyKey || fallbackIdempotencyKey,
    note: raw.note,
  };
}

export class StaffScheduleService {
  private localBackendRegistrations = new Map<string, ShiftRegistration>();

  async getWeekSchedule(weekStartKey?: string): Promise<WeekSchedule> {
    const baseSchedule = await mockStaffService.getWeekSchedule(weekStartKey);

    if (this.localBackendRegistrations.size === 0) {
      return baseSchedule;
    }

    return {
      ...baseSchedule,
      days: baseSchedule.days.map((day) => {
        const extraRegs = Array.from(this.localBackendRegistrations.values()).filter(
          (r) =>
            r.dateKey === day.dateKey &&
            r.status !== 'CANCELLED' &&
            !day.registrations.some((existing) => existing.id === r.id)
        );
        return {
          ...day,
          registrations: [...day.registrations, ...extraRegs],
        };
      }),
    };
  }

  async getScheduleSummary(weekStartKey?: string): Promise<ScheduleSummary> {
    const summary = await mockStaffService.getScheduleSummary(weekStartKey);
    const activeExtraCount = Array.from(this.localBackendRegistrations.values()).filter(
      (r) => r.status === 'PENDING'
    ).length;

    return {
      ...summary,
      pendingRegistrations: summary.pendingRegistrations + activeExtraCount,
    };
  }

  async getMySchedule(params?: { from?: string; to?: string }): Promise<Shift[]> {
    return mockStaffService.getMySchedule(params);
  }

  async listOpenShifts(dateKey?: string): Promise<OpenShift[]> {
    if (!dateKey) {
      return mockStaffService.listOpenShifts();
    }

    try {
      const data = await fetchApi<OpenShift[]>(
        `/staff/schedule/open-shifts?dateKey=${encodeURIComponent(dateKey)}`
      );
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => normalizeOpenShift(item));
      }
      // Fallback sang dữ liệu ca mẫu khi DB local chưa seed ca mở cho ngày này
      return mockStaffService.listOpenShifts(dateKey);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.listOpenShifts(dateKey);
      }
      throw error;
    }
  }

  async registerShift(req: RegisterShiftRequest): Promise<ShiftRegistration> {
    const idempotencyKey = req.idempotencyKey || generateIdempotencyKey();
    const staffId = resolveCurrentStaffUuid();

    try {
      const data = await fetchApi<ShiftRegistration>('/staff/schedule/registrations', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          staffId,
          openShiftId: req.openShiftId,
          dateKey: req.dateKey,
          status: 'PENDING',
          note: req.note,
          idempotencyKey,
        }),
      });

      const normalized = normalizeRegistration(data, idempotencyKey);
      this.localBackendRegistrations.set(normalized.id, normalized);
      return normalized;
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return mockStaffService.registerShift({
          ...req,
          idempotencyKey,
        });
      }
      throw error;
    }
  }

  async cancelRegistration(req: CancelRegistrationRequest): Promise<{ ok: boolean }> {
    try {
      await fetchApi<void>(
        `/staff/schedule/registrations/${encodeURIComponent(req.registrationId)}`,
        {
          method: 'DELETE',
        }
      );
      this.localBackendRegistrations.delete(req.registrationId);
      try {
        await mockStaffService.cancelRegistration(req);
      } catch {
        // Ignore if registration only existed on backend
      }
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        this.localBackendRegistrations.delete(req.registrationId);
        return mockStaffService.cancelRegistration(req);
      }
      throw error;
    }
  }

  async listSwapPeers(): Promise<SwapPeerCandidate[]> {
    return mockStaffService.listSwapPeers();
  }

  async createShiftSwap(req: CreateShiftSwapRequest): Promise<ShiftSwapRequest> {
    const idempotencyKey = req.idempotencyKey || generateIdempotencyKey();
    return mockStaffService.createShiftSwap({
      ...req,
      idempotencyKey,
    });
  }
}

export const staffScheduleService = new StaffScheduleService();
