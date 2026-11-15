import { describe, it, expect, beforeEach } from 'vitest';
import { stockService, calculateYieldAndMax } from '../../../../../lib/stockService';
import {
  sortStockItems,
  filterStockItems,
  getStockSummary,
  stockStatusLabel,
  validatePrepQuantity,
  stockStatusRank,
  computeCountDiff,
  getCountDiffBadge,
  isValidCountedInput,
  hasMissingCountReasons,
  summarizeStockCount,
} from '../stock-helpers';

describe('K1–K2 Stock Screens & Helpers Unit Tests', () => {
  beforeEach(() => {
    stockService.reset();
  });

  describe('stock-helpers sorting & rank', () => {
    it('ranks out=0, low=1, ok=2', () => {
      expect(stockStatusRank('out')).toBe(0);
      expect(stockStatusRank('low')).toBe(1);
      expect(stockStatusRank('ok')).toBe(2);
    });

    it('sortStockItems sorts Hết món -> Sắp hết -> Còn without mutating original array', async () => {
      const items = await stockService.getStockItems();
      const shuffled = [...items].reverse();

      const sorted = sortStockItems(shuffled);

      // Verify original is untouched
      expect(shuffled[0].id).toBe(items[items.length - 1].id);

      // First items should be 'out'
      expect(sorted[0].status).toBe('out');
      expect(sorted[0].id).toBe('dish-bo-luc-lac');

      // Second items should be 'low'
      expect(sorted[1].status).toBe('low');
      expect(sorted[1].id).toBe('dish-goi-cuon');

      // Rest should be 'ok'
      for (let i = 2; i < sorted.length; i++) {
        expect(sorted[i].status).toBe('ok');
      }
    });
  });

  describe('getStockSummary', () => {
    it('returns total 7, lowCount 1, outCount 1 on real mock data', async () => {
      const items = await stockService.getStockItems();
      const summary = getStockSummary(items);

      expect(summary.total).toBe(7);
      expect(summary.lowCount).toBe(1); // Gỏi cuốn (2)
      expect(summary.outCount).toBe(1); // Bò lúc lắc (0)
    });
  });

  describe('filterStockItems', () => {
    it('all returns 7, low returns only Gỏi Cuốn, out returns only Bò Lúc Lắc', async () => {
      const items = await stockService.getStockItems();

      const all = filterStockItems(items, 'all');
      expect(all.length).toBe(7);

      const low = filterStockItems(items, 'low');
      expect(low.length).toBe(1);
      expect(low[0].id).toBe('dish-goi-cuon');
      expect(low[0].portions).toBe(2);

      const out = filterStockItems(items, 'out');
      expect(out.length).toBe(1);
      expect(out[0].id).toBe('dish-bo-luc-lac');
      expect(out[0].portions).toBe(0);
    });
  });

  describe('stockStatusLabel', () => {
    it('maps ok/low/out to Còn/Sắp hết/Hết món', () => {
      expect(stockStatusLabel('ok')).toBe('Còn');
      expect(stockStatusLabel('low')).toBe('Sắp hết');
      expect(stockStatusLabel('out')).toBe('Hết món');
    });
  });

  describe('BOM calculation via service', () => {
    it('calculateYieldAndMax(100, 72, 250) gives Yield 72% and max 288', () => {
      const res = calculateYieldAndMax(100, 72, 250);
      expect(res.yieldPercent).toBe(72);
      expect(res.maxPortions).toBe(288);
    });
  });

  describe('validatePrepQuantity', () => {
    it('validates BOM capped items: current 42 + 246 <= 288 is valid, 247 is invalid', () => {
      // 42 + 246 = 288 -> valid
      expect(validatePrepQuantity(42, 246, 288)).toBeNull();

      // 42 + 247 = 289 -> invalid
      expect(validatePrepQuantity(42, 247, 288)).toMatch(/Vượt quá số phần tối đa/);

      // Invalid quantities
      expect(validatePrepQuantity(42, 0, 288)).toMatch(/số nguyên dương lớn hơn 0/);
      expect(validatePrepQuantity(42, -5, 288)).toMatch(/số nguyên dương lớn hơn 0/);
      expect(validatePrepQuantity(42, 2.5, 288)).toMatch(/số nguyên dương lớn hơn 0/);
    });

    it('allows unbounded additions for no-BOM dishes (maxPortions is null)', () => {
      expect(validatePrepQuantity(0, 9999, null)).toBeNull();
      expect(validatePrepQuantity(10, 50, null)).toBeNull();
    });
  });

  describe('K2 Integration: addPortions for out dish clears out status', () => {
    it('reopens out dish Bò Lúc Lắc when prep added', async () => {
      const before = await stockService.getStockItemById('dish-bo-luc-lac');
      expect(before.status).toBe('out');
      expect(before.portions).toBe(0);

      // Nhập thêm 15 phần qua prep flow
      await stockService.addPortions('dish-bo-luc-lac', 15);

      const after = await stockService.getStockItemById('dish-bo-luc-lac');
      expect(after.status).toBe('ok');
      expect(after.portions).toBe(15);
      expect(after.autoOut).toBe(false);
      expect(after.manualOut).toBe(false);
    });
  });

  describe('K3 Count Helpers & Flow', () => {
    it('computeCountDiff correctly calculates counted - system', () => {
      expect(computeCountDiff(42, 42)).toBe(0);
      expect(computeCountDiff(40, 42)).toBe(-2);
      expect(computeCountDiff(45, 42)).toBe(3);
    });

    it('getCountDiffBadge returns correct labels and hex colors', () => {
      const match = getCountDiffBadge(0);
      expect(match.label).toBe('Khớp (±0)');
      expect(match.color).toBe('#10B981');

      const missing = getCountDiffBadge(-2);
      expect(missing.label).toBe('Thiếu -2 phần');
      expect(missing.color).toBe('#EF4444');

      const surplus = getCountDiffBadge(3);
      expect(surplus.label).toBe('Thừa +3 phần');
      expect(surplus.color).toBe('#F59E0B');
    });

    it('isValidCountedInput validates non-negative integers only', () => {
      expect(isValidCountedInput(0)).toBe(true);
      expect(isValidCountedInput(10)).toBe(true);
      expect(isValidCountedInput('5')).toBe(true);

      expect(isValidCountedInput('')).toBe(false);
      expect(isValidCountedInput(-1)).toBe(false);
      expect(isValidCountedInput(2.5)).toBe(false);
      expect(isValidCountedInput(NaN)).toBe(false);
      expect(isValidCountedInput(undefined)).toBe(false);
    });

    it('hasMissingCountReasons checks that all discrepant items have a non-blank reason', () => {
      // Khớp hết -> không cần reason
      expect(
        hasMissingCountReasons([
          { dishId: '1', dishName: 'A', systemPortions: 10, countedPortions: 10, diff: 0, reason: '' },
        ])
      ).toBe(false);

      // Có lệch nhưng chưa có reason -> true (thiếu reason)
      expect(
        hasMissingCountReasons([
          { dishId: '1', dishName: 'A', systemPortions: 10, countedPortions: 8, diff: -2, reason: '' },
        ])
      ).toBe(true);

      // Có lệch nhưng reason chỉ có khoảng trắng -> true
      expect(
        hasMissingCountReasons([
          { dishId: '1', dishName: 'A', systemPortions: 10, countedPortions: 8, diff: -2, reason: '   ' },
        ])
      ).toBe(true);

      // Có lệch và có reason hợp lệ -> false (đã đủ reason)
      expect(
        hasMissingCountReasons([
          { dishId: '1', dishName: 'A', systemPortions: 10, countedPortions: 8, diff: -2, reason: 'Rơi vỡ' },
        ])
      ).toBe(false);
    });

    it('summarizeStockCount tallies total, matched, and discrepant count rows', () => {
      const rows = [
        { dishId: '1', dishName: 'A', systemPortions: 10, countedPortions: 10, diff: 0, reason: '' },
        { dishId: '2', dishName: 'B', systemPortions: 5, countedPortions: 3, diff: -2, reason: 'Hỏng' },
        { dishId: '3', dishName: 'C', systemPortions: 2, countedPortions: 4, diff: 2, reason: 'Thừa' },
      ];

      const res = summarizeStockCount(rows);
      expect(res.total).toBe(3);
      expect(res.matched).toBe(1);
      expect(res.discrepant).toBe(2);
    });
  });
});
