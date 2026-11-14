import { Shift, Payslip, TipRecord } from '../../types';
import { MOCK_SHIFTS, MOCK_PAYSLIPS, MOCK_TIPS } from './data/staffMockData';
import { simulateLatency, deepClone, createNotFoundError, createValidationError } from './mockUtils';

export interface StaffService {
  getMySchedule(params?: { from?: string; to?: string }): Promise<Shift[]>;
  getPayslips(params?: { month?: string }): Promise<Payslip[]>;
  getPayslipById(payslipId: string): Promise<Payslip>;
  getTips(params?: { from?: string; to?: string }): Promise<TipRecord[]>;
}

export class MockStaffService implements StaffService {
  private shifts: Shift[];
  private payslips: Payslip[];
  private tips: TipRecord[];

  constructor() {
    this.shifts = deepClone(MOCK_SHIFTS as Shift[]);
    this.payslips = deepClone(MOCK_PAYSLIPS as Payslip[]);
    this.tips = deepClone(MOCK_TIPS as TipRecord[]);
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
}

export const staffService = new MockStaffService();
