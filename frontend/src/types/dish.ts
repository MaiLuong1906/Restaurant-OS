// ===========================================================================
// Dish Types — Restaurant OS Menu Management
// Match chính xác với DishResponseDto, CreateDishRequest, UpdateDishRequest
// trong backend module: com.restaurantos.backend.dish
// ===========================================================================

export type DishCategory =
  | 'MAIN'
  | 'APPETIZER'
  | 'SIDE_DISH'
  | 'DESSERT'
  | 'DRINK'
  | 'COMBO';

// Alias hiển thị tiếng Việt
export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  MAIN: 'Món Chính',
  APPETIZER: 'Khai Vị',
  SIDE_DISH: 'Món Phụ',
  DESSERT: 'Tráng Miệng',
  DRINK: 'Đồ Uống',
  COMBO: 'Combo',
};

// ===========================================================================
// Response DTOs (Backend → Frontend)
// ===========================================================================

export interface ComboItemResponse {
  id: string;        // UUID của bản ghi dish_combos
  dishId: string;    // UUID của món lẻ thành phần
  dishName: string;
  dishPrice: number; // Long VND
  dishCategory: string;
  dishImageUrl?: string | null;
  quantity: number;
}

export interface DishResponseDto {
  id: string;
  name: string;
  description?: string | null;
  price: number;        // Long VND — không dùng float
  category: string;     // DishCategory value
  categoryId: string;   // UUID từ bảng categories (tham chiếu)
  imageUrl?: string | null;
  isAvailable: boolean;
  isCombo: boolean;
  soldOutReason?: string | null;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  comboItems: ComboItemResponse[];
}

// ===========================================================================
// Request DTOs (Frontend → Backend)
// ===========================================================================

export interface ComboItemRequest {
  dishId: string;
  quantity: number;
}

export interface CreateDishRequest {
  name: string;
  description?: string;
  price: number;        // Integer VND >= 0
  category: string;     // DishCategory value
  imageUrl?: string;
  isAvailable?: boolean;
  isCombo?: boolean;
  comboItems?: ComboItemRequest[];
}

export interface UpdateDishRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isCombo?: boolean;
  comboItems?: ComboItemRequest[];
}

export interface UpdateDishAvailabilityRequest {
  isAvailable: boolean;
  soldOutReason?: string;
}

// ===========================================================================
// Query Params
// ===========================================================================

export interface DishPageParams {
  category?: string;
  search?: string;
  isAvailable?: boolean;
  page?: number;
  size?: number;
}
