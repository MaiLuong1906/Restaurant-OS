import { OpenShift, ShiftRegistration, ShiftSwapRequest, SwapPeerCandidate, RegisterShiftRequest, CancelRegistrationRequest, CreateShiftSwapRequest } from '@/types';

const API_BASE = '/api/v1/staff/schedule';

export const staffService = {
  async listOpenShifts(dateKey: string): Promise<OpenShift[]> {
    const res = await fetch(`${API_BASE}/open-shifts?dateKey=${encodeURIComponent(dateKey)}`);
    if (!res.ok) throw new Error('Failed to fetch open shifts');
    const data = await res.json();
    return data.data as OpenShift[];
  },
  async registerShift(req: RegisterShiftRequest): Promise<ShiftRegistration> {
    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to register shift');
    const data = await res.json();
    return data.data as ShiftRegistration;
  },
  async cancelRegistration(req: CancelRegistrationRequest): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/registrations/${encodeURIComponent(req.registrationId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to cancel registration');
    const data = await res.json();
    return { ok: data.success };
  },
  async listSwapPeers(): Promise<SwapPeerCandidate[]> {
    const res = await fetch(`${API_BASE}/swap-peers`);
    if (!res.ok) throw new Error('Failed to fetch swap peers');
    const data = await res.json();
    return data.data as SwapPeerCandidate[];
  },
  async createShiftSwap(req: CreateShiftSwapRequest): Promise<ShiftSwapRequest> {
    const res = await fetch(`${API_BASE}/swap-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to create shift swap');
    const data = await res.json();
    return data.data as ShiftSwapRequest;
  },
  // Existing methods kept for compatibility
  async getWeekSchedule(weekStartKey?: string) {
    // Implement real call or fallback to mock if needed
    const res = await fetch(`/api/v1/staff/schedule/week?weekStart=${encodeURIComponent(weekStartKey || '')}`);
    const data = await res.json();
    return data.data;
  },
  async getScheduleSummary(weekStartKey?: string) {
    const res = await fetch(`/api/v1/staff/schedule/summary?weekStart=${encodeURIComponent(weekStartKey || '')}`);
    const data = await res.json();
    return data.data;
  },
  async getMySchedule(params?: { from?: string; to?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/v1/staff/shifts?${query}`);
    const data = await res.json();
    return data.data;
  },
};
