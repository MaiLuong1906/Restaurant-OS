import { fetchApi, ApiError } from '../lib/api-client';
import {
  CustomerDish,
  FALLBACK_DISH_IMAGE,
  PHO_CO_DISHES,
} from '../lib/customer-menu-data';

export interface ComboItemDto {
  id: string;
  dishId: string;
  dishName: string;
  dishPrice: number;
  dishCategory: string;
  dishImageUrl?: string | null;
  quantity: number;
}

export interface CustomerDishDto {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  categoryId?: string | null;
  imageUrl?: string | null;
  isAvailable: boolean;
  isCombo?: boolean;
  soldOutReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  comboItems?: ComboItemDto[];
}

export interface TableInfoDto {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  currentOrderId?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function formatTableName(tableId: string): string {
  if (tableId.toLowerCase().startsWith('ban')) {
    return `Bàn ${tableId.replace(/ban-?/i, '').trim()}`;
  }
  return `Bàn ${tableId.replace(/-/g, ' ').toUpperCase().trim()}`;
}

export function mapCategoryToSubCategory(
  rawCategory: string
): 'APPETIZER' | 'MAIN' | 'SOUP' | 'DESSERT' | 'DRINK' {
  const normalized = (rawCategory || '').toUpperCase().trim();
  switch (normalized) {
    case 'APPETIZER':
    case 'KHAI_VI':
      return 'APPETIZER';
    case 'SOUP':
    case 'MON_NUOC':
    case 'LAU':
      return 'SOUP';
    case 'DESSERT':
    case 'TRANG_MIENG':
      return 'DESSERT';
    case 'DRINK':
    case 'DO_UONG':
      return 'DRINK';
    case 'COMBO':
    case 'MAIN':
    case 'MON_CHINH':
    default:
      return 'MAIN';
  }
}

export function mapDtoToCustomerDish(dto: CustomerDishDto): CustomerDish {
  const isCombo = Boolean(dto.isCombo || dto.category?.toUpperCase() === 'COMBO');
  const subCat = mapCategoryToSubCategory(dto.category);

  let comboDesc = dto.description || '';
  if (isCombo && dto.comboItems && dto.comboItems.length > 0) {
    const itemsList = dto.comboItems
      .map((item) => `${item.quantity}x ${item.dishName}`)
      .join(', ');
    comboDesc = dto.description
      ? `${dto.description} (${itemsList})`
      : `Bao gồm: ${itemsList}`;
  }

  // Gán nhãn phù hợp nếu là Combo hoặc Món bán chạy
  let badge: string | undefined = undefined;
  let badgeVariant: CustomerDish['badgeVariant'] = undefined;

  if (isCombo) {
    badge = 'Combo Tiết Kiệm';
    badgeVariant = 'special';
  } else if (!dto.isAvailable) {
    badge = 'Tạm hết món';
    badgeVariant = 'neutral';
  }

  return {
    id: dto.id,
    name: dto.name,
    description: comboDesc,
    price: Number(dto.price) || 0,
    category: subCat === 'SOUP' ? 'MAIN' : subCat,
    subCategory: subCat,
    imageUrl: dto.imageUrl && dto.imageUrl.trim() ? dto.imageUrl : FALLBACK_DISH_IMAGE,
    isAvailable: dto.isAvailable !== false,
    badge,
    badgeVariant,
  };
}

export const customerMenuService = {
  /**
   * Lấy danh sách thực đơn công khai cho khách hàng (UC02)
   * Nối REST API GET /api/v1/dishes, có fallback mượt sang mock nếu server chưa bật
   */
  async getPublicDishes(params?: {
    category?: string;
    search?: string;
    isAvailable?: boolean;
  }): Promise<CustomerDish[]> {
    try {
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

      const qs = query.toString();
      const endpoint = `/dishes${qs ? `?${qs}` : ''}`;
      const dtos = await fetchApi<CustomerDishDto[]>(endpoint);

      if (Array.isArray(dtos) && dtos.length > 0) {
        return dtos.map(mapDtoToCustomerDish);
      }
      return PHO_CO_DISHES;
    } catch (error) {
      // Khi gặp lỗi mạng (ví dụ Backend chưa khởi động ở môi trường demo preview),
      // tự động fallback về PHO_CO_DISHES để giao diện khách hàng không bị sập
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return PHO_CO_DISHES;
      }
      // Nếu là lỗi khác, thử lọc trên mock
      return PHO_CO_DISHES;
    }
  },

  /**
   * Lấy chi tiết món ăn theo ID (UC02)
   */
  async getDishById(id: string): Promise<CustomerDish | null> {
    try {
      if (isUuid(id)) {
        const dto = await fetchApi<CustomerDishDto>(`/dishes/${id}`);
        if (dto) {
          return mapDtoToCustomerDish(dto);
        }
      }
      const foundInMock = PHO_CO_DISHES.find((d) => d.id === id);
      return foundInMock || null;
    } catch {
      return PHO_CO_DISHES.find((d) => d.id === id) || null;
    }
  },

  /**
   * Lấy thông tin bàn ăn khi khách quét QR (UC01)
   * Endpoint: GET /api/v1/tables/{id}
   */
  async getTableInfo(tableId: string): Promise<TableInfoDto> {
    if (!isUuid(tableId)) {
      // Mã bàn dạng text như 'ban-04', 'ban-01' phục vụ demo tĩnh
      return {
        id: tableId,
        tableNumber: formatTableName(tableId),
        capacity: 4,
        status: 'SERVING',
      };
    }

    try {
      const info = await fetchApi<TableInfoDto>(`/tables/${tableId}`);
      return info;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw error;
      }
      // Fallback nếu server local tạm thời offline
      return {
        id: tableId,
        tableNumber: formatTableName(tableId),
        capacity: 4,
        status: 'SERVING',
      };
    }
  },
};
