import {
  StockItem,
  StockItemStatus,
  StockItemWithStatus,
  YieldAndMax,
  RecordStockCountResult,
} from '../types';
import {
  MOCK_STOCK_ITEMS,
  kdsService,
  deepClone,
  createNotFoundError,
  createValidationError,
} from '../services/mock';

export function calculateYieldAndMax(
  rawKg: number,
  preppedKg: number,
  gramsPerPortion: number
): YieldAndMax {
  if (
    !Number.isFinite(rawKg) ||
    !Number.isFinite(preppedKg) ||
    !Number.isFinite(gramsPerPortion) ||
    rawKg <= 0 ||
    preppedKg < 0 ||
    gramsPerPortion <= 0
  ) {
    throw createValidationError(
      'Thông số sơ chế không hợp lệ (rawKg > 0, preppedKg >= 0, gramsPerPortion > 0)'
    );
  }

  const yieldPercent = Math.round((preppedKg / rawKg) * 100);
  const maxPortions = Math.floor((preppedKg * 1000) / gramsPerPortion);

  return {
    yieldPercent,
    maxPortions,
  };
}

export function deriveStockStatus(item: StockItem): StockItemStatus {
  if (item.manualOut || item.autoOut || item.portions === 0) {
    return 'out';
  }
  if (item.portions <= 3) {
    return 'low';
  }
  return 'ok';
}

export class StockService {
  private items: StockItem[];
  private countHistory: RecordStockCountResult[] = [];

  constructor() {
    this.items = deepClone(MOCK_STOCK_ITEMS as StockItem[]);
  }

  /**
   * Reset helper phục vụ cho test isolate
   */
  reset(): void {
    this.items = deepClone(MOCK_STOCK_ITEMS as StockItem[]);
    this.countHistory = [];
  }

  /**
   * Danh sách tồn kho theo món kèm trạng thái phái sinh
   */
  async getStockItems(): Promise<StockItemWithStatus[]> {
    return this.items.map((item) => ({
      ...deepClone(item),
      status: deriveStockStatus(item),
    }));
  }

  async getStockItemById(dishId: string): Promise<StockItemWithStatus> {
    const item = this.items.find((i) => i.id === dishId);
    if (!item) {
      throw createNotFoundError('StockItem', dishId);
    }
    return {
      ...deepClone(item),
      status: deriveStockStatus(item),
    };
  }

