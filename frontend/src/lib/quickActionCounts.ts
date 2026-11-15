/**
 * Helper quản lý số lần bấm QuickAction theo thiết bị (localStorage).
 * Dùng để sắp xếp thứ tự Speed-Dial pill trên mobile:
 * Action được bấm nhiều nhất đặt ở dưới cùng (sát FAB, gần ngón cái nhất).
 * 
 * Lưu ý: Số liệu lưu trên thiết bị (localStorage), không phải dữ liệu nghiệp vụ backend.
 */

import { QuickActionItem } from '@/components/staff/QuickActions';

export const QUICK_ACTION_COUNTS_STORAGE_PREFIX = 'pos_quick_action_counts_';

export type QuickActionCountMap = Record<string, number>;

export function getActionStorageKey(staffId?: string | null): string {
  return `${QUICK_ACTION_COUNTS_STORAGE_PREFIX}${staffId || 'guest'}`;
}

export function getActionUniqueKey(action: QuickActionItem): string {
  return action.href || action.label;
}

export function loadQuickActionCounts(staffId?: string | null): QuickActionCountMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(getActionStorageKey(staffId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as QuickActionCountMap;
    }
  } catch (e) {
    console.warn('Lỗi khi đọc quick action counts từ localStorage:', e);
  }
  return {};
}

export function incrementQuickActionCount(action: QuickActionItem, staffId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getActionStorageKey(staffId);
    const counts = loadQuickActionCounts(staffId);
    const actionKey = getActionUniqueKey(action);
    counts[actionKey] = (counts[actionKey] || 0) + 1;
    window.localStorage.setItem(key, JSON.stringify(counts));
  } catch (e) {
    console.warn('Lỗi khi ghi quick action count vào localStorage:', e);
  }
}

/**
 * Sắp xếp các actions cho cột Speed-Dial (dưới -> trên).
 * Cột được render từ trên xuống dưới (flex-col items-end).
 * Pill ở cuối mảng (index cao nhất) là pill nằm sát FAB nhất ở dưới cùng.
 * => Sắp xếp theo số lần bấm tăng dần:
 *    - Số lần bấm ít nhất ở đầu mảng (trên cùng)
 *    - Số lần bấm nhiều nhất ở cuối mảng (dưới cùng, sát FAB)
 *    - Nếu bằng nhau hoặc chưa có lượt bấm: giữ nguyên thứ tự ban đầu.
 */
export function sortActionsForSpeedDial(
  actions: QuickActionItem[],
  counts: QuickActionCountMap
): QuickActionItem[] {
  return [...actions]
    .map((action, originalIndex) => ({
      action,
      originalIndex,
      count: counts[getActionUniqueKey(action)] || 0,
    }))
    .sort((a, b) => {
      if (a.count !== b.count) {
        return a.count - b.count; // tăng dần: ít nhất ở trên, nhiều nhất ở dưới cùng sát FAB
      }
      return a.originalIndex - b.originalIndex; // giữ thứ tự ban đầu khi bằng nhau
    })
    .map((item) => item.action);
}
