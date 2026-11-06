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
} from '../../types';
import {
  MOCK_SHIFTS,
  MOCK_PAYSLIPS,
  MOCK_TIPS,
  MOCK_LEAVE_BALANCE,
  MOCK_LEAVE_REQUESTS,
  MOCK_TODAY_ATTENDANCE,
} from './data/staffMockData';
import { simulateLatency, deepClone, createNotFoundError, createValidationError } from './mockUtils';

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
}

export class MockStaffService implements StaffService {
  private shifts: Shift[];
  private payslips: Payslip[];
  private tips: TipRecord[];
  private leaveBalance: LeaveBalance;
  private leaveRequests: LeaveRequest[];
  private todayAttendance: TodayAttendance;
  private attendanceRecords: AttendanceRecord[] = [];
  private processedKeys = new Set<string>();
  private mockAttendancePin = '1234';

  constructor() {
    this.shifts = deepClone(MOCK_SHIFTS as Shift[]);
    this.payslips = deepClone(MOCK_PAYSLIPS as Payslip[]);
    this.tips = deepClone(MOCK_TIPS as TipRecord[]);
    this.leaveBalance = deepClone(MOCK_LEAVE_BALANCE as LeaveBalance);
    this.leaveRequests = deepClone(MOCK_LEAVE_REQUESTS as LeaveRequest[]);
    this.todayAttendance = deepClone(MOCK_TODAY_ATTENDANCE as TodayAttendance);
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
}

export const staffService = new MockStaffService();
