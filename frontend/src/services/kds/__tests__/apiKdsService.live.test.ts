import { describe, it, expect } from 'vitest';
import { ApiKdsService } from '../ApiKdsService';

describe('ApiKdsService Live Integration', () => {
  it('lấy danh sách tickets thật từ BE thành công', async () => {
    const service = new ApiKdsService();
    const tickets = await service.getTickets();
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
    const t0 = tickets[0];
    expect(t0).toHaveProperty('id');
    expect(t0).toHaveProperty('tableNo');
    expect(t0.items.length).toBeGreaterThan(0);

    const ticketDetail = await service.getTicketById(t0.id);
    expect(ticketDetail.id).toBe(t0.id);
    expect(ticketDetail.tableNo).toBe(t0.tableNo);
  });
});
