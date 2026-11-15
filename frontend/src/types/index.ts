// ====================================================================
// Domain Models & DTO Types for Restaurant OS
// Tuân thủ: Tiền tệ integer VND, Typed responses, Idempotency
// ====================================================================

export type Category = 'MAIN' | 'APPETIZER' | 'DRINK' | 'DESSERT';

export interface ModifierOption {
  name: string;
  priceDelta: number; // VND integer
}

export interface Modifier {
  name: string;
  options: ModifierOption[];
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number; // VND integer, ví dụ 55000
  category: Category;
  imageUrl?: string;
  isAvailable: boolean;
}

export type TableStatus = 'IDLE' | 'OCCUPIED' | 'DINING' | 'BILLING';

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  qrCodeToken: string;
  capacity: number;
  status: TableStatus;
}

export type OrderItemStatus = 'WAITING' | 'COOKING' | 'READY' | 'SERVED' | 'REJECTED';

export interface OrderItem {
  id: string;
  orderId: string;
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number; // VND
  modifiers: {
    name: string;
    selected: string;
    extraPrice: number;
  }[];
  status: OrderItemStatus;
  createdAt: string;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  tableId: string;
  tableNumber: string;
  status: OrderStatus;
  totalAmount: number; // VND
  idempotencyKey?: string;
  customerNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  selectedModifiers: {
    name: string;
    selected: string;
    extraPrice: number;
  }[];
  note?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
