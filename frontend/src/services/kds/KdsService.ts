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

export interface KdsService {
  getTickets(): Promise<Ticket[]>;
  getTicketById(ticketId: string): Promise<Ticket>;
  updateTicketStatus(ticketId: string, status: OrderItemStatus, idempotencyKey: string): Promise<Ticket>;
  updateItemStatus(ticketId: string, itemId: string, status: OrderItemStatus, idempotencyKey: string): Promise<Ticket>;
  getPendingOrderChanges(): Promise<OrderChangeAlertData[]>;
  acknowledgeOrderChange(alertId: string, idempotencyKey?: string): Promise<{ alert: OrderChangeAlertData; ticket: Ticket }>;
  deferOrderChange(alertId: string): Promise<void>;
  listDishAvailability(): Promise<DishAvailability[]>;
  markSoldOut(dishId: string, idempotencyKey: string): Promise<DishAvailability>;
  reopenDish(dishId: string, quantity: number, idempotencyKey: string): Promise<DishAvailability>;
  getWasteDishOptions(): Promise<WasteDishOption[]>;
  getWasteTodayStats(): Promise<WasteTodayStats>;
  createWasteLog(req: CreateWasteLogRequest): Promise<WasteLogEntry>;
}
