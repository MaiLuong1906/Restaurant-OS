import { Ticket, OrderItemStatus, OrderChangeAlertData } from '../../types';
import { MOCK_TICKETS, MOCK_ORDER_CHANGES } from './data/kdsMockData';
import { simulateLatency, deepClone, createNotFoundError, createValidationError } from './mockUtils';

export interface KdsService {
  getTickets(): Promise<Ticket[]>;
  getTicketById(ticketId: string): Promise<Ticket>;
  updateTicketStatus(ticketId: string, status: OrderItemStatus, idempotencyKey: string): Promise<Ticket>;
  updateItemStatus(ticketId: string, itemId: string, status: OrderItemStatus, idempotencyKey: string): Promise<Ticket>;
  getPendingOrderChanges(): Promise<OrderChangeAlertData[]>;
  acknowledgeOrderChange(alertId: string, idempotencyKey?: string): Promise<{ alert: OrderChangeAlertData; ticket: Ticket }>;
  deferOrderChange(alertId: string): Promise<void>;
}

export class MockKdsService implements KdsService {
  private tickets: Ticket[];
  private alerts: OrderChangeAlertData[];
  private processedKeys = new Set<string>();

  constructor() {
    this.tickets = deepClone(MOCK_TICKETS as Ticket[]);
    this.alerts = deepClone(MOCK_ORDER_CHANGES as OrderChangeAlertData[]);
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
