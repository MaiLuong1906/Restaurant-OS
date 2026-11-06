import { Shift, Payslip, TipRecord } from '../../../types';

export const MOCK_SHIFTS: readonly Shift[] = Object.freeze([
  {
    id: 'shift-1',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    role: 'STAFF',
    date: '2026-11-06',
    startTime: '08:00',
    endTime: '14:00',
    zone: 'Sảnh Tầng 1',
    status: 'IN_PROGRESS',
  },
  {
    id: 'shift-2',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    role: 'STAFF',
    date: '2026-11-07',
    startTime: '17:00',
    endTime: '22:00',
    zone: 'Sảnh Tầng 2',
    status: 'SCHEDULED',
  },
  {
    id: 'shift-3',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    role: 'STAFF',
    date: '2026-11-08',
    startTime: '08:00',
    endTime: '14:00',
    zone: 'Khu Sân Vườn',
    status: 'SCHEDULED',
  },
]);

export const MOCK_PAYSLIPS: readonly Payslip[] = Object.freeze([
  {
    id: 'ps-2026-11',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    month: '2026-11',
    baseSalary: 4000000,
    workedHours: 100,
    hourlyRate: 40000,
    allowance: 200000,
    bonus: 300000,
    tipAmount: 0,
    deductions: 250000, // bhxh 200k + advance 50k
    netSalary: 4250000, // 4tr + 200k + 300k - 250k = 4.25tr
  },
  {
    id: 'ps-2026-10',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    month: '2026-10',
    baseSalary: 4400000,
    workedHours: 110,
    hourlyRate: 40000,
    allowance: 400000,
    bonus: 500000,
    tipAmount: 0,
    deductions: 850000, // bhxh 350k + advance 500k
    netSalary: 4450000,
    paidAt: '2026-11-10T08:00:00.000Z',
  },
  {
    id: 'ps-2026-09',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    month: '2026-09',
    baseSalary: 4200000,
    workedHours: 105,
    hourlyRate: 40000,
    allowance: 350000,
    bonus: 400000,
    tipAmount: 0,
    deductions: 770000,
    netSalary: 4180000,
    paidAt: '2026-10-10T08:00:00.000Z',
  },
]);

export const MOCK_TIPS: readonly TipRecord[] = Object.freeze([
  {
    id: 'tip-1',
    staffId: 'staff-1',
    date: '2026-11-05',
    poolAmount: 380000,
    allocatedAmount: 95000,
    note: 'Ca sáng',
  },
  {
    id: 'tip-2',
    staffId: 'staff-1',
    date: '2026-11-04',
    poolAmount: 340000,
    allocatedAmount: 85000,
    note: 'Ca tối',
  },
  {
    id: 'tip-3',
    staffId: 'staff-1',
    date: '2026-11-03',
    poolAmount: 280000,
    allocatedAmount: 70000,
    note: 'Ca sáng',
  },
  {
    id: 'tip-4',
    staffId: 'staff-1',
    date: '2026-11-02',
    poolAmount: 280000,
    allocatedAmount: 70000,
    note: 'Ca sáng',
  },
]);

export const MOCK_LEAVE_BALANCE: import('../../../types').LeaveBalance = Object.freeze({
  staffId: 'staff-1',
  totalDays: 12,
  usedDays: 6,
  remainingDays: 6,
  pendingRequestsCount: 2,
});

export const MOCK_LEAVE_REQUESTS: readonly import('../../../types').LeaveRequest[] = Object.freeze([
  {
    id: 'leave-1',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    type: 'ANNUAL',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    reason: 'Việc gia đình',
    status: 'APPROVED',
    approvedBy: 'Quản lý Hoàng',
    createdAt: '2026-11-03T08:30:00.000Z',
  },
  {
    id: 'leave-2',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    type: 'ANNUAL',
    startDate: '2026-11-18',
    endDate: '2026-11-19',
    reason: 'Khám sức khỏe định kỳ',
    status: 'PENDING',
    createdAt: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'leave-3',
    staffId: 'staff-1',
    staffName: 'Nhân Viên Vận Hành',
    type: 'SICK',
    startDate: '2026-11-25',
    endDate: '2026-11-25',
    reason: 'Nghỉ ốm',
    status: 'PENDING',
    createdAt: '2026-11-05T14:15:00.000Z',
  },
]);
