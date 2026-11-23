import {
  Ticket,
  OrderItem,
  OrderItemStatus,
  OrderChangeAlertData,
  DishAvailability,
  WasteDishOption,
  WasteTodayStats,
  WasteLogEntry,
  CreateWasteLogRequest,
} from '../../types';
import { fetchApi } from '../../lib/api-client';
import { KdsService } from './KdsService';

export class ApiKdsService implements KdsService {
  async getTickets(): Promise<Ticket[]> {
    return fetchApi<Ticket[]>('/kds/tickets');
  }

  async getTicketById(ticketId: string): Promise<Ticket> {
    return fetchApi<Ticket>(`/kds/tickets/${ticketId}`);
  }

  async updateTicketStatus(
    ticketId: string,
    _status: OrderItemStatus,
    idempotencyKey: string
  ): Promise<Ticket> {
    // K3 gửi body {}; field status là field chết trên BE, không gửi status khác READY
    return fetchApi<Ticket>(`/kds/tickets/${ticketId}/complete`, {
      method: 'PATCH',
      headers: idempotencyKey ? { 'X-Request-ID': idempotencyKey } : undefined,
      body: JSON.stringify({}),
    });
  }

  async updateItemStatus(
    ticketId: string,
    itemId: string,
    status: OrderItemStatus,
    idempotencyKey: string,
    reason?: string
  ): Promise<Ticket> {
    if (status !== 'READY' && status !== 'REJECTED') {
      throw new Error('Bếp chỉ được phép cập nhật trạng thái món sang READY hoặc REJECTED');
    }

    const trimmedReason = reason?.trim();
    if (status === 'REJECTED') {
      if (!trimmedReason || trimmedReason.length < 5 || trimmedReason.length > 200) {
        throw new Error('Lý do từ chối là bắt buộc và phải từ 5 đến 200 ký tự');
      }
    }

    await fetchApi<OrderItem>(`/kds/items/${itemId}/status`, {
      method: 'PATCH',
      headers: idempotencyKey ? { 'X-Request-ID': idempotencyKey } : undefined,
      body: JSON.stringify({
        status,
        ...(trimmedReason !== undefined ? { reason: trimmedReason } : {}),
      }),
    });

    return this.getTicketById(ticketId);
  }

  async getPendingOrderChanges(): Promise<OrderChangeAlertData[]> {
    return [];
  }

  async acknowledgeOrderChange(
    _alertId: string,
    _idempotencyKey?: string
  ): Promise<{ alert: OrderChangeAlertData; ticket: Ticket }> {
    throw new Error('acknowledgeOrderChange chưa được hỗ trợ ở live mode');
  }

  async deferOrderChange(_alertId: string): Promise<void> {
    // No-op
  }

  async listDishAvailability(): Promise<DishAvailability[]> {
    return [];
  }

  async markSoldOut(_dishId: string, _idempotencyKey: string): Promise<DishAvailability> {
    throw new Error('markSoldOut chưa được hỗ trợ ở live mode');
  }

  async reopenDish(
    _dishId: string,
    _quantity: number,
    _idempotencyKey: string
  ): Promise<DishAvailability> {
    throw new Error('reopenDish chưa được hỗ trợ ở live mode');
  }

  async getWasteDishOptions(): Promise<WasteDishOption[]> {
    return [];
  }

  async getWasteTodayStats(): Promise<WasteTodayStats> {
    return { logCount: 0, portionCount: 0 };
  }

  async createWasteLog(_req: CreateWasteLogRequest): Promise<WasteLogEntry> {
    throw new Error('createWasteLog chưa được hỗ trợ ở live mode');
  }
}

