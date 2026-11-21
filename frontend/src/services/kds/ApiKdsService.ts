import {
  Ticket,
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
    return fetchApi<Ticket[]>(`/kds/tickets/${ticketId}`) as unknown as Promise<Ticket>;
  }

  async updateTicketStatus(
    _ticketId: string,
    _status: OrderItemStatus,
    _idempotencyKey: string
  ): Promise<Ticket> {
    // TODO: UC19 - Hoàn tất ticket / đồng bộ trạng thái đơn bếp qua backend
    throw new Error('updateTicketStatus chưa được hỗ trợ ở live mode (TODO UC19)');
  }

  async updateItemStatus(
    _ticketId: string,
    _itemId: string,
    _status: OrderItemStatus,
    _idempotencyKey: string
  ): Promise<Ticket> {
    // TODO: UC18 - Cập nhật trạng thái từng món trong ticket
    throw new Error('updateItemStatus chưa được hỗ trợ ở live mode (TODO UC18)');
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

