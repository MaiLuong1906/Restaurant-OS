import { describe, it, expect, beforeEach } from 'vitest';
import { stockService, calculateYieldAndMax, deriveStockStatus } from '../stockService';
import { StockItem } from '../../types';

describe('stockService - Tồn kho bếp K1-K3 & Định mức BOM §27 v2', () => {
  beforeEach(() => {
    stockService.reset();
  });

  describe('calculateYieldAndMax', () => {
    it('tính yield % và số phần tối đa chính xác theo ví dụ sườn 100kg -> 72kg lọc', () => {
      // 100kg sống -> 72kg đã lọc -> 250g/phần
      // yield = 72%, max = floor(72000 / 250) = 288 phần
      const res = calculateYieldAndMax(100, 72, 250);
      expect(res.yieldPercent).toBe(72);
      expect(res.maxPortions).toBe(288);
    });

    it('tính số phần tối đa làm tròn xuống (floor) khi kết quả có số lẻ', () => {
      // 10kg sống -> 7.35kg lọc -> 250g/phần = 7350 / 250 = 29.4 -> 29 phần
      const res = calculateYieldAndMax(10, 7.35, 250);
      expect(res.yieldPercent).toBe(74);
      expect(res.maxPortions).toBe(29);
    });

    it('báo lỗi khi đầu vào không hợp lệ (raw <= 0, prepped < 0, grams <= 0)', () => {
      expect(() => calculateYieldAndMax(0, 10, 250)).toThrow();
      expect(() => calculateYieldAndMax(-10, 10, 250)).toThrow();
      expect(() => calculateYieldAndMax(100, -5, 250)).toThrow();
      expect(() => calculateYieldAndMax(100, 72, 0)).toThrow();
      expect(() => calculateYieldAndMax(100, 72, -50)).toThrow();
    });
  });

  describe('deriveStockStatus', () => {
    it('phân loại đúng: 0 phần -> out, <= 3 phần -> low, > 3 phần -> ok', () => {
      const baseItem: StockItem = {
        id: 'test',
        name: 'Món test',
        portions: 10,
        manualOut: false,
        autoOut: false,
        bom: null,
      };

      expect(deriveStockStatus({ ...baseItem, portions: 0 })).toBe('out');
      expect(deriveStockStatus({ ...baseItem, portions: 1 })).toBe('low');
      expect(deriveStockStatus({ ...baseItem, portions: 2 })).toBe('low');
      expect(deriveStockStatus({ ...baseItem, portions: 3 })).toBe('low');
      expect(deriveStockStatus({ ...baseItem, portions: 4 })).toBe('ok');
      expect(deriveStockStatus({ ...baseItem, portions: 42 })).toBe('ok');
    });

    it('manualOut = true hoặc autoOut = true luôn là out dù portions > 3', () => {
      const item: StockItem = {
        id: 'test',
        name: 'Món test',
        portions: 25,
        manualOut: true,
        autoOut: false,
        bom: null,
      };
      expect(deriveStockStatus(item)).toBe('out');

      expect(deriveStockStatus({ ...item, manualOut: false, autoOut: true })).toBe('out');
    });
  });

  describe('getStockItems', () => {
    it('trả về đủ 7 món mẫu spec với Sườn Nướng 42 phần và Bò Lúc Lắc 0 phần', async () => {
      const items = await stockService.getStockItems();
      expect(items.length).toBe(7);

      const suon = items.find((i) => i.id === 'dish-suon-nuong');
      expect(suon).toBeDefined();
      expect(suon?.portions).toBe(42);
      expect(suon?.status).toBe('ok');
      expect(suon?.bom?.rawKg).toBe(100);
      expect(suon?.bom?.preppedKg).toBe(72);
      expect(suon?.bom?.grams).toBe(250);

      const bo = items.find((i) => i.id === 'dish-bo-luc-lac');
      expect(bo).toBeDefined();
      expect(bo?.portions).toBe(0);
      expect(bo?.status).toBe('out');

      const goi = items.find((i) => i.id === 'dish-goi-cuon');
      expect(goi).toBeDefined();
      expect(goi?.portions).toBe(2);
      expect(goi?.status).toBe('low');
    });
  });

  describe('addPortions', () => {
    it('chặn nhập vượt số phần tối đa đối với món có định mức BOM', async () => {
      // Sườn nướng đang có 42 phần, max = 288 phần (72kg lọc / 250g)
      // Thêm 246 phần -> tổng 288 -> hợp lệ
      // Thêm 247 phần -> tổng 289 -> chặn và báo lỗi
      await expect(stockService.addPortions('dish-suon-nuong', 247)).rejects.toThrow(
        /Vượt quá số phần tối đa/
      );

      // Thử thêm 246 phần thành công
      const updated = await stockService.addPortions('dish-suon-nuong', 246);
      expect(updated.portions).toBe(288);
      expect(updated.status).toBe('ok');
    });

    it('cho phép nhập thêm không giới hạn đối với món không có định mức (BOM null)', async () => {
      // Nem Rán đang có 12 phần, không có BOM
      const updated = await stockService.addPortions('dish-nem-ran', 50);
      expect(updated.portions).toBe(62);
    });

    it('chặn nhập số lượng không hợp lệ (<= 0 hoặc số thực lẻ)', async () => {
      await expect(stockService.addPortions('dish-nem-ran', 0)).rejects.toThrow();
      await expect(stockService.addPortions('dish-nem-ran', -5)).rejects.toThrow();
      await expect(stockService.addPortions('dish-nem-ran', 2.5)).rejects.toThrow();
    });

    it('tự động gỡ cờ manualOut/autoOut khi nhập thêm phần cho món đang hết', async () => {
      // Bò lúc lắc đang out với 0 phần
      const boBefore = await stockService.getStockItemById('dish-bo-luc-lac');
      expect(boBefore.status).toBe('out');

      const boAfter = await stockService.addPortions('dish-bo-luc-lac', 10);
      expect(boAfter.portions).toBe(10);
      expect(boAfter.status).toBe('ok');
      expect(boAfter.manualOut).toBe(false);
      expect(boAfter.autoOut).toBe(false);
    });
  });

  describe('markSoldOut & reopenDish', () => {
    it('báo hết món thủ công đưa status về out và lưu cờ manualOut', async () => {
      const res = await stockService.markSoldOut('dish-com-ga');
      expect(res.status).toBe('out');
      expect(res.manualOut).toBe(true);
      expect(res.portions).toBe(15); // Số phần vẫn giữ nguyên trong kho
    });

    it('mở bán lại món thành công và cập nhật lại số phần', async () => {
      await stockService.markSoldOut('dish-com-ga');
      const reopened = await stockService.reopenDish('dish-com-ga', 20);
      expect(reopened.status).toBe('ok');
      expect(reopened.portions).toBe(20);
      expect(reopened.manualOut).toBe(false);
    });
  });

  describe('recordStockCount', () => {
    it('chặn xác nhận nếu có món chênh lệch mà chưa ghi lý do', async () => {
      // Sườn nướng hệ thống 42 phần, đếm thực tế 40 phần (thiếu 2)
      // Chưa truyền reason
      await expect(
        stockService.recordStockCount(
          { 'dish-suon-nuong': 40 },
          { 'dish-suon-nuong': '' }
        )
      ).rejects.toThrow(/Chưa ghi lý do chênh lệch/);
    });

    it('chấp nhận xác nhận khi chênh lệch có lý do hợp lệ', async () => {
      const res = await stockService.recordStockCount(
        {
          'dish-suon-nuong': 40,
          'dish-nem-ran': 12, // Khớp hoàn toàn không cần lý do
        },
        {
          'dish-suon-nuong': 'Làm rơi 2 phần lúc 19:40',
        }
      );

      expect(res.totalDishes).toBe(2);
      expect(res.discrepanciesCount).toBe(1);

      // Kiểm tra giá trị tồn kho mới
      const suon = await stockService.getStockItemById('dish-suon-nuong');
      expect(suon.portions).toBe(40);
    });

    it('chấp nhận khi toàn bộ các món đếm khớp hoàn toàn mà không cần lý do', async () => {
      const res = await stockService.recordStockCount(
        {
          'dish-nem-ran': 12,
          'dish-banh-xeo': 8,
        },
        {}
      );

      expect(res.discrepanciesCount).toBe(0);
    });
  });
});
