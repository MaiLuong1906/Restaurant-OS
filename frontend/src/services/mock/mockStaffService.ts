import {
  Shift,
  Payslip,
  TipRecord,
  LeaveBalance,
  LeaveRequest,
  TodayAttendance,
  CheckInRequest,
  CheckInResponse,
  AttendanceRecord,
  WeekSchedule,
  ScheduleSummary,
  OpenShift,
  ShiftRegistration,
  ShiftSwapRequest,
  RegisterShiftRequest,
  CancelRegistrationRequest,
  CreateShiftSwapRequest,
  SwapPeerCandidate,
  DaySchedule,
} from '../../types';
import {
  MOCK_SHIFTS,
  MOCK_PAYSLIPS,
  MOCK_TIPS,
  MOCK_LEAVE_BALANCE,
  MOCK_LEAVE_REQUESTS,
  MOCK_TODAY_ATTENDANCE,
  MOCK_OPEN_SHIFTS,
  MOCK_SHIFT_REGISTRATIONS,
  MOCK_SHIFT_SWAPS,
  MOCK_SWAP_PEERS,
} from './data/staffMockData';
import { simulateLatency, deepClone, createNotFoundError, createValidationError } from './mockUtils';
import {
  toDateKey,
  parseDateKey,
  addDays,
  getStartOfWeekMonday,
  formatVietnameseWeekday,
  formatVietnameseShortWeekday,
} from '../../lib/dateKey';

export interface StaffService {
  getMySchedule(params?: { from?: string; to?: string }): Promise<Shift[]>;
  getPayslips(params?: { month?: string }): Promise<Payslip[]>;
  getPayslipById(payslipId: string): Promise<Payslip>;
  getTips(params?: { from?: string; to?: string }): Promise<TipRecord[]>;
  getLeaveBalance(): Promise<LeaveBalance>;
  getLeaveRequests(): Promise<LeaveRequest[]>;
  getTodayAttendance(): Promise<TodayAttendance>;
  verifyFaceScan(idempotencyKey: string): Promise<CheckInResponse>;
  verifyAttendancePin(pin: string): Promise<{ ok: boolean }>;
  checkIn(req: CheckInRequest): Promise<CheckInResponse>;
  getWeekSchedule(weekStartKey?: string): Promise<WeekSchedule>;
  getScheduleSummary(weekStartKey?: string): Promise<ScheduleSummary>;
  listOpenShifts(dateKey?: string): Promise<OpenShift[]>;
  listSwapPeers(): Promise<SwapPeerCandidate[]>;
  registerShift(req: RegisterShiftRequest): Promise<ShiftRegistration>;
  cancelRegistration(req: CancelRegistrationRequest): Promise<{ ok: boolean }>;
  createShiftSwap(req: CreateShiftSwapRequest): Promise<ShiftSwapRequest>;
}

export class MockStaffService implements StaffService {
  private shifts: Shift[];
  private payslips: Payslip[];
  private tips: TipRecord[];
  private leaveBalance: LeaveBalance;
  private leaveRequests: LeaveRequest[];
  private todayAttendance: TodayAttendance;
  private attendanceRecords: AttendanceRecord[] = [];
  private openShifts: OpenShift[];
  private registrations: ShiftRegistration[];
  private swaps: ShiftSwapRequest[];
  private swapPeers: SwapPeerCandidate[];
  private processedKeys = new Set<string>();
  private mockAttendancePin = '1234';

  constructor() {
    this.shifts = deepClone(MOCK_SHIFTS as Shift[]);
    this.payslips = deepClone(MOCK_PAYSLIPS as Payslip[]);
    this.tips = deepClone(MOCK_TIPS as TipRecord[]);
    this.leaveBalance = deepClone(MOCK_LEAVE_BALANCE as LeaveBalance);
    this.leaveRequests = deepClone(MOCK_LEAVE_REQUESTS as LeaveRequest[]);
    this.todayAttendance = deepClone(MOCK_TODAY_ATTENDANCE as TodayAttendance);
    this.openShifts = deepClone(MOCK_OPEN_SHIFTS as OpenShift[]);
    this.registrations = deepClone(MOCK_SHIFT_REGISTRATIONS as ShiftRegistration[]);
    this.swaps = deepClone(MOCK_SHIFT_SWAPS as ShiftSwapRequest[]);
    this.swapPeers = deepClone(MOCK_SWAP_PEERS as SwapPeerCandidate[]);
  }

