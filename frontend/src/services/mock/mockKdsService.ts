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
import {
  MOCK_TICKETS,
  MOCK_ORDER_CHANGES,
  MOCK_DISH_AVAILABILITY,
  MOCK_WASTE_LOGS,
} from './data/kdsMockData';
import { simulateLatency, deepClone, createNotFoundError, createValidationError } from './mockUtils';

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

export class MockKdsService implements KdsService {
  private tickets: Ticket[];
  private alerts: OrderChangeAlertData[];
  private availability: DishAvailability[];
  private wasteLogs: WasteLogEntry[];
  private processedKeys = new Set<string>();

  constructor() {
    this.tickets = deepClone(MOCK_TICKETS as Ticket[]);
    this.alerts = deepClone(MOCK_ORDER_CHANGES as OrderChangeAlertData[]);
    this.availability = deepClone(MOCK_DISH_AVAILABILITY as DishAvailability[]);
    this.wasteLogs = deepClone(MOCK_WASTE_LOGS as WasteLogEntry[]);
  }

  async getTickets(): Promise<Ticket[]> {
    await simulateLatency(150);
    return deepClone(this.tickets);
  }

  async getPendingOrderChanges(): Promise<OrderChangeAlertData[]> {
    await simulateLatency(100);
    return deepClone(this.alerts.filter((a) => !a.acknowledged));
  }

  async acknowledgeOrderChange(
    alertId: string,
    idempotencyKey?: string
  ): Promise<{ alert: OrderChangeAlertData; ticket: Ticket }> {
    if (idempotencyKey && this.processedKeys.has(idempotencyKey)) {
      const alert = this.alerts.find((a) => a.id === alertId);
      const ticket = this.tickets.find((t) => t.id === alert?.ticketId);
      return { alert: deepClone(alert!), ticket: deepClone(ticket!) };
    }
    if (idempotencyKey) {
      this.processedKeys.add(idempotencyKey);
    }
    await simulateLatency(150);

    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) {
      throw createNotFoundError('OrderChangeAlert', alertId);
    }

    const ticket = this.tickets.find((t) => t.id === alert.ticketId);
    if (!ticket) {
      throw createNotFoundError('Ticket', alert.ticketId);
    }

    alert.acknowledged = true;

    const item = ticket.items.find((i) => i.id === alert.itemId);
    if (item) {
      if (alert.variant === 'CANCEL_ITEM') {
        item.status = 'REJECTED';
      } else if (alert.variant === 'EDIT_NOTE' && alert.newNote) {
        item.notes = alert.newNote;
      }
    }

