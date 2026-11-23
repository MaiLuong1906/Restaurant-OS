import { fetchApi } from '../lib/api-client';
import {
  ComboItemRequest,
  CreateDishRequest,
  DishPageParams,
  DishResponseDto,
  UpdateDishAvailabilityRequest,
  UpdateDishRequest,
} from '../types/dish';
import { PageResponse } from '../types/user';

export const dishService = {
  /**
   * Lấy danh sách món ăn phân trang, hỗ trợ lọc theo category, search, isAvailable
   * Endpoint: GET /api/v1/admin/dishes
   */
  async getAllDishesPaged(params?: DishPageParams): Promise<PageResponse<DishResponseDto>> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') {
      query.set('category', params.category);
    }
    if (params?.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params?.isAvailable !== undefined) {
      query.set('isAvailable', String(params.isAvailable));
    }
    if (params?.page !== undefined) {
      query.set('page', String(params.page));
    }
    if (params?.size !== undefined) {
      query.set('size', String(params.size));
    }

    const qs = query.toString();
    const endpoint = `/admin/dishes${qs ? `?${qs}` : ''}`;
    const raw = await fetchApi<PageResponse<DishResponseDto> | DishResponseDto[]>(endpoint);

    // Chuẩn hóa: hỗ trợ cả PageResponse từ Backend và Array fallback
    if (Array.isArray(raw)) {
      const page = params?.page ?? 0;
      const size = params?.size ?? 10;
      return {
        items: raw,
        page,
        size,
        totalElements: raw.length,
        totalPages: Math.ceil(raw.length / size) || 1,
        isFirst: page === 0,
        isLast: true,
        hasNext: false,
        hasPrevious: false,
      };
    }
    return raw;
  },

  /**
   * Lấy danh sách các category hiện có (distinct) từ DB
   * Endpoint: GET /api/v1/admin/dishes/categories
   */
  async getCategories(): Promise<string[]> {
    const result = await fetchApi<string[]>('/admin/dishes/categories');
    return Array.isArray(result) ? result : [];
  },

  /**
   * Xem chi tiết món ăn theo UUID, bao gồm comboItems nếu isCombo
   * Endpoint: GET /api/v1/admin/dishes/{id}
   */
  async getDishById(id: string): Promise<DishResponseDto> {
    return fetchApi<DishResponseDto>(`/admin/dishes/${id}`);
  },

  /**
   * Tạo mới món ăn đơn lẻ hoặc Combo
   * Endpoint: POST /api/v1/admin/dishes
   */
  async createDish(request: CreateDishRequest): Promise<DishResponseDto> {
    return fetchApi<DishResponseDto>('/admin/dishes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Cập nhật thông tin món ăn (kể cả comboItems của combo)
   * Endpoint: PUT /api/v1/admin/dishes/{id}
   */
  async updateDish(id: string, request: UpdateDishRequest): Promise<DishResponseDto> {
    return fetchApi<DishResponseDto>(`/admin/dishes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Xóa món ăn (cascade xóa dish_combos)
   * Endpoint: DELETE /api/v1/admin/dishes/{id}
   */
  async deleteDish(id: string): Promise<void> {
    await fetchApi<void>(`/admin/dishes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bật/tắt trạng thái bán món ăn — UC20 (KDS báo hết món)
   * Endpoint: PATCH /api/v1/dishes/{id}/availability
   * Lưu ý: dùng /dishes (không phải /admin/dishes) để tương thích RBAC KDS/STAFF
   */
  async toggleAvailability(
    id: string,
    request: UpdateDishAvailabilityRequest
  ): Promise<DishResponseDto> {
    return fetchApi<DishResponseDto>(`/dishes/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  /**
   * Lấy tất cả món lẻ (không phải combo) để chọn làm thành phần combo
   * Dùng trong DishFormModal khi isCombo = true
   */
  async getNonComboDishes(): Promise<DishResponseDto[]> {
    const result = await dishService.getAllDishesPaged({ size: 200 });
    return result.items.filter((d) => !d.isCombo);
  },

  /**
   * Chuyển đổi ComboItemRequest thành ComboItemRequest[] chuẩn,
   * đồng thời validate không có dishId trùng lặp
   */
  validateComboItems(items: ComboItemRequest[]): { valid: boolean; error?: string } {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.dishId)) {
        return {
          valid: false,
          error: `Danh sách combo bị trùng món (dishId: ${item.dishId})`,
        };
      }
      seen.add(item.dishId);
      if (item.quantity <= 0) {
        return { valid: false, error: 'Số lượng mỗi món trong combo phải >= 1' };
      }
    }
    return { valid: true };
  },
};
