import { describe, it, expect } from 'vitest';

// ============================================================================
// Pure payroll logic — mirrors payroll/page.tsx inline calculations
// ============================================================================

type Dept = 'BOH' | 'FOH' | 'Cashier';

interface StaffPayroll {
  id: string;
  name: string;
  role: string;
  dept: Dept;
  baseSalary: number;
  hours: number;
  otHours: number;
  bonus: number;
  status: string;
}

/**
 * Tính phân bổ Tip cho một nhân viên dựa theo phòng ban.
 * Quy tắc 40/45/15: BOH nhận 40%, FOH 45%, Cashier 15% tổng quỹ tip.
 * tipShare mỗi nhân viên = Math.round(deptPool / deptCount) — theo code page.tsx
 * dùng bohTipPool/2, fohTipPool/2 (hardcoded /2 trong mock data)
 */
function calcDeptPools(tipPoolTotal: number) {
  return {
    bohTipPool: Math.round(tipPoolTotal * 0.4),
    fohTipPool: Math.round(tipPoolTotal * 0.45),
    cashierTipPool: Math.round(tipPoolTotal * 0.15),
  };
}

function calcTipShare(dept: Dept, tipPoolTotal: number): number {
  const { bohTipPool, fohTipPool, cashierTipPool } = calcDeptPools(tipPoolTotal);
  if (dept === 'BOH') return Math.round(bohTipPool / 2);
  if (dept === 'FOH') return Math.round(fohTipPool / 2);
  return cashierTipPool;
}

function calcTotalNet(staff: StaffPayroll, tipPoolTotal: number): number {
  const tipShare = calcTipShare(staff.dept, tipPoolTotal);
  return staff.baseSalary + tipShare + staff.bonus + staff.otHours * 150000;
}

// ============================================================================
// Test data — subset của INITIAL_STAFF_PAYROLL từ adminMockData.ts
// ============================================================================
const TIP_POOL_TOTAL = 18450000;

const EMP_TUAN: StaffPayroll = {
  id: 'EMP-001',
  name: 'Nguyễn Văn Tuấn',
  role: 'Bếp Trưởng',
  dept: 'BOH',
  baseSalary: 15000000,
  hours: 192,
  otHours: 16,
  bonus: 1500000,
  status: 'SẴN SÀNG',
};

const EMP_AN: StaffPayroll = {
  id: 'EMP-002',
  name: 'Lê Văn An',
  role: 'Phụ Bếp',
  dept: 'BOH',
  baseSalary: 9500000,
  hours: 184,
  otHours: 8,
  bonus: 0,
  status: 'SẴN SÀNG',
};

const EMP_HOA: StaffPayroll = {
  id: 'EMP-005',
  name: 'Mai Thị Hoa',
  role: 'Phục Vụ Lead',
  dept: 'FOH',
  baseSalary: 8500000,
  hours: 176,
  otHours: 12,
  bonus: 300000,
  status: 'SẴN SÀNG',
};

const EMP_LINH: StaffPayroll = {
  id: 'EMP-008',
  name: 'Lê Thùy Linh',
  role: 'Thu Ngân Trưởng',
  dept: 'Cashier',
  baseSalary: 9000000,
  hours: 190,
  otHours: 0,
  bonus: 0,
  status: 'SẴN SÀNG',
};

const EMP_NAM: StaffPayroll = {
  id: 'EMP-009',
  name: 'Nguyễn Văn Nam',
  role: 'Phục Vụ Runner',
  dept: 'FOH',
  baseSalary: 7500000,
  hours: 180,
  otHours: 6,
  bonus: 200000,
  status: 'SẴN SÀNG',
};

const ALL_STAFF: StaffPayroll[] = [EMP_TUAN, EMP_AN, EMP_HOA, EMP_LINH, EMP_NAM];

// ============================================================================
describe('payroll — calcDeptPools', () => {
  it('phân bổ pool đúng tỷ lệ 40/45/15', () => {
    const pools = calcDeptPools(TIP_POOL_TOTAL);
    // 18,450,000 * 0.4 = 7,380,000
    expect(pools.bohTipPool).toBe(7380000);
    // 18,450,000 * 0.45 = 8,302,500
    expect(pools.fohTipPool).toBe(8302500);
    // 18,450,000 * 0.15 = 2,767,500
    expect(pools.cashierTipPool).toBe(2767500);
  });

  it('tổng 3 pool không vượt quá tipPoolTotal', () => {
    const pools = calcDeptPools(TIP_POOL_TOTAL);
    expect(pools.bohTipPool + pools.fohTipPool + pools.cashierTipPool).toBeLessThanOrEqual(
      TIP_POOL_TOTAL
    );
  });
});

