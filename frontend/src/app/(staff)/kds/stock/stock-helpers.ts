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
