import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadQuickActionCounts,
  incrementQuickActionCount,
  sortActionsForSpeedDial,
  getActionStorageKey,
  getActionUniqueKey,
  QUICK_ACTION_COUNTS_STORAGE_PREFIX,
} from '../../../lib/quickActionCounts';
import { QuickActionItem } from '@/components/staff/QuickActions';
import { Clock, Calendar, FileText, DollarSign } from 'lucide-react';

const MOCK_ACTIONS: QuickActionItem[] = [
  { icon: Clock, label: 'Chấm công', sub: 'Vào / ra ca', href: '/staff/attendance' },
  { icon: Calendar, label: 'Lịch ca', sub: 'Ca tuần này', href: '/staff/schedule' },
  { icon: FileText, label: 'Xin nghỉ', sub: 'Đơn & quỹ phép', href: '/staff/leave' },
  { icon: DollarSign, label: 'Lương & Tip', sub: 'Phiếu tháng này', href: '/staff/payslip' },
];

describe('QuickActionCounts & Speed-Dial ordering logic', () => {
  beforeEach(() => {
    // Mock localStorage in node environment if needed
    const store: Record<string, string> = {};
    (global as any).window = {
      localStorage: {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        clear: () => {
          for (const key of Object.keys(store)) delete store[key];
        },
      },
    };
  });

  it('tạo đúng storage key theo staffId và guest fallback', () => {
    expect(getActionStorageKey('staff-123')).toBe(`${QUICK_ACTION_COUNTS_STORAGE_PREFIX}staff-123`);
    expect(getActionStorageKey(null)).toBe(`${QUICK_ACTION_COUNTS_STORAGE_PREFIX}guest`);
    expect(getActionStorageKey(undefined)).toBe(`${QUICK_ACTION_COUNTS_STORAGE_PREFIX}guest`);
  });

  it('lấy đúng unique key ưu tiên href rồi đến label', () => {
    expect(getActionUniqueKey({ icon: Clock, label: 'Chấm công', sub: '', href: '/staff/attendance' })).toBe(
      '/staff/attendance'
    );
    expect(getActionUniqueKey({ icon: Clock, label: 'Đối soát ca', sub: '', onClick: () => {} })).toBe(
      'Đối soát ca'
    );
  });

  it('đọc counts rỗng khi chưa có dữ liệu hoặc JSON lỗi', () => {
    expect(loadQuickActionCounts('staff-1')).toEqual({});

    window.localStorage.setItem(`${QUICK_ACTION_COUNTS_STORAGE_PREFIX}staff-1`, '{ invalid-json');
    expect(loadQuickActionCounts('staff-1')).toEqual({});
  });

  it('tăng bộ đếm cho action khi gọi incrementQuickActionCount', () => {
    const action = MOCK_ACTIONS[0]; // /staff/attendance
    incrementQuickActionCount(action, 'staff-1');

    const counts1 = loadQuickActionCounts('staff-1');
    expect(counts1['/staff/attendance']).toBe(1);

    incrementQuickActionCount(action, 'staff-1');
    const counts2 = loadQuickActionCounts('staff-1');
    expect(counts2['/staff/attendance']).toBe(2);
  });

  it('sắp xếp Speed-Dial: action có lượt bấm cao nhất nằm ở cuối danh sách (sát FAB)', () => {
    // Chưa có lượt bấm: giữ nguyên thứ tự ban đầu
    const initialSorted = sortActionsForSpeedDial(MOCK_ACTIONS, {});
    expect(initialSorted.map((a) => a.label)).toEqual([
      'Chấm công',
      'Lịch ca',
      'Xin nghỉ',
      'Lương & Tip',
    ]);

    // Giả lập counts:
    // Chấm công: 1
    // Xin nghỉ: 4 (bấm nhiều nhất)
    // Lịch ca: 0
    // Lương & Tip: 2
    const counts = {
      '/staff/attendance': 1,
      '/staff/leave': 4,
      '/staff/payslip': 2,
    };

    const sorted = sortActionsForSpeedDial(MOCK_ACTIONS, counts);
    // Tăng dần theo count:
    // Lịch ca (0) -> Chấm công (1) -> Lương & Tip (2) -> Xin nghỉ (4, sát FAB nhất)
    expect(sorted.map((a) => a.label)).toEqual([
      'Lịch ca',
      'Chấm công',
      'Lương & Tip',
      'Xin nghỉ',
    ]);
  });

  it('giữ nguyên thứ tự ban đầu cho các action có số lượt bấm bằng nhau (stable sort)', () => {
    const counts = {
      '/staff/schedule': 3,
      '/staff/payslip': 3,
    };
    const sorted = sortActionsForSpeedDial(MOCK_ACTIONS, counts);
    // Chấm công (0), Xin nghỉ (0) ở trên, Lịch ca (3) trước Lương & Tip (3) theo thứ tự mảng ban đầu
    expect(sorted.map((a) => a.label)).toEqual([
      'Chấm công',
      'Xin nghỉ',
      'Lịch ca',
      'Lương & Tip',
    ]);
  });
});
