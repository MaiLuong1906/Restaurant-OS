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

/**
 * Mốc thời gian cố định dùng cho lượt render đầu tiên (SSR/Hydration) để
 * đảm bảo HTML server và client khớp tuyệt đối, sau đó đồng bộ clock thực ở useEffect.
 */
export const SSR_FALLBACK_DATE = new Date(2026, 10, 13, 18, 0, 0);

export function formatShortDateVN(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoToShortVN(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getDateRelativeLabel(
  isoDate: string,
  baseDate: Date = new Date()
): string {
  const todayIso = formatIsoDate(baseDate);
  const tomorrow = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 1
  );
  const tomorrowIso = formatIsoDate(tomorrow);

  if (isoDate === todayIso) return 'Hôm nay';
  if (isoDate === tomorrowIso) return 'Ngày mai';

  const [y, m, d] = isoDate.split('-').map(Number);
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    const parsed = new Date(y, m - 1, d);
    return VN_WEEKDAYS[parsed.getDay()];
  }
  return '';
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

export function isPastReservationDateTime(
  isoDate: string,
  slotHHMM: string,
  baseDate: Date = new Date()
): boolean {
  const todayIso = formatIsoDate(baseDate);
  if (isoDate < todayIso) return true;
  if (isoDate > todayIso) return false;

  const [slotHour, slotMin] = slotHHMM.split(':').map(Number);
  const slotTotalMin =
    (Number.isFinite(slotHour) ? slotHour : 0) * 60 +
    (Number.isFinite(slotMin) ? slotMin : 0);
  const nowTotalMin = baseDate.getHours() * 60 + baseDate.getMinutes();
  return slotTotalMin <= nowTotalMin;
}

/**
 * Tự động xác định ngày nhận bàn dựa theo giờ đặt so với thời điểm hiện tại.
 * Nếu khung giờ đã qua (nhỏ hơn hoặc bằng giờ hiện tại), chuyển sang ngày hôm sau.
 */
export function resolveReservationTargetDate(
  slotHHMM: string,
  baseDate: Date = new Date()
): { reservedDate: string; isoDate: string; isTomorrow: boolean } {
  const isTomorrow = isPastReservationDateTime(
    formatIsoDate(baseDate),
    slotHHMM,
    baseDate
  );
  const targetDate = isTomorrow
    ? new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1)
    : baseDate;

  return {
    reservedDate: formatShortDateVN(targetDate),
    isoDate: formatIsoDate(targetDate),
    isTomorrow,
  };
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

