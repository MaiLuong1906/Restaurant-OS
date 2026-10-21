import { describe, it, expect } from 'vitest';
import { getTableStatusColor, TABLE_STATUS_COLORS } from '../tableStatusColor';

describe('getTableStatusColor - Ánh xạ trạng thái bàn sang thông số màu sắc', () => {
  it('phải trả về màu xanh lá (#22c55e) cho trạng thái IDLE (bàn trống)', () => {
    const spec = getTableStatusColor('IDLE');
    expect(spec.base).toBe('#22c55e');
    expect(spec.blinking).toBe(false);
    expect(spec.name).toBe('Bàn trống');
  });

  it('phải trả về màu vàng (#eab308) cho trạng thái OCCUPIED (đang dùng bữa)', () => {
    const spec = getTableStatusColor('OCCUPIED');
    expect(spec.base).toBe('#eab308');
    expect(spec.blinking).toBe(false);
    expect(spec.name).toBe('Đang dùng bữa');
  });

  it('phải trả về màu đỏ (#ef4444) và bật nhấp nháy cho trạng thái BILLING (chờ thanh toán / trễ SLA)', () => {
    const spec = getTableStatusColor('BILLING');
    expect(spec.base).toBe('#ef4444');
    expect(spec.blinking).toBe(true);
  });

  it('phải trả về màu đỏ (#ef4444) và bật nhấp nháy cho trạng thái SLA', () => {
    const spec = getTableStatusColor('SLA');
    expect(spec.base).toBe('#ef4444');
    expect(spec.blinking).toBe(true);
  });

  it('phải trả về màu xám (#6b7280) cho trạng thái CLEANING (cần dọn dẹp)', () => {
    const spec = getTableStatusColor('CLEANING');
    expect(spec.base).toBe('#6b7280');
    expect(spec.blinking).toBe(false);
    expect(spec.name).toBe('Cần dọn dẹp');
  });

  it('phải trả về màu mặc định an toàn cho trạng thái không hợp lệ hoặc rỗng', () => {
    const specUnknown = getTableStatusColor('UNKNOWN_STATUS');
    expect(specUnknown.base).toBe('#9ca3af');
    expect(specUnknown.blinking).toBe(false);

    const specEmpty = getTableStatusColor('');
    expect(specEmpty.base).toBe('#9ca3af');
  });

  it('phải là hàm thuần khiết (pure function), không làm thay đổi hằng số gốc', () => {
    const spec1 = getTableStatusColor('IDLE');
    const spec2 = getTableStatusColor('IDLE');
    expect(spec1).toEqual(spec2);

    // Không làm ảnh hưởng bảng màu gốc khi sửa object trả về
    spec1.base = '#000000';
    expect(TABLE_STATUS_COLORS.IDLE.base).toBe('#22c55e');
  });
});