  async getMySchedule(params?: { from?: string; to?: string }): Promise<Shift[]> {
    await simulateLatency(150);
    let result = deepClone(this.shifts);

    if (params?.from && params?.to && params.from > params.to) {
      throw createValidationError('Ngày bắt đầu (from) không được lớn hơn ngày kết thúc (to)');
    }

    if (params?.from) {
      result = result.filter((s) => s.date >= params.from!);
    }
    if (params?.to) {
      result = result.filter((s) => s.date <= params.to!);
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getPayslips(params?: { month?: string }): Promise<Payslip[]> {
    await simulateLatency(150);
    let result = deepClone(this.payslips);

    if (params?.month) {
      result = result.filter((p) => p.month === params.month);
    }

    return result;
  }

  async getPayslipById(payslipId: string): Promise<Payslip> {
    await simulateLatency(100);
    const found = this.payslips.find((p) => p.id === payslipId);
    if (!found) {
      throw createNotFoundError('Payslip', payslipId);
    }
    return deepClone(found);
  }

  async getTips(params?: { from?: string; to?: string }): Promise<TipRecord[]> {
    await simulateLatency(150);
    let result = deepClone(this.tips);

    if (params?.from) {
      result = result.filter((t) => t.date >= params.from!);
    }
    if (params?.to) {
      result = result.filter((t) => t.date <= params.to!);
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getLeaveBalance(): Promise<LeaveBalance> {
    await simulateLatency(100);
    return deepClone(this.leaveBalance);
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    await simulateLatency(120);
    return deepClone(this.leaveRequests);
  }

  async getTodayAttendance(): Promise<TodayAttendance> {
    await simulateLatency(80);
    return deepClone(this.todayAttendance);
  }

  async verifyAttendancePin(pin: string): Promise<{ ok: boolean }> {
    await simulateLatency(120);
    if (!pin || pin.length !== 4) {
      return { ok: false };
    }
    return { ok: pin === this.mockAttendancePin };
  }

  async verifyFaceScan(idempotencyKey: string): Promise<CheckInResponse> {
    await simulateLatency(300);
    return this.checkIn({ method: 'FACE_SCAN', idempotencyKey });
  }

  async checkIn(req: CheckInRequest): Promise<CheckInResponse> {
    if (!req.idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }

    if (this.processedKeys.has(req.idempotencyKey)) {
      return {
        kind: 'SUCCESS',
        checkedInAt: this.todayAttendance.checkedInAt || '07:58',
        method: req.method,
      };
    }
    this.processedKeys.add(req.idempotencyKey);

    await simulateLatency(150);

    if (this.todayAttendance.status === 'CHECKED_IN') {
      return {
        kind: 'ALREADY_CHECKED_IN',
        checkedInAt: this.todayAttendance.checkedInAt || '07:58',
        method: this.todayAttendance.method,
        message: 'Bạn đã vào ca trước đó',
      };
    }

    const checkInTime = '07:58';
    this.todayAttendance.status = 'CHECKED_IN';
    this.todayAttendance.checkedInAt = checkInTime;
    this.todayAttendance.method = req.method;

    this.attendanceRecords.push({
      id: `att-${Date.now()}`,
      staffId: 'staff-1',
      shiftId: 'shift-1',
      date: this.todayAttendance.date,
      checkInTime,
      method: req.method,
      isLate: false,
      lateMinutes: 0,
    });

    return {
      kind: 'SUCCESS',
      checkedInAt: checkInTime,
      method: req.method,
    };
  }

  async getWeekSchedule(weekStartKey?: string): Promise<WeekSchedule> {
    await simulateLatency(120);
    const startKey = weekStartKey || getStartOfWeekMonday(new Date());
    const days: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const dateKey = addDays(startKey, i);
      const dateObj = parseDateKey(dateKey);
      const myShifts = this.shifts.filter((s) => s.date === dateKey);
      const openShifts = this.openShifts.filter((o) => o.dateKey === dateKey);
      const regs = this.registrations.filter((r) => r.dateKey === dateKey);
      const swaps = this.swaps.filter((sw) => sw.dateKey === dateKey);

      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');

      days.push({
        dateKey,
        weekdayLabel: formatVietnameseShortWeekday(dateObj),
        fullDateLabel: `${formatVietnameseWeekday(dateObj)}, ${d}/${m}`,
        dayNumber: dateObj.getDate(),
        myShifts,
        openShifts,
        registrations: regs,
        swaps,
      });
    }

    const firstDate = parseDateKey(startKey);
    const lastDate = parseDateKey(days[6].dateKey);
    const fD = String(firstDate.getDate()).padStart(2, '0');
    const fM = String(firstDate.getMonth() + 1).padStart(2, '0');
    const lD = String(lastDate.getDate()).padStart(2, '0');
    const lM = String(lastDate.getMonth() + 1).padStart(2, '0');
    const y = lastDate.getFullYear();

    return {
      weekStartKey: startKey,
      weekEndKey: days[6].dateKey,
      weekLabel: `Tuần ${fD}/${fM} – ${lD}/${lM}/${y}`,
      days,
    };
  }

  async getScheduleSummary(weekStartKey?: string): Promise<ScheduleSummary> {
    await simulateLatency(80);
    const startKey = weekStartKey || getStartOfWeekMonday(new Date());
    const endKey = addDays(startKey, 6);

    const weekShifts = this.shifts.filter((s) => s.date >= startKey && s.date <= endKey);
    let hoursThisWeek = 0;
    for (const s of weekShifts) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      hoursThisWeek += eh - sh + (em - sm) / 60;
    }

    const openShiftsThisWeek = this.openShifts.filter(
      (o) => o.dateKey >= startKey && o.dateKey <= endKey && o.slotsTaken < o.slotsTotal
    ).length;

    const pendingRegistrations = this.registrations.filter(
      (r) => r.dateKey >= startKey && r.dateKey <= endKey && r.status === 'PENDING'
    ).length;

    const pendingSwaps = this.swaps.filter(
      (sw) =>
        sw.dateKey >= startKey &&
        sw.dateKey <= endKey &&
        (sw.status === 'PENDING_PEER' || sw.status === 'PENDING_MANAGER')
    ).length;

    return {
      shiftsThisWeek: weekShifts.length,
      hoursThisWeek: Math.round(hoursThisWeek),
      pendingRegistrations,
      pendingSwaps,
      openShiftsThisWeek,
    };
  }

  async listOpenShifts(dateKey?: string): Promise<OpenShift[]> {
    await simulateLatency(80);
    if (dateKey) {
      return deepClone(this.openShifts.filter((o) => o.dateKey === dateKey));
    }
    return deepClone(this.openShifts);
  }

  async listSwapPeers(): Promise<SwapPeerCandidate[]> {
    await simulateLatency(60);
    return deepClone(this.swapPeers);
  }

  async registerShift(req: RegisterShiftRequest): Promise<ShiftRegistration> {
    if (!req.idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }

    const existing = this.registrations.find((r) => r.idempotencyKey === req.idempotencyKey);
    if (existing) {
      return deepClone(existing);
    }

    await simulateLatency(150);

    const open = this.openShifts.find((o) => o.id === req.openShiftId);
    if (!open) {
      throw createNotFoundError('OpenShift', req.openShiftId);
    }

    if (open.slotsTaken >= open.slotsTotal) {
      throw createValidationError('Ca trống này đã đủ số lượng người đăng ký');
    }

    // Check overlap với ca hiện tại của mình
    const myOverlap = this.shifts.find(
      (s) => s.date === req.dateKey && s.startTime === open.startTime
    );
    if (myOverlap) {
      throw createValidationError('Bạn đã có ca làm việc trùng khung giờ này');
    }

    open.slotsTaken += 1;

    const newReg: ShiftRegistration = {
      id: `reg-${Date.now()}`,
      staffId: 'staff-1',
      openShiftId: req.openShiftId,
      dateKey: req.dateKey,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      idempotencyKey: req.idempotencyKey,
      note: req.note,
    };

    this.registrations.push(newReg);
    return deepClone(newReg);
  }

  async cancelRegistration(req: CancelRegistrationRequest): Promise<{ ok: boolean }> {
    await simulateLatency(120);
    const reg = this.registrations.find((r) => r.id === req.registrationId);
    if (!reg) {
      throw createNotFoundError('ShiftRegistration', req.registrationId);
    }

    if (reg.status !== 'PENDING') {
      throw createValidationError('Chỉ có thể hủy đăng ký ca khi đang ở trạng thái Chờ duyệt');
    }

    reg.status = 'CANCELLED';

    // Trả lại slot cho openShift
    const open = this.openShifts.find((o) => o.id === reg.openShiftId);
    if (open && open.slotsTaken > 0) {
      open.slotsTaken -= 1;
    }

    return { ok: true };
  }

  async createShiftSwap(req: CreateShiftSwapRequest): Promise<ShiftSwapRequest> {
    if (!req.idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }

    const existing = this.swaps.find((s) => s.idempotencyKey === req.idempotencyKey);
    if (existing) {
      return deepClone(existing);
    }

    await simulateLatency(150);

    const ownShift = this.shifts.find((s) => s.id === req.requesterShiftId);
    if (!ownShift) {
      throw createNotFoundError('Shift', req.requesterShiftId);
    }

    const peer = this.swapPeers.find((p) => p.staffId === req.peerId);
    if (!peer) {
      throw createNotFoundError('SwapPeer', req.peerId);
    }

    const newSwap: ShiftSwapRequest = {
      id: `swap-${Date.now()}`,
      requesterId: 'staff-1',
      requesterShiftId: req.requesterShiftId,
      peerId: req.peerId,
      peerShiftId: req.peerShiftId,
      dateKey: ownShift.date,
      reason: req.reason,
      status: 'PENDING_PEER', // Luôn bắt đầu từ chờ người nhận xác nhận
      createdAt: new Date().toISOString(),
      idempotencyKey: req.idempotencyKey,
    };

    this.swaps.push(newSwap);
    return deepClone(newSwap);
  }
}

export const staffService = new MockStaffService();
