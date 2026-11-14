import { describe, it, expect } from 'vitest';

// Pure filter logic (mirror dashboard/page.tsx filteredOrders logic)
interface RecentOrder {
  id: string;
  time: string;
  table: string;
  items: string;
  method: string;
  total: number;
  subtotal: number;
  vat: number;
  waiter: string;
  status: string;
  statusClass: string;
}

function filterOrders(orders: RecentOrder[], query: string): RecentOrder[] {
  const q = query.toLowerCase();
  return orders.filter(
    (ord) =>
      ord.id.toLowerCase().includes(q) ||
      ord.table.toLowerCase().includes(q) ||
      ord.items.toLowerCase().includes(q)
  );
}

const MOCK_ORDERS: RecentOrder[] = [
  {
    id: '#ORD-9024',
    time: '19:42:15',
    table: 'Bàn VIP-02',
    items: 'Royal Lamb Biryani x2',
    method: 'VIETQR',
    total: 3450000,
    subtotal: 3194444,
    vat: 255556,
    waiter: 'Nguyễn Văn Nam',
    status: 'ĐÃ THANH TOÁN',
    statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: '#ORD-9023',
    time: '19:38:02',
    table: 'Bàn A-03',
    items: 'Tandoori King Prawns x4',
    method: 'TIỀN MẶT',
    total: 2180000,
    subtotal: 2018519,
    vat: 161481,
    waiter: 'Mai Thị Hoa',
    status: 'CHỜ THANH TOÁN',
    statusClass: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  {
    id: '#ORD-9022',
    time: '19:31:40',
    table: 'Bàn A-01',
    items: 'Butter Chicken Masala x2',
    method: 'VIETQR',
    total: 1250000,
    subtotal: 1157407,
    vat: 92593,
    waiter: 'Lê Văn An',
    status: 'ĐÃ THANH TOÁN',
    statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
];

describe('dashboard filterOrders', () => {
  it('trả về tất cả orders khi query rỗng', () => {
    expect(filterOrders(MOCK_ORDERS, '')).toHaveLength(3);
  });

  it('lọc theo order id (#ORD-9024)', () => {
    const result = filterOrders(MOCK_ORDERS, '#ORD-9024');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('#ORD-9024');
  });

  it('lọc theo tên bàn (Bàn VIP)', () => {
    const result = filterOrders(MOCK_ORDERS, 'VIP');
    expect(result).toHaveLength(1);
    expect(result[0].table).toBe('Bàn VIP-02');
  });

  it('lọc theo tên món (Tandoori)', () => {
    const result = filterOrders(MOCK_ORDERS, 'tandoori');
    expect(result).toHaveLength(1);
    expect(result[0].items).toContain('Tandoori');
  });

  it('trả về [] khi không khớp', () => {
    expect(filterOrders(MOCK_ORDERS, 'XYZ-KHÔNG-TỒN-TẠI')).toHaveLength(0);
  });

  it('tìm kiếm không phân biệt hoa thường', () => {
    expect(filterOrders(MOCK_ORDERS, 'vip')).toHaveLength(1);
    expect(filterOrders(MOCK_ORDERS, 'VIP')).toHaveLength(1);
  });

  it('lọc theo phần số đơn hàng (9023)', () => {
    const result = filterOrders(MOCK_ORDERS, '9023');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('#ORD-9023');
  });

  it('trả về nhiều kết quả khi query khớp nhiều bản ghi', () => {
    // 'Bàn A' khớp Bàn A-03 và Bàn A-01
    const result = filterOrders(MOCK_ORDERS, 'Bàn A');
    expect(result).toHaveLength(2);
  });
});
