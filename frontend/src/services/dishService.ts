import { fetchApi } from '../lib/api-client';
import {
  ComboItemRequest,
  CreateDishRequest,
  DishOptionGroup,
  DishPageParams,
  DishResponseDto,
  UpdateDishAvailabilityRequest,
  UpdateDishRequest,
} from '../types/dish';
import { PageResponse } from '../types/user';

const LOCAL_STORAGE_KEY = 'restaurant_os_dish_options_cache';

const SAMPLE_OPTION_GROUPS: Record<string, DishOptionGroup[]> = {
  default_main: [
    {
      id: 'grp_size_sample',
      name: 'Kích Cỡ Phần Ăn',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      items: [
        { id: 'opt_s1', name: 'Tiêu Chuẩn (1 Người)', extraPrice: 0, isDefault: true, isAvailable: true },
        { id: 'opt_s2', name: 'Phần Lớn (Up-size)', extraPrice: 35000, isDefault: false, isAvailable: true },
      ],
    },
    {
      id: 'grp_top_sample',
      name: 'Topping & Món Kèm',
      isRequired: false,
      minSelections: 0,
      maxSelections: 3,
      items: [
        { id: 'opt_t1', name: 'Thêm Phô Mai Đút Lò', extraPrice: 20000, isDefault: false, isAvailable: true },
        { id: 'opt_t2', name: 'Trứng Ốp La Lòng Đào', extraPrice: 12000, isDefault: false, isAvailable: true },
        { id: 'opt_t3', name: 'Sốt Tiêu Đen Thêm', extraPrice: 15000, isDefault: false, isAvailable: true },
      ],
    },
  ],
  default_drink: [
    {
      id: 'grp_ice_sample',
      name: 'Lượng Đá',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      items: [
        { id: 'opt_i1', name: 'Đá Bình Thường (100%)', extraPrice: 0, isDefault: true, isAvailable: true },
        { id: 'opt_i2', name: 'Đá Ít (50%)', extraPrice: 0, isDefault: false, isAvailable: true },
        { id: 'opt_i3', name: 'Không Đá', extraPrice: 0, isDefault: false, isAvailable: true },
      ],
    },
    {
      id: 'grp_sugar_sample',
      name: 'Lượng Đường',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      items: [
        { id: 'opt_sg1', name: 'Ngọt Bình Thường (100%)', extraPrice: 0, isDefault: true, isAvailable: true },
        { id: 'opt_sg2', name: 'Ít Ngọt (50%)', extraPrice: 0, isDefault: false, isAvailable: true },
        { id: 'opt_sg3', name: 'Không Đường (0%)', extraPrice: 0, isDefault: false, isAvailable: true },
      ],
    },
  ],
};

function getStoredOptionGroups(dishId: string, category?: string): DishOptionGroup[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache[dishId]) return cache[dishId];
    }
  } catch {
    // Fallback im lặng
  }
  if (category === 'DRINK') return SAMPLE_OPTION_GROUPS.default_drink;
  if (category === 'MAIN') return SAMPLE_OPTION_GROUPS.default_main;
  return undefined;
}

function saveStoredOptionGroups(dishId: string, groups?: DishOptionGroup[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    if (groups && groups.length > 0) {
      cache[dishId] = groups;
    } else {
      delete cache[dishId];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Fallback im lặng
  }
}

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
    let response: PageResponse<DishResponseDto>;
    if (Array.isArray(raw)) {
      const page = params?.page ?? 0;
      const size = params?.size ?? 10;
      response = {
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
    } else {
      response = raw;
    }

    // Gắn optionGroups từ cache hoặc mẫu nếu backend chưa trả về
    response.items = response.items.map((dish) => {
      if (!dish.optionGroups || dish.optionGroups.length === 0) {
        return {
          ...dish,
          optionGroups: getStoredOptionGroups(dish.id, dish.category),
        };
      }
      return dish;
    });

    return response;
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
    const res = await fetchApi<DishResponseDto>(`/admin/dishes/${id}`);
    if (!res.optionGroups || res.optionGroups.length === 0) {
      res.optionGroups = getStoredOptionGroups(res.id, res.category);
    }
    return res;
  },

  /**
   * Tạo mới món ăn đơn lẻ hoặc Combo
   * Endpoint: POST /api/v1/admin/dishes
   */
  async createDish(request: CreateDishRequest): Promise<DishResponseDto> {
    const res = await fetchApi<DishResponseDto>('/admin/dishes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (request.optionGroups) {
      saveStoredOptionGroups(res.id, request.optionGroups);
      res.optionGroups = request.optionGroups;
    }
    return res;
  },

  /**
   * Cập nhật thông tin món ăn (kể cả comboItems của combo)
   * Endpoint: PUT /api/v1/admin/dishes/{id}
   */
  async updateDish(id: string, request: UpdateDishRequest): Promise<DishResponseDto> {
    const res = await fetchApi<DishResponseDto>(`/admin/dishes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    if (request.optionGroups !== undefined) {
      saveStoredOptionGroups(id, request.optionGroups);
      res.optionGroups = request.optionGroups;
    } else {
      res.optionGroups = getStoredOptionGroups(id, res.category);
    }
    return res;
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

  /**
   * Tính tổng giá gốc các món thành phần trong combo và số tiền khách tiết kiệm được
   */
  calculateComboFinancials(
    comboPrice: number,
    items: { dishPrice?: number; quantity: number }[]
  ): { totalCost: number; savings: number } {
    const totalCost = items.reduce(
      (sum, item) => sum + (item.dishPrice ?? 0) * item.quantity,
      0
    );
    const savings = Math.max(0, totalCost - comboPrice);
    return { totalCost, savings };
  },
};
