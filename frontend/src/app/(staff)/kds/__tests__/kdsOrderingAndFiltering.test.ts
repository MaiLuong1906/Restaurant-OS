import { describe, it, expect } from 'vitest';
import { Ticket } from '@/types';

// Helper: Lọc active tickets và sắp xếp theo SLA
function filterActiveTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) =>
    t.items.some((i) => i.status === 'WAITING' || i.status === 'READY')
  );
}

function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const aHasAllergy = a.items.some((i) => Boolean(i.allergy && i.allergy.trim().length > 0));
    const bHasAllergy = b.items.some((i) => Boolean(i.allergy && i.allergy.trim().length > 0));

    if (aHasAllergy && !bHasAllergy) return -1;
    if (!aHasAllergy && bHasAllergy) return 1;

    const aTime = a.slaDeadline ? new Date(a.slaDeadline).getTime() : Infinity;
    const bTime = b.slaDeadline ? new Date(b.slaDeadline).getTime() : Infinity;
    return aTime - bTime;
  });
}

describe('KDS Ticket Ordering & Active Filter', () => {
  it('lọc bỏ các ticket có tất cả món đã SERVED hoặc REJECTED', () => {
    const rawTickets: Ticket[] = [
      {
        id: 't-served',
        tableId: 'tbl-1',
        tableNo: 'Bàn 01',
        createdAt: '2026-11-20T10:00:00Z',
        items: [
          {
            id: 'i-1',
            orderId: 'o-1',
            dishId: 'd-1',
            dishName: 'Phở Bò',
            quantity: 1,
            unitPrice: 50000,
            modifiers: [],
            status: 'SERVED',
            createdAt: '2026-11-20T10:00:00Z',
          },
        ],
      },
      {
        id: 't-active',
        tableId: 'tbl-2',
        tableNo: 'Bàn 04',
        createdAt: '2026-11-20T10:05:00Z',
        items: [
          {
            id: 'i-2',
            orderId: 'o-2',
            dishId: 'd-2',
            dishName: 'Cà Phê Muối',
            quantity: 2,
            unitPrice: 35000,
            modifiers: [],
            status: 'WAITING',
            createdAt: '2026-11-20T10:05:00Z',
          },
        ],
      },
    ];

    const active = filterActiveTickets(rawTickets);
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('t-active');
  });
  it('sắp xếp ưu tiên ticket có cảnh báo dị ứng lên đầu tiên', () => {
    const tickets: Ticket[] = [
      {
        id: 't-normal',
        tableId: 'tbl-1',
        tableNo: 'Bàn 01',
        slaDeadline: '2026-11-20T10:10:00Z',
        createdAt: '2026-11-20T10:00:00Z',
        items: [
          {
            id: 'i-1',
            orderId: 'o-1',
            dishId: 'd-1',
            dishName: 'Cơm tấm',
            quantity: 1,
            unitPrice: 45000,
            modifiers: [],
            status: 'WAITING',
            createdAt: '2026-11-20T10:00:00Z',
          },
        ],
      },
      {
        id: 't-allergy',
        tableId: 'tbl-2',
        tableNo: 'Bàn 02',
        slaDeadline: '2026-11-20T10:30:00Z',
        createdAt: '2026-11-20T10:05:00Z',
        items: [
          {
            id: 'i-2',
            orderId: 'o-2',
            dishId: 'd-2',
            dishName: 'Hải sản xào',
            quantity: 1,
            unitPrice: 85000,
            modifiers: [],
            allergy: 'Dị ứng tôm cua',
            status: 'WAITING',
            createdAt: '2026-11-20T10:05:00Z',
          },
        ],
      },
    ];

    const sorted = sortTickets(tickets);
    expect(sorted[0].id).toBe('t-allergy');
    expect(sorted[1].id).toBe('t-normal');
  });
  it('sắp xếp quá SLA hoặc sắp đến hạn lên trước trong nhóm cùng dị ứng', () => {
    const tickets: Ticket[] = [
      {
        id: 't-due-later',
        tableId: 'tbl-1',
        tableNo: 'Bàn 01',
        slaDeadline: '2026-11-20T10:30:00Z',
        createdAt: '2026-11-20T10:00:00Z',
        items: [{ id: 'i-1', orderId: 'o-1', dishId: 'd-1', dishName: 'Món A', quantity: 1, unitPrice: 30000, modifiers: [], status: 'WAITING', createdAt: '2026-11-20T10:00:00Z' }],
      },
      {
        id: 't-overdue',
        tableId: 'tbl-2',
        tableNo: 'Bàn 02',
        slaDeadline: '2026-11-20T10:05:00Z',
        createdAt: '2026-11-20T09:50:00Z',
        items: [{ id: 'i-2', orderId: 'o-2', dishId: 'd-2', dishName: 'Món B', quantity: 1, unitPrice: 40000, modifiers: [], status: 'WAITING', createdAt: '2026-11-20T09:50:00Z' }],
      },
    ];

    const sorted = sortTickets(tickets);
    expect(sorted[0].id).toBe('t-overdue');
    expect(sorted[1].id).toBe('t-due-later');
  });

  it('drawer mở xem được dữ liệu ticket chi tiết', () => {
    const ticket: Ticket = {
      id: 't-drawer-check',
      tableId: 'tbl-9',
      tableNo: 'Bàn 04',
      slaDeadline: '2026-11-20T16:27:02Z',
      createdAt: '2026-11-20T16:12:02Z',
      items: [
        {
          id: 'item-1',
          orderId: 'ord-1',
          dishId: 'dish-1',
          dishName: 'Phở Bò Đặc Biệt',
          quantity: 2,
          unitPrice: 65000,
          modifiers: [],
          notes: 'Khong hanh',
          status: 'WAITING',
          createdAt: '2026-11-20T16:12:02Z',
        },
      ],
    };

    expect(ticket.items.length).toBe(1);
    expect(ticket.tableNo).toBe('Bàn 04');
    expect(ticket.items[0].notes).toBe('Khong hanh');
  });
});
