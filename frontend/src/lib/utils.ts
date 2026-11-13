import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng số nguyên VND chuẩn Việt Nam
 * Ví dụ: 55000 -> "55.000 ₫"
 */
export function formatVND(amount: number): string {
  const integerAmount = Math.round(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(integerAmount);
}

/**
 * Sinh UUID v4 cho Idempotency Key chống duplicate orders
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const VN_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const;

export function formatShortDateVN(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatVietnameseFullDate(date: Date = new Date()): string {
  const weekday = VN_WEEKDAYS[date.getDay()];
  return `${weekday}, ${formatShortDateVN(date)}`;
}

export function formatTimeHHMM(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatTimeHHMMSS(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function getUpcomingTimeSlot(offsetMinutes: number, baseDate: Date = new Date()): string {
  const future = new Date(baseDate.getTime() + offsetMinutes * 60 * 1000);
  const roundedMin = Math.ceil(future.getMinutes() / 15) * 15;
  future.setMinutes(roundedMin, 0, 0);
  return formatTimeHHMM(future);
}

export function getRealtimeShiftMeta(now: Date = new Date()): {
  shiftName: string;
  startTime: string;
  endTime: string;
  checkedInAt: string;
  nextShift: string;
} {
  const hour = now.getHours();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowWeekday = VN_WEEKDAYS[tomorrow.getDay()];

  if (hour >= 6 && hour < 14) {
    return {
      shiftName: 'Ca sáng · Sảnh Tầng 1',
      startTime: '08:00',
      endTime: '14:00',
      checkedInAt: hour < 8 ? formatTimeHHMM(new Date(now.getTime() - 5 * 60000)) : '07:58',
      nextShift: 'Hôm nay · 14:00 – 22:00',
    };
  }

  if (hour >= 14 && hour < 22) {
    return {
      shiftName: 'Ca chiều tối · Sảnh Tầng 1',
      startTime: '14:00',
      endTime: '22:00',
      checkedInAt: '13:56',
      nextShift: `${tomorrowWeekday} · 08:00 – 14:00`,
    };
  }

  return {
    shiftName: 'Ca tối muộn · Sảnh Tầng 1',
    startTime: '22:00',
    endTime: '23:59',
    checkedInAt: '21:55',
    nextShift: `${tomorrowWeekday} · 08:00 – 14:00`,
  };
}

