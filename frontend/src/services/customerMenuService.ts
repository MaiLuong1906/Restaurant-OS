import { fetchApi, ApiError } from '../lib/api-client';
import {
  CustomerDish,
  FALLBACK_DISH_IMAGE,
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
    badge = 'Combo';
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
   * Nối REST API GET /api/v1/dishes.
   * Để nhận cả món còn phục vụ và món hết hàng (do contract BE mặc định lọc isAvailable=true nếu vắng mặt),
   * khi params.isAvailable undefined sẽ gọi song song cả 2 trạng thái và gộp lại.
   */
  async getPublicDishes(params?: {
    category?: string;
    search?: string;
    isAvailable?: boolean;
  }): Promise<CustomerDish[]> {
    const fetchWithAvailable = async (available?: boolean): Promise<CustomerDishDto[]> => {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'ALL') {
        query.set('category', params.category);
      }
      if (params?.search && params.search.trim()) {
        query.set('search', params.search.trim());
      }
      if (available !== undefined) {
        query.set('isAvailable', String(available));
      }

      const qs = query.toString();
      const endpoint = `/dishes${qs ? `?${qs}` : ''}`;
      const dtos = await fetchApi<CustomerDishDto[]>(endpoint);
      return Array.isArray(dtos) ? dtos : [];
    };

    let allDtos: CustomerDishDto[];
    if (params?.isAvailable !== undefined) {
      allDtos = await fetchWithAvailable(params.isAvailable);
    } else {
      const [availableDtos, soldOutDtos] = await Promise.all([
        fetchWithAvailable(true),
        fetchWithAvailable(false),
      ]);
      allDtos = [...availableDtos, ...soldOutDtos];
    }

    if (!Array.isArray(allDtos) || allDtos.length === 0) {
      return [];
    }

    return allDtos.map(mapDtoToCustomerDish);
  },

  /**
   * Lấy chi tiết món ăn theo ID (UC02)
   */
  async getDishById(id: string): Promise<CustomerDish | null> {
    if (!isUuid(id)) {
      throw new ApiError('INVALID_ID', 'Mã món ăn không hợp lệ', 400);
    }
    const dto = await fetchApi<CustomerDishDto>(`/dishes/${id}`);
    if (dto) {
      return mapDtoToCustomerDish(dto);
    }
    return null;
  },

  /**
   * Lấy thông tin bàn ăn khi khách quét QR (UC01)
   * Endpoint: GET /api/v1/tables/{id}
   */
  async getTableInfo(tableId: string): Promise<TableInfoDto> {
    if (!isUuid(tableId)) {
      throw new ApiError('INVALID_TABLE_ID', 'Mã QR bàn không đúng định dạng UUID', 400);
    }
    const info = await fetchApi<TableInfoDto>(`/tables/${tableId}`);
    return info;
  },
};
