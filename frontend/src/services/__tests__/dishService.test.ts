import { describe, it, expect, vi, beforeEach } from 'vitest';

// Phải khai báo vi.mock trước import để Vitest hoist lên đầu file
vi.mock('../../lib/api-client', () => {
  class ApiError extends Error {
    code: string;
    status: number;
    details?: unknown;

    constructor(code: string, message: string, status: number, details?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.status = status;
      this.details = details;
    }
  }
  return { fetchApi: vi.fn(), ApiError };
});

import { fetchApi } from '../../lib/api-client';
import { dishService } from '../dishService';
import { DishResponseDto } from '../../types/dish';
import { PageResponse } from '../../types/user';

const mockFetchApi = vi.mocked(fetchApi);

// Hàm tạo DishResponseDto hợp lệ cho tests
function makeDish(overrides: Partial<DishResponseDto> = {}): DishResponseDto {
  return {
    id: 'dish-1',
    name: 'Phở Bò Tái Nạm',
    price: 65000,
    category: 'MAIN',
    categoryId: 'cat-main-1',
    isAvailable: true,
    soldOutReason: null,
    imageUrl: null,
    isCombo: false,
    comboItems: [],
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    ...overrides,
  };
}

function makePageResponse(
  items: DishResponseDto[],
  overrides: Partial<PageResponse<DishResponseDto>> = {}
): PageResponse<DishResponseDto> {
  return {
    items,
    page: 0,
    size: 10,
    totalElements: items.length,
    totalPages: 1,
    isFirst: true,
    isLast: true,
    hasNext: false,
    hasPrevious: false,
    ...overrides,
  };
}

