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

  it('xử lý chấm công attendance: getTodayAttendance, verifyFaceScan, verifyAttendancePin, idempotency và chống trùng', async () => {
    const today = await service.getTodayAttendance();
    expect(today.shiftName).toBe('Ca sáng');
    expect(today.status).toBe('NOT_CHECKED_IN');

    // Test verifyAttendancePin
    const pinWrong = await service.verifyAttendancePin('9999');
    expect(pinWrong.ok).toBe(false);
    const pinRight = await service.verifyAttendancePin('1234');
    expect(pinRight.ok).toBe(true);

    // Test checkIn thành công
    const key = 'idem-checkin-1';
    const res = await service.checkIn({ method: 'FACE_SCAN', idempotencyKey: key });
    expect(res.kind).toBe('SUCCESS');
    expect(res.checkedInAt).toBe('07:58');

    // Test lặp lại cùng idempotencyKey trả về cùng snapshot
    const resRepeat = await service.checkIn({ method: 'FACE_SCAN', idempotencyKey: key });
    expect(resRepeat.kind).toBe('SUCCESS');

    // Test chống chấm trùng với idempotencyKey mới
    const resDup = await service.checkIn({ method: 'PIN', idempotencyKey: 'idem-checkin-2' });
    expect(resDup.kind).toBe('ALREADY_CHECKED_IN');
  });
});
