import { describe, it, expect, beforeEach } from 'vitest';
import { MockStaffService } from '../mockStaffService';

describe('MockStaffService', () => {
  let service: MockStaffService;

  beforeEach(() => {
    service = new MockStaffService();
  });

  it('phải trả về danh sách ca làm việc được sắp xếp theo ngày', async () => {
    const shifts = await service.getMySchedule();
    expect(shifts.length).toBeGreaterThan(0);
    expect(shifts[0].date <= shifts[1].date).toBe(true);
  });

  it('phải tính toán số tiền lương là số nguyên VND và công thức netSalary chính xác', async () => {
    const payslips = await service.getPayslips();
    expect(payslips.length).toBe(3);

    payslips.forEach((p) => {
      expect(Number.isInteger(p.baseSalary)).toBe(true);
      expect(Number.isInteger(p.netSalary)).toBe(true);

      const calculatedNet = p.baseSalary + p.allowance + p.bonus + p.tipAmount - p.deductions;
      expect(p.netSalary).toBe(calculatedNet);
    });
  });

  it('ném lỗi 404 nếu không tìm thấy payslip ID', async () => {
    await expect(service.getPayslipById('ps-not-exist')).rejects.toThrow();
  });
});