    return { alert: deepClone(alert), ticket: deepClone(ticket) };
  }

  async deferOrderChange(alertId: string): Promise<void> {
    await simulateLatency(50);
    // Defer keeps the alert pending (no-op)
  }

  async listDishAvailability(): Promise<DishAvailability[]> {
    await simulateLatency(120);
    return deepClone(this.availability);
  }

  async markSoldOut(dishId: string, idempotencyKey: string): Promise<DishAvailability> {
    if (!idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }
    const found = this.availability.find((d) => d.dishId === dishId);
    if (!found) {
      throw createNotFoundError('DishAvailability', dishId);
    }

    if (this.processedKeys.has(idempotencyKey)) {
      return deepClone(found);
    }
    this.processedKeys.add(idempotencyKey);
    await simulateLatency(150);

    found.lastStock = found.remainingPortions;
    found.remainingPortions = 0;
    found.status = 'SOLD_OUT';
    found.soldOutAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    found.markedBy = 'Đầu bếp (KDS)';

    return deepClone(found);
  }

  async reopenDish(dishId: string, quantity: number, idempotencyKey: string): Promise<DishAvailability> {
    if (!idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }
    if (!quantity || quantity < 1) {
      throw createValidationError('Số lượng mở bán lại phải >= 1');
    }
    const found = this.availability.find((d) => d.dishId === dishId);
    if (!found) {
      throw createNotFoundError('DishAvailability', dishId);
    }

    if (this.processedKeys.has(idempotencyKey)) {
      return deepClone(found);
    }
    this.processedKeys.add(idempotencyKey);
    await simulateLatency(150);

    found.remainingPortions = quantity;
    found.status = 'AVAILABLE';
    found.soldOutAt = undefined;
    found.markedBy = undefined;

    return deepClone(found);
  }

  async getWasteDishOptions(): Promise<WasteDishOption[]> {
    await simulateLatency(100);
    return this.availability.map((d) => ({
      dishId: d.dishId,
      dishName: d.dishName,
      stockQuantity: d.status === 'SOLD_OUT' ? 0 : d.remainingPortions,
    }));
  }

  async getWasteTodayStats(): Promise<WasteTodayStats> {
    await simulateLatency(80);
    const logCount = this.wasteLogs.length;
    const portionCount = this.wasteLogs.reduce((sum, w) => sum + w.quantity, 0);
    return { logCount, portionCount };
  }

  async createWasteLog(req: CreateWasteLogRequest): Promise<WasteLogEntry> {
    if (!req.idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }
    const foundLogged = this.wasteLogs.find((w) => w.idempotencyKey === req.idempotencyKey);
    if (foundLogged) {
      return deepClone(foundLogged);
    }
    if (this.processedKeys.has(req.idempotencyKey)) {
      const match = this.wasteLogs.find((w) => w.idempotencyKey === req.idempotencyKey);
      if (match) return deepClone(match);
    }
    this.processedKeys.add(req.idempotencyKey);

    await simulateLatency(150);

    const dish = this.availability.find((d) => d.dishId === req.dishId);
    if (!dish) {
      throw createNotFoundError('Dish', req.dishId);
    }

    const availableStock = dish.status === 'SOLD_OUT' ? 0 : dish.remainingPortions;
    if (availableStock === 0) {
      throw createValidationError('Món đang hết — không còn phần nào để ghi hủy');
    }
    if (!req.quantity || req.quantity < 1) {
      throw createValidationError('Số lượng ghi hủy phải >= 1');
    }
    if (req.quantity > availableStock) {
      throw createValidationError(`Số lượng ghi hủy (${req.quantity}) vượt quá tồn kho (${availableStock})`);
    }

    if (req.reason === 'Lý do khác' && (!req.note || !req.note.trim())) {
      throw createValidationError('Vui lòng ghi rõ lý do khi chọn "Lý do khác"');
    }

    // Role check: Chỉ HEAD_CHEF/CHEF/Bếp trưởng được phép ghi hủy
    // SECURITY NOTE: API backend bắt buộc phải enforce quyền này ở server-side
    const role = (req.recordedByRole || 'STAFF').toUpperCase();
    const isChef = role === 'HEAD_CHEF' || role === 'CHEF' || role.includes('CHEF');
    if (!isChef) {
      throw createValidationError('Chỉ Bếp trưởng mới có quyền ghi hủy món');
    }

    // Trừ kho món
    dish.remainingPortions -= req.quantity;
    if (dish.remainingPortions <= 0) {
      dish.remainingPortions = 0;
      dish.status = 'SOLD_OUT';
      dish.soldOutAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    const newLog: WasteLogEntry = {
      id: `waste-${Date.now()}`,
      dishId: req.dishId,
      dishName: dish.dishName,
      quantity: req.quantity,
      reason: req.reason,
      note: req.note?.trim(),
      recordedById: req.recordedById || 'usr-head-chef',
      recordedByName: req.recordedByName || 'Bếp trưởng Minh',
      recordedByRole: req.recordedByRole || 'HEAD_CHEF',
      recordedAt: new Date().toISOString(),
      idempotencyKey: req.idempotencyKey,
    };

    this.wasteLogs.push(newLog);
    return deepClone(newLog);
  }

  async getTicketById(ticketId: string): Promise<Ticket> {
    await simulateLatency(100);
    const found = this.tickets.find((t) => t.id === ticketId);
    if (!found) {
      throw createNotFoundError('Ticket', ticketId);
    }
    return deepClone(found);
  }

  async updateTicketStatus(
    ticketId: string,
    status: OrderItemStatus,
    idempotencyKey: string
  ): Promise<Ticket> {
    if (!idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }
    await simulateLatency(150);

    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw createNotFoundError('Ticket', ticketId);
    }

    if (this.processedKeys.has(idempotencyKey)) {
      return deepClone(ticket);
    }
    this.processedKeys.add(idempotencyKey);

    ticket.status = status;
    ticket.items.forEach((item) => {
      item.status = status;
    });

    return deepClone(ticket);
  }

  async updateItemStatus(
    ticketId: string,
    itemId: string,
    status: OrderItemStatus,
    idempotencyKey: string
  ): Promise<Ticket> {
    if (!idempotencyKey) {
      throw createValidationError('idempotencyKey là bắt buộc');
    }
    await simulateLatency(150);

    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw createNotFoundError('Ticket', ticketId);
    }

    if (this.processedKeys.has(idempotencyKey)) {
      return deepClone(ticket);
    }
    this.processedKeys.add(idempotencyKey);

    const item = ticket.items.find((i) => i.id === itemId);
    if (!item) {
      throw createNotFoundError('OrderItem', itemId);
    }

    item.status = status;

    // Cập nhật ticket status suy ra nếu mọi items đã READY
    const allReady = ticket.items.every((i) => i.status === 'READY' || i.status === 'SERVED');
    if (allReady) {
      ticket.status = 'READY';
    }

    return deepClone(ticket);
  }
}

export const kdsService = new MockKdsService();
