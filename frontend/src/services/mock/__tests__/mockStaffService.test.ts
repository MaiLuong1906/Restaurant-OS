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
    expect(payslips.length).toBeGreaterThanOrEqual(3);

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

  it('xử lý lịch ca B6-B8: getWeekSchedule, getScheduleSummary, registerShift, cancelRegistration, createShiftSwap', async () => {
    const monday = '2026-11-02';
    const schedule = await service.getWeekSchedule(monday);
    expect(schedule.days).toHaveLength(7);
    expect(schedule.weekStartKey).toBe(monday);

    const summary = await service.getScheduleSummary(monday);
    expect(summary.shiftsThisWeek).toBeGreaterThanOrEqual(0);

    // Register shift: thành công tạo PENDING
    const openShifts = await service.listOpenShifts('2026-11-06');
    const available = openShifts.find((o) => o.slotsTaken < o.slotsTotal);
    if (available) {
      const regKey = 'idem-reg-1';
      const reg = await service.registerShift({
        openShiftId: available.id,
        dateKey: available.dateKey,
        idempotencyKey: regKey,
      });
      expect(reg.status).toBe('PENDING');

      // Replay idempotency
      const regReplay = await service.registerShift({
        openShiftId: available.id,
        dateKey: available.dateKey,
        idempotencyKey: regKey,
      });
      expect(regReplay.id).toBe(reg.id);

      // Hủy đăng ký ca PENDING
      const cancelRes = await service.cancelRegistration({ registrationId: reg.id });
      expect(cancelRes.ok).toBe(true);
    }

    // Đổi ca B8: tạo PENDING_PEER
    const peers = await service.listSwapPeers();
    expect(peers.length).toBeGreaterThan(0);
    const swap = await service.createShiftSwap({
      requesterShiftId: 'shift-1',
      peerId: peers[0].staffId,
      reason: 'Việc bận',
      idempotencyKey: 'idem-swap-test-1',
    });
    expect(swap.status).toBe('PENDING_PEER');
  });

  it('xử lý đơn xin nghỉ B9-B10: getLeaveBalance, getLeaveRequests, createLeaveRequest, withdrawLeaveRequest', async () => {
    const balance = await service.getLeaveBalance();
    expect(balance.totalDays).toBe(12);

    const initialRequests = await service.getLeaveRequests();
    expect(initialRequests.length).toBeGreaterThanOrEqual(1);

    // Gửi đơn xin nghỉ phép năm
    const idemKey = 'idem-leave-test-1';
    const newLeave = await service.createLeaveRequest({
      type: 'ANNUAL',
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      reason: 'Đi du lịch',
      idempotencyKey: idemKey,
    });
    expect(newLeave.status).toBe('PENDING');
    expect(newLeave.calendarDays).toBe(2);

    // Replay idempotency
    const leaveReplay = await service.createLeaveRequest({
      type: 'ANNUAL',
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      reason: 'Đi du lịch',
      idempotencyKey: idemKey,
    });
    expect(leaveReplay.id).toBe(newLeave.id);

    // Rút đơn PENDING
    const withdrawRes = await service.withdrawLeaveRequest({ id: newLeave.id });
    expect(withdrawRes.ok).toBe(true);

    // Không cho rút đơn đã rút hoặc không phải PENDING
    await expect(service.withdrawLeaveRequest({ id: newLeave.id })).rejects.toThrow();
  });

  it('xử lý phiếu lương & tip B11-B13: getPayslips, getTipMonths, formatVnd', async () => {
    const payslips = await service.getPayslips();
    expect(payslips.length).toBeGreaterThanOrEqual(3);

    const nov = payslips.find((p) => p.month === '2026-11');
    expect(nov).toBeDefined();
    expect(nov?.netSalary).toBe(4250000);
    expect(nov?.status).toBe('PROVISIONAL');

    const tipMonths = await service.getTipMonths();
    expect(tipMonths.length).toBeGreaterThanOrEqual(1);
    expect(tipMonths[0].totalAmount).toBe(320000);
    expect(tipMonths[0].paymentStatus).toBe('UNPAID');
    expect(tipMonths[0].dailyEntries?.length).toBe(4);
  });

  it('xử lý màn Cá nhân B14: getRecentAttendance, changePassword validation', async () => {
    const recent = await service.getRecentAttendance();
    expect(recent.length).toBe(3);
    expect(recent[0].methodLabel).toBe('Quét mặt');
    expect(recent[2].isLate).toBe(true);

    // Test change password validation
    await expect(
      service.changePassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
    ).rejects.toThrow();

    await expect(
      service.changePassword({ currentPassword: 'old', newPassword: '123', confirmPassword: '123' })
    ).rejects.toThrow();

    await expect(
      service.changePassword({ currentPassword: 'oldpass', newPassword: 'newpass', confirmPassword: 'wrong' })
    ).rejects.toThrow();

    const successRes = await service.changePassword({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(successRes.ok).toBe(true);
  });
});


