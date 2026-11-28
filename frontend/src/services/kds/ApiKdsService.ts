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

  async completeBatch(itemIds: string[], idempotencyKey: string): Promise<Ticket[]> {
    return fetchApi<Ticket[]>('/kds/batches/complete', {
      method: 'POST',
      headers: idempotencyKey ? { 'X-Request-ID': idempotencyKey } : undefined,
      body: JSON.stringify({ itemIds }),
    });
  }

  async getPendingOrderChanges(): Promise<OrderChangeAlertData[]> {
    return fetchApi<OrderChangeAlertData[]>('/kds/order-changes');
  }

  async acknowledgeOrderChange(
    alertId: string,
    idempotencyKey?: string
  ): Promise<{ alert: OrderChangeAlertData; ticket: Ticket }> {
    const alert = await fetchApi<OrderChangeAlertData>(`/kds/order-changes/${alertId}/acknowledge`, {
      method: 'POST',
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
    });
    let ticket: Ticket;
    try {
      ticket = await this.getTicketById(alert.ticketId);
    } catch {
      ticket = {
        id: alert.ticketId,
        tableNo: alert.tableNo,
        items: [],
        status: 'WAITING',
        createdAt: alert.createdAt ?? new Date().toISOString(),
        slaMinutes: 15,
      } as unknown as Ticket;
    }
    return { alert, ticket };
  }

  async deferOrderChange(alertId: string): Promise<void> {
    await fetchApi<OrderChangeAlertData>(`/kds/order-changes/${alertId}/defer`, {
      method: 'POST',
    });
  }

  async listDishAvailability(): Promise<DishAvailability[]> {
    interface BackendDishItem {
      id: string;
      name: string;
      category?: string;
      isAvailable: boolean;
      soldOutReason?: string | null;
    }
    const [availableDishes, soldOutDishes] = await Promise.all([
      fetchApi<BackendDishItem[]>('/dishes?isAvailable=true'),
      fetchApi<BackendDishItem[]>('/dishes?isAvailable=false'),
    ]);
    return [...availableDishes, ...soldOutDishes].map((d) => ({
      dishId: d.id,
      dishName: d.name,
      status: d.isAvailable ? 'AVAILABLE' : 'SOLD_OUT',
      remainingPortions: d.isAvailable ? 1 : 0,
      waitingTables: [],
    }));
  }

  async markSoldOut(dishId: string, idempotencyKey: string): Promise<DishAvailability> {
    interface BackendDishItem {
      id: string;
      name: string;
      isAvailable: boolean;
      soldOutReason?: string | null;
    }
    const d = await fetchApi<BackendDishItem>(`/dishes/${dishId}/availability`, {
      method: 'PATCH',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        isAvailable: false,
        soldOutReason: 'Bếp báo hết món',
      }),
    });
    return {
      dishId: d.id,
      dishName: d.name,
      status: d.isAvailable ? 'AVAILABLE' : 'SOLD_OUT',
      remainingPortions: 0,
      waitingTables: [],
      soldOutAt: new Date().toISOString(),
    };
  }

  async reopenDish(
    dishId: string,
    quantity: number,
    idempotencyKey: string
  ): Promise<DishAvailability> {
    interface BackendDishItem {
      id: string;
      name: string;
      isAvailable: boolean;
      soldOutReason?: string | null;
    }
    const d = await fetchApi<BackendDishItem>(`/dishes/${dishId}/availability`, {
      method: 'PATCH',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        isAvailable: true,
        soldOutReason: null,
      }),
    });
    return {
      dishId: d.id,
      dishName: d.name,
      status: d.isAvailable ? 'AVAILABLE' : 'SOLD_OUT',
      remainingPortions: quantity,
      waitingTables: [],
    };
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

