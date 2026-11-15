import { describe, it, expect, beforeEach } from 'vitest';
import { stockService, calculateYieldAndMax } from '../../../../../lib/stockService';
import {
  sortStockItems,
  filterStockItems,
  getStockSummary,
  stockStatusLabel,
  validatePrepQuantity,
  stockStatusRank,
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
});
