/**
 * Helpers xử lý dateKey an toàn với múi giờ địa phương Việt Nam (GMT+7).
 * TUYỆT ĐỐI KHÔNG dùng toISOString() vì gây lệch ngày khi chạy sau 00:00 - 07:00.
 */

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/**
 * Lấy thứ 2 đầu tuần của 1 ngày bất kỳ.
 */
export function getStartOfWeekMonday(dateOrKey: Date | string): string {
  const date = typeof dateOrKey === 'string' ? parseDateKey(dateOrKey) : new Date(dateOrKey);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

export function formatVietnameseWeekday(date: Date): string {
  const d = date.getDay();
  switch (d) {
    case 0:
      return 'Chủ Nhật';
    case 1:
      return 'Thứ Hai';
    case 2:
      return 'Thứ Ba';
    case 3:
      return 'Thứ Tư';
    case 4:
      return 'Thứ Năm';
    case 5:
      return 'Thứ Sáu';
    case 6:
      return 'Thứ Bảy';
    default:
      return '';
  }
}

export function formatVietnameseShortWeekday(date: Date): string {
  const d = date.getDay();
  switch (d) {
    case 0:
      return 'CN';
    case 1:
      return 'T2';
    case 2:
      return 'T3';
    case 3:
      return 'T4';
    case 4:
      return 'T5';
    case 5:
      return 'T6';
    case 6:
      return 'T7';
    default:
      return '';
  }
}
