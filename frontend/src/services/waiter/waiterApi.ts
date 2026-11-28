import { fetchApi } from '../../lib/api-client';

export interface BackendTableDto {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  currentOrderId: string | null;
}

export interface BackendOrderItemDto {
  id: string;
  dishId: string;
  dishNameSnapshot: string;
  portionId: string;
  portionNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  status: string; // WAITING | READY | SERVED | REJECTED
  notes: string | null;
  allergyNote: string | null;
  createdAt?: string | null;
  slaDeadline?: string | null;
  updatedAt?: string | null;
}

export interface BackendOrderDto {
  id: string;
  tableId: string;
  orderCode: string;
  status: string; // PLACED | CONFIRMED | SERVED | PAID | CANCELLED
  totalAmount: number;
  customerNotes: string | null;
  openedAt: string | null;
  createdAt: string | null;
  items: BackendOrderItemDto[];
}

export interface BackendDishDto {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  categoryName?: string;
  price?: number;
  basePrice?: number;
  description?: string;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface CreateOrderItemPayload {
  dishId: string;
  quantity: number;
  notes?: string;
  allergyNote?: string;
}

export interface CreateOrderPayload {
  tableId: string;
  items: CreateOrderItemPayload[];
  customerNotes?: string;
  idempotencyKey?: string;
}

export const waiterApi = {
  fetchTables(): Promise<BackendTableDto[]> {
    return fetchApi<BackendTableDto[]>('/tables');
  },

  updateTableStatus(tableId: string, status: string): Promise<BackendTableDto> {
    return fetchApi<BackendTableDto>(`/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  fetchActiveOrders(): Promise<BackendOrderDto[]> {
    return fetchApi<BackendOrderDto[]>('/orders/active');
  },

  createOrder(payload: CreateOrderPayload): Promise<BackendOrderDto> {
    return fetchApi<BackendOrderDto>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  serveOrderItem(itemId: string): Promise<BackendOrderItemDto> {
    return fetchApi<BackendOrderItemDto>(`/orders/items/${itemId}/serve`, {
      method: 'PATCH',
    });
  },

  fetchDishes(): Promise<BackendDishDto[]> {
    return fetchApi<BackendDishDto[]>('/dishes');
  },
};