describe('payroll — calcTipShare', () => {
  it('BOH tipShare = bohTipPool / 2', () => {
    const expected = Math.round(Math.round(TIP_POOL_TOTAL * 0.4) / 2); // 3,690,000
    expect(calcTipShare('BOH', TIP_POOL_TOTAL)).toBe(expected);
  });

  it('FOH tipShare = fohTipPool / 2', () => {
    const expected = Math.round(Math.round(TIP_POOL_TOTAL * 0.45) / 2); // 4,151,250
    expect(calcTipShare('FOH', TIP_POOL_TOTAL)).toBe(expected);
  });

  it('Cashier tipShare = cashierTipPool (không chia)', () => {
    const expected = Math.round(TIP_POOL_TOTAL * 0.15); // 2,767,500
    expect(calcTipShare('Cashier', TIP_POOL_TOTAL)).toBe(expected);
  });

  it('tipShare FOH > tipShare BOH (pool FOH lớn hơn, số người bằng nhau)', () => {
    expect(calcTipShare('FOH', TIP_POOL_TOTAL)).toBeGreaterThan(calcTipShare('BOH', TIP_POOL_TOTAL));
  });
});

describe('payroll — calcTotalNet', () => {
  it('tính đúng totalNet cho Bếp Trưởng (BOH, có OT và bonus)', () => {
    // tipShare BOH = 3,690,000; otPay = 16 * 150,000 = 2,400,000; bonus = 1,500,000
    // totalNet = 15,000,000 + 3,690,000 + 1,500,000 + 2,400,000 = 22,590,000
    const result = calcTotalNet(EMP_TUAN, TIP_POOL_TOTAL);
    const expected = 15000000 + calcTipShare('BOH', TIP_POOL_TOTAL) + 1500000 + 16 * 150000;
    expect(result).toBe(expected);
    expect(result).toBe(22590000);
  });

  it('otHours = 0 → không cộng OT pay vào totalNet', () => {
    // EMP_LINH: Cashier, otHours=0, bonus=0
    const withOt = EMP_LINH.baseSalary + calcTipShare('Cashier', TIP_POOL_TOTAL) + 0 + 0;
    expect(calcTotalNet(EMP_LINH, TIP_POOL_TOTAL)).toBe(withOt);
    // Verify otHours không đóng góp
    const withFakeOt = { ...EMP_LINH, otHours: 5 };
    expect(calcTotalNet(withFakeOt, TIP_POOL_TOTAL)).toBe(withOt + 5 * 150000);
  });

  it('bonus = 0 → totalNet = baseSalary + tipShare + otPay (không cộng thêm bonus)', () => {
    // EMP_AN: BOH, bonus=0
    const expected = EMP_AN.baseSalary + calcTipShare('BOH', TIP_POOL_TOTAL) + EMP_AN.otHours * 150000;
    expect(calcTotalNet(EMP_AN, TIP_POOL_TOTAL)).toBe(expected);
  });

  it('otHours = 0 và bonus = 0 → totalNet = baseSalary + tipShare', () => {
    // EMP_LINH: Cashier, otHours=0, bonus=0
    expect(calcTotalNet(EMP_LINH, TIP_POOL_TOTAL)).toBe(
      EMP_LINH.baseSalary + calcTipShare('Cashier', TIP_POOL_TOTAL)
    );
  });

  it('tổng tipShare của tất cả nhân viên ≤ tipPoolTotal (không chia vượt quỹ)', () => {
    const totalTipShare = ALL_STAFF.reduce(
      (acc, staff) => acc + calcTipShare(staff.dept, TIP_POOL_TOTAL),
      0
    );
    expect(totalTipShare).toBeLessThanOrEqual(TIP_POOL_TOTAL);
  });

  it('nhân viên lương cao hơn không nhất thiết tipShare nhiều hơn — tip phân bổ theo dept', () => {
    // Tuấn (BOH, 15M) và Hoa (FOH, 8.5M): Hoa nhận FOH tip > Tuấn nhận BOH tip
    expect(calcTipShare('FOH', TIP_POOL_TOTAL)).toBeGreaterThan(
      calcTipShare('BOH', TIP_POOL_TOTAL)
    );
  });

  it('mỗi OT giờ đóng góp đúng 150,000 VND vào totalNet', () => {
    const base = calcTotalNet({ ...EMP_HOA, otHours: 0 }, TIP_POOL_TOTAL);
    const withOt = calcTotalNet({ ...EMP_HOA, otHours: 10 }, TIP_POOL_TOTAL);
    expect(withOt - base).toBe(10 * 150000);
  });

  it('tính đúng totalNet cho Thu Ngân (Cashier, otHours=0, bonus=0)', () => {
    // tipShare Cashier = 2,767,500
    // totalNet = 9,000,000 + 2,767,500 = 11,767,500
    expect(calcTotalNet(EMP_LINH, TIP_POOL_TOTAL)).toBe(11767500);
  });
});