  /**
   * Nhập thêm số phần sau sơ chế (đầu ca hoặc giữa ca)
   */
  async addPortions(
    dishId: string,
    quantity: number,
    preppedKg?: number,
    rawKg?: number
  ): Promise<StockItemWithStatus> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createValidationError('Số phần nhập thêm phải là số nguyên dương lớn hơn 0');
    }

    const item = this.items.find((i) => i.id === dishId);
    if (!item) {
      throw createNotFoundError('StockItem', dishId);
    }

    if (item.bom) {
      const effectivePreppedKg = preppedKg !== undefined ? preppedKg : item.bom.preppedKg;
      const effectiveRawKg = rawKg !== undefined ? rawKg : item.bom.rawKg;

      const { maxPortions } = calculateYieldAndMax(
        effectiveRawKg,
        effectivePreppedKg,
        item.bom.grams
      );

      if (item.portions + quantity > maxPortions) {
        throw createValidationError(
          `Vượt quá số phần tối đa (${maxPortions} phần) tính từ kg đã lọc (${effectivePreppedKg} kg). Tối đa chỉ có thể nhập thêm ${Math.max(
            0,
            maxPortions - item.portions
          )} phần.`
        );
      }

      // Cập nhật lại số kg thực tế trong BOM nếu có truyền vào
      if (preppedKg !== undefined) item.bom.preppedKg = preppedKg;
      if (rawKg !== undefined) item.bom.rawKg = rawKg;
    }

    item.portions += quantity;

    // Tự động gỡ cờ hết món nếu có
    const wasOut = item.manualOut || item.autoOut;
    item.manualOut = false;
    item.autoOut = false;

    // Đồng bộ sang kdsService nếu đang ở trạng thái hết món
    if (wasOut) {
      try {
        await kdsService.reopenDish(
          dishId,
          item.portions,
          `reopen-from-stock-${dishId}-${Date.now()}`
        );
      } catch {
        // kdsService có thể chưa có món này nếu là món độc lập, bỏ qua lỗi đồng bộ
      }
    }

    return {
      ...deepClone(item),
      status: deriveStockStatus(item),
    };
  }

  /**
   * Báo hết món thủ công (nối sang kdsService.markSoldOut)
   */
  async markSoldOut(dishId: string, idempotencyKey?: string): Promise<StockItemWithStatus> {
    const item = this.items.find((i) => i.id === dishId);
    if (!item) {
      throw createNotFoundError('StockItem', dishId);
    }

    item.manualOut = true;

    try {
      await kdsService.markSoldOut(
        dishId,
        idempotencyKey || `soldout-from-stock-${dishId}-${Date.now()}`
      );
    } catch {
      // Bỏ qua nếu dishId không tồn tại trong mockKdsService cũ
    }

    return {
      ...deepClone(item),
      status: deriveStockStatus(item),
    };
  }

  /**
   * Mở bán lại món (nối sang kdsService.reopenDish)
   */
  async reopenDish(
    dishId: string,
    quantity: number,
    idempotencyKey?: string
  ): Promise<StockItemWithStatus> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createValidationError('Số lượng mở bán lại phải là số nguyên dương lớn hơn 0');
    }

    const item = this.items.find((i) => i.id === dishId);
    if (!item) {
      throw createNotFoundError('StockItem', dishId);
    }

    if (item.bom) {
      const { maxPortions } = calculateYieldAndMax(
        item.bom.rawKg,
        item.bom.preppedKg,
        item.bom.grams
      );
      if (quantity > maxPortions) {
        throw createValidationError(
          `Số phần mở bán lại (${quantity}) vượt quá tối đa (${maxPortions})`
        );
      }
    }

    item.portions = quantity;
    item.manualOut = false;
    item.autoOut = false;

    try {
      await kdsService.reopenDish(
        dishId,
        quantity,
        idempotencyKey || `reopen-from-stock-${dishId}-${Date.now()}`
      );
    } catch {
      // Bỏ qua nếu dishId không tồn tại trong mockKdsService cũ
    }

    return {
      ...deepClone(item),
      status: deriveStockStatus(item),
    };
  }

  /**
   * Kiểm đếm cuối ca — đối chiếu hệ thống với số thực tế
   */
  async recordStockCount(
    counts: Record<string, number>,
    reasons: Record<string, string>
  ): Promise<RecordStockCountResult> {
    const snapshots: {
      dishId: string;
      dishName: string;
      systemPortions: number;
      countedPortions: number;
      difference: number;
      reason?: string;
    }[] = [];

    const unexplainedDishes: string[] = [];

    for (const [dishId, countVal] of Object.entries(counts)) {
      const item = this.items.find((i) => i.id === dishId);
      if (!item) {
        throw createNotFoundError('StockItem', dishId);
      }
      if (!Number.isInteger(countVal) || countVal < 0) {
        throw createValidationError(
          `Số lượng đếm thực tế của món ${item.name} phải là số nguyên không âm`
        );
      }

      const diff = countVal - item.portions;
      const reason = reasons[dishId]?.trim();

      if (diff !== 0 && !reason) {
        unexplainedDishes.push(item.name);
      }

      snapshots.push({
        dishId: item.id,
        dishName: item.name,
        systemPortions: item.portions,
        countedPortions: countVal,
        difference: diff,
        reason: reason || undefined,
      });
    }

    if (unexplainedDishes.length > 0) {
      throw createValidationError(
        `Chưa ghi lý do chênh lệch cho các món: ${unexplainedDishes.join(', ')}. Bắt buộc phải có lý do khi phát sinh thừa/thiếu.`
      );
    }

    // Áp dụng số lượng đếm thực tế
    const nowIso = new Date().toISOString();
    for (const snapshot of snapshots) {
      const item = this.items.find((i) => i.id === snapshot.dishId)!;
      item.portions = snapshot.countedPortions;
      if (item.portions === 0) {
        item.autoOut = true;
      }
    }

    const result: RecordStockCountResult = {
      countedAt: nowIso,
      totalDishes: snapshots.length,
      discrepanciesCount: snapshots.filter((s) => s.difference !== 0).length,
      items: snapshots.map((s) => ({ ...s, countedAt: nowIso })),
    };

    this.countHistory.push(deepClone(result));
    return deepClone(result);
  }

  getCountHistory(): RecordStockCountResult[] {
    return deepClone(this.countHistory);
  }
}

export const stockService = new StockService();