describe('dishService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. validateComboItems
  // =========================================================================
  describe('validateComboItems', () => {
    it('trả về valid: true khi danh sách combo rỗng', () => {
      expect(dishService.validateComboItems([])).toEqual({ valid: true });
    });

    it('trả về valid: true khi các món hợp lệ (dishId duy nhất, quantity >= 1)', () => {
      const result = dishService.validateComboItems([
        { dishId: 'dish-1', quantity: 1 },
        { dishId: 'dish-2', quantity: 2 },
      ]);
      expect(result).toEqual({ valid: true });
    });

    it('báo lỗi khi có hai món trùng dishId', () => {
      const result = dishService.validateComboItems([
        { dishId: 'dish-1', quantity: 1 },
        { dishId: 'dish-1', quantity: 2 },
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bị trùng món');
      expect(result.error).toContain('dish-1');
    });

    it('báo lỗi khi quantity = 0', () => {
      const result = dishService.validateComboItems([{ dishId: 'dish-1', quantity: 0 }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('>= 1');
    });

    it('báo lỗi khi quantity âm', () => {
      expect(dishService.validateComboItems([{ dishId: 'dish-2', quantity: -3 }]).valid).toBe(false);
    });
  });

  // =========================================================================
  // 2. calculateComboFinancials
  // =========================================================================
  describe('calculateComboFinancials', () => {
    it('tính chính xác tổng giá vốn và số tiền khách tiết kiệm', () => {
      const items = [
        { dishPrice: 50000, quantity: 2 }, // 100,000
        { dishPrice: 30000, quantity: 1 }, // 30,000
      ];
      const result = dishService.calculateComboFinancials(110000, items);
      expect(result.totalCost).toBe(130000);
      expect(result.savings).toBe(20000);
    });

    it('trả về savings = 0 khi giá combo >= tổng giá gốc (không âm)', () => {
      const result = dishService.calculateComboFinancials(50000, [{ dishPrice: 40000, quantity: 1 }]);
      expect(result.totalCost).toBe(40000);
      expect(result.savings).toBe(0);
    });

    it('xử lý an toàn khi dishPrice undefined', () => {
      const result = dishService.calculateComboFinancials(50000, [{ dishPrice: undefined, quantity: 2 }]);
      expect(result.totalCost).toBe(0);
      expect(result.savings).toBe(0);
    });
  });

  // =========================================================================
  // 3. getAllDishesPaged
  // =========================================================================
  describe('getAllDishesPaged', () => {
    it('gọi đúng endpoint với query params category, search, isAvailable, page, size', async () => {
      const mockResponse = makePageResponse([makeDish()]);
      mockFetchApi.mockResolvedValueOnce(mockResponse);

      const result = await dishService.getAllDishesPaged({
        category: 'MAIN',
        search: 'phở',
        isAvailable: true,
        page: 0,
        size: 10,
      });

      expect(mockFetchApi).toHaveBeenCalledWith(
        '/admin/dishes?category=MAIN&search=ph%E1%BB%9F&isAvailable=true&page=0&size=10'
      );
      expect(result).toEqual(mockResponse);
    });

    it('bỏ qua category khi giá trị là ALL', async () => {
      mockFetchApi.mockResolvedValueOnce(makePageResponse([]));

      await dishService.getAllDishesPaged({ category: 'ALL', page: 0 });

      expect(mockFetchApi).toHaveBeenCalledWith('/admin/dishes?page=0');
    });

    it('chuẩn hóa tự động (Array fallback) khi backend trả về mảng thay vì PageResponse', async () => {
      const rawArray = [makeDish({ id: 'd1' }), makeDish({ id: 'd2' }), makeDish({ id: 'd3' })];
      mockFetchApi.mockResolvedValueOnce(rawArray);

      const result = await dishService.getAllDishesPaged({ page: 0, size: 2 });

      expect(result.items).toHaveLength(3);
      expect(result.totalElements).toBe(3);
      expect(result.totalPages).toBe(2); // Math.ceil(3 / 2) = 2
    });
  });

  // =========================================================================
  // 4. CRUD operations
  // =========================================================================
  describe('getCategories', () => {
    it('gọi GET /admin/dishes/categories', async () => {
      mockFetchApi.mockResolvedValueOnce(['MAIN', 'DRINK', 'COMBO']);
      const res = await dishService.getCategories();
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/dishes/categories');
      expect(res).toEqual(['MAIN', 'DRINK', 'COMBO']);
    });

    it('trả về mảng rỗng nếu backend trả về dữ liệu không phải mảng', async () => {
      mockFetchApi.mockResolvedValueOnce(null);
      expect(await dishService.getCategories()).toEqual([]);
    });
  });

  describe('getDishById', () => {
    it('gọi GET /admin/dishes/{id}', async () => {
      const dish = makeDish({ id: 'dish-123' });
      mockFetchApi.mockResolvedValueOnce(dish);
      const res = await dishService.getDishById('dish-123');
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/dishes/dish-123');
      expect(res).toEqual(dish);
    });
  });

  describe('createDish', () => {
    it('gọi POST /admin/dishes kèm body JSON', async () => {
      const payload = { name: 'Món Mới', price: 55000, category: 'APPETIZER' as const, isCombo: false };
      mockFetchApi.mockResolvedValueOnce({ id: 'new-id', ...payload });
      await dishService.createDish(payload);
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/dishes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('updateDish', () => {
    it('gọi PUT /admin/dishes/{id} kèm body JSON', async () => {
      const payload = { name: 'Tên Đã Sửa', price: 60000, category: 'MAIN' as const, isCombo: false };
      mockFetchApi.mockResolvedValueOnce({ id: 'dish-1', ...payload });
      await dishService.updateDish('dish-1', payload);
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/dishes/dish-1', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('deleteDish', () => {
    it('gọi DELETE /admin/dishes/{id}', async () => {
      mockFetchApi.mockResolvedValueOnce(undefined);
      await dishService.deleteDish('dish-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/dishes/dish-1', { method: 'DELETE' });
    });
  });

  describe('toggleAvailability', () => {
    it('gọi PATCH /dishes/{id}/availability', async () => {
      const payload = { isAvailable: false, soldOutReason: 'Bếp báo tạm hết' };
      mockFetchApi.mockResolvedValueOnce({ id: 'dish-1', isAvailable: false });
      await dishService.toggleAvailability('dish-1', payload);
      expect(mockFetchApi).toHaveBeenCalledWith('/dishes/dish-1/availability', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    });
  });

  describe('getNonComboDishes', () => {
    it('lọc bỏ các món có isCombo = true', async () => {
      const dishes = [
        makeDish({ id: '1', name: 'Món Lẻ 1', isCombo: false }),
        makeDish({ id: '2', name: 'Combo Đặc Biệt', isCombo: true }),
        makeDish({ id: '3', name: 'Món Lẻ 2', isCombo: false }),
      ];
      mockFetchApi.mockResolvedValueOnce(makePageResponse(dishes, { totalElements: 3 }));

      const res = await dishService.getNonComboDishes();
      expect(res).toHaveLength(2);
      expect(res.map((d) => d.id)).toEqual(['1', '3']);
    });
  });
});
