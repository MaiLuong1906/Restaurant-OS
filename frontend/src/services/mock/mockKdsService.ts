import { Ticket, OrderItemStatus } from '../../types';
import { MOCK_TICKETS } from './data/kdsMockData';
import { simulateLatency, deepClone, createNotFoundError, createValidationError } from './mockUtils';

export interface KdsService {
  getTickets(): Promise<Ticket[]>;
  getTicketById(ticketId: string): Promise<Ticket>;
  updateTicketStatus(ticketId: string, status: OrderItemStatus, idempotencyKey: string): Promise<Ticket>;
  updateItemStatus(ticketId: string, itemId: string, status: OrderItemStatus, idempotencyKey: string): Promise<Ticket>;
}

export class MockKdsService implements KdsService {
  private tickets: Ticket[];
  private processedKeys = new Set<string>();

  constructor() {
    this.tickets = deepClone(MOCK_TICKETS as Ticket[]);
  }

  async getTickets(): Promise<Ticket[]> {
    await simulateLatency(150);
    return deepClone(this.tickets);
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
