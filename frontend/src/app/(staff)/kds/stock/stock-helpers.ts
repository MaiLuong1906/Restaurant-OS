import { StockItemWithStatus, StockItemStatus } from '../../../../types';

export type StockFilter = 'all' | 'low' | 'out';

export interface StockSummary {
  total: number;
  lowCount: number;
  outCount: number;
}

export function stockStatusRank(status: StockItemStatus): number {
  switch (status) {
    case 'out':
      return 0;
    case 'low':
      return 1;
    case 'ok':
      return 2;
    default:
      return 2;
  }
}

export function sortStockItems(items: readonly StockItemWithStatus[]): StockItemWithStatus[] {
  return [...items].sort((a, b) => {
    const rankDiff = stockStatusRank(a.status) - stockStatusRank(b.status);
    if (rankDiff !== 0) return rankDiff;

    if (a.portions !== b.portions) {
      return a.portions - b.portions;
    }

    return a.name.localeCompare(b.name, 'vi');
  });
}

export function filterStockItems(
  items: readonly StockItemWithStatus[],
  filter: StockFilter
): StockItemWithStatus[] {
  if (filter === 'all') return [...items];
  return items.filter((item) => item.status === filter);
}

export function getStockSummary(items: readonly StockItemWithStatus[]): StockSummary {
  let lowCount = 0;
  let outCount = 0;

  for (const item of items) {
    if (item.status === 'out') {
      outCount += 1;
    } else if (item.status === 'low') {
      lowCount += 1;
    }
  }

  return {
    total: items.length,
    lowCount,
    outCount,
  };
}

export function stockStatusLabel(status: StockItemStatus): string {
  switch (status) {
    case 'ok':
      return 'Còn';
    case 'low':
      return 'Sắp hết';
    case 'out':
      return 'Hết món';
    default:
      return 'Còn';
  }
}

export function validatePrepQuantity(
  currentPortions: number,
  quantity: number,
  maxPortions: number | null
): string | null {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return 'Số phần nhập thêm phải là số nguyên dương lớn hơn 0';
  }

  if (maxPortions !== null) {
    if (currentPortions + quantity > maxPortions) {
      const remainingAllowed = Math.max(0, maxPortions - currentPortions);
      return `Vượt quá số phần tối đa (${maxPortions} phần). Tối đa chỉ có thể nhập thêm ${remainingAllowed} phần.`;
    }
  }

  return null;
}

// ==========================================
// K1 Light Restyle Grouping & Cell Helpers
// ==========================================

export interface StockGroups {
  urgent: StockItemWithStatus[];
  watch: StockItemWithStatus[];
  stable: StockItemWithStatus[];
}

export function groupStockItems(items: readonly StockItemWithStatus[]): StockGroups {
  const sorted = sortStockItems(items);

  const urgent: StockItemWithStatus[] = [];
  const watch: StockItemWithStatus[] = [];
  const stable: StockItemWithStatus[] = [];

  for (const item of sorted) {
    if (item.portions <= 2) {
      urgent.push(item);
    } else if (item.portions <= 10) {
      watch.push(item);
    } else {
      stable.push(item);
    }
  }

  return { urgent, watch, stable };
}

export interface PortionDisplay {
  filled: number;
  overflow: number;
}

export function getPortionDisplay(portions: number): PortionDisplay {
  const nonNegative = Math.max(0, portions);
  const filled = Math.min(nonNegative, 10);
  const overflow = Math.max(0, nonNegative - 10);
  return { filled, overflow };
}

// ==========================================
// K3 Count Helpers
// ==========================================

export interface CountRow {
  dishId: string;
  dishName: string;
  systemPortions: number;
  countedPortions: number;
  diff: number;
  reason: string;
}

export interface CountDiffBadge {
  label: string;
  color: string;
}

export function computeCountDiff(countedPortions: number, systemPortions: number): number {
  return countedPortions - systemPortions;
}

export function getCountDiffBadge(diff: number): CountDiffBadge {
  if (diff === 0) {
    return { label: 'Khớp (±0)', color: '#10B981' };
  }
  if (diff < 0) {
    return { label: `Thiếu ${diff} phần`, color: '#EF4444' };
  }
  return { label: `Thừa +${diff} phần`, color: '#F59E0B' };
}

export function isValidCountedInput(raw: unknown): boolean {
  if (raw === '' || raw === null || raw === undefined) return false;
  const num = Number(raw);
  return Number.isInteger(num) && num >= 0;
}

export function hasMissingCountReasons(rows: readonly CountRow[]): boolean {
  for (const row of rows) {
    if (row.diff !== 0 && (!row.reason || row.reason.trim() === '')) {
      return true;
    }
  }
  return false;
}

export function summarizeStockCount(rows: readonly CountRow[]): {
  total: number;
  matched: number;
  discrepant: number;
} {
  let matched = 0;
  let discrepant = 0;

  for (const row of rows) {
    if (row.diff === 0) {
      matched += 1;
    } else {
      discrepant += 1;
    }
  }

  return {
    total: rows.length,
    matched,
    discrepant,
  };
}
