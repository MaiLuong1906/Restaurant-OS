import { describe, it, expect } from 'vitest';
import {
  calculateBillItemTotal,
  calculateBillSummary,
  calculateBillsKpis,
  filterBills,
  type Bill,
  type BillItem,
} from '../bills-helpers';

describe('Admin Bills Helpers', () => {
  describe('calculateBillItemTotal', () => {
    it('tính đúng thành tiền khi số lượng và đơn giá hợp lệ', () => {
      const item: BillItem = { name: 'Wagyu A4', qty: 2, price: 480000 };
      expect(calculateBillItemTotal(item)).toBe(960000);
    });

    it('trả về 0 khi số lượng bằng 0', () => {
      const item: BillItem = { name: 'Trà đá', qty: 0, price: 15000 };
      expect(calculateBillItemTotal(item)).toBe(0);
    });
  });

  describe('calculateBillSummary', () => {
    it('tính đúng subtotal, VAT 8% và tổng tiền khi không có giảm giá', () => {
      const items: BillItem[] = [
        { name: 'Món 1', qty: 1, price: 1000000 },
        { name: 'Món 2', qty: 2, price: 500000 },
      ];
      // subtotal = 2,000,000
      // vat = 2,000,000 * 8% = 160,000
      // total = 2,160,000
      const summary = calculateBillSummary(items, 0);
      expect(summary.subtotal).toBe(2000000);
      expect(summary.vat).toBe(160000);
      expect(summary.total).toBe(2160000);
    });

    it('tính thuế VAT 8% chính xác sau khi đã trừ giảm giá', () => {
      const items: BillItem[] = [{ name: 'Set Menu', qty: 1, price: 1000000 }];
      const discount = 200000;
      // taxableAmount = 800,000
      // vat = 800,000 * 8% = 64,000
      // total = 864,000
      const summary = calculateBillSummary(items, discount);
      expect(summary.subtotal).toBe(1000000);
      expect(summary.vat).toBe(64000);
      expect(summary.total).toBe(864000);
    });

    it('làm tròn số nguyên VND cho thuế VAT', () => {
      const items: BillItem[] = [{ name: 'Món lẻ', qty: 1, price: 123456 }];
      // vat = 123456 * 0.08 = 9876.48 -> round 9876
      const summary = calculateBillSummary(items, 0);
      expect(summary.vat).toBe(9876);
      expect(summary.total).toBe(123456 + 9876);
    });
  });

  const MOCK_BILLS: Bill[] = [
    {
      id: 'INV-20261113-001',
      table: 'Bàn VIP-01',
      customer: 'Anh Hoàng Minh',
      time: '19:45',
      items: [{ name: 'Wagyu', qty: 1, price: 1000000 }],
      subtotal: 1000000,
      vat: 80000,
      discount: 0,
      total: 1080000,
      paymentMethod: 'VIETQR',
      status: 'PAID',
      cashier: 'Lương Nguyễn',
      cqtVerified: true,
      eInvoiceCode: 'HD-2026-0001',
      idempotencyKey: 'idemp-1',
    },
    {
      id: 'INV-20261113-002',
      table: 'Bàn A-02',
      customer: 'Chị Mai Lan',
      time: '19:50',
      items: [{ name: 'Cà ri cừu', qty: 1, price: 500000 }],
      subtotal: 500000,
      vat: 40000,
      discount: 50000,
      total: 490000,
      paymentMethod: 'CASH',
      status: 'PAID',
      cashier: 'Nguyễn Văn Nam',
      cqtVerified: false,
      idempotencyKey: 'idemp-2',
    },
    {
      id: 'INV-20261113-003',
      table: 'Bàn B-04',
      customer: 'Khách lẻ',
      time: '20:10',
      items: [{ name: 'Bia thủ công', qty: 2, price: 150000 }],
      subtotal: 300000,
      vat: 24000,
      discount: 0,
      total: 324000,
      paymentMethod: 'CARD',
      status: 'VOIDED',
      cashier: 'Lương Nguyễn',
      cqtVerified: false,
      voidReason: 'Khách hủy món vì việc gấp',
      idempotencyKey: 'idemp-3',
    },
  ];

  describe('calculateBillsKpis', () => {
    it('tính toán chính xác doanh thu đã thanh toán và số lượng hóa đơn', () => {
      const kpis = calculateBillsKpis(MOCK_BILLS);
      // PAID bills: INV-001 (1,080,000) + INV-002 (490,000) = 1,570,000
      expect(kpis.totalPaidRevenue).toBe(1570000);
      expect(kpis.totalPaidCount).toBe(2);
      // VOIDED bill: INV-003 (324,000)
      expect(kpis.totalVoidedAmount).toBe(324000);
      // Total discount: 50,000
      expect(kpis.totalDiscount).toBe(50000);
      // Pending CQT (INV-002 not verified, INV-003 not verified)
      expect(kpis.pendingCqtCount).toBe(2);
    });
  });

  describe('filterBills', () => {
    it('tìm kiếm theo tên khách hàng không phân biệt hoa thường', () => {
      const result = filterBills(MOCK_BILLS, { query: 'hoàng minh' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('INV-20261113-001');
    });

    it('tìm kiếm theo mã bàn', () => {
      const result = filterBills(MOCK_BILLS, { query: 'VIP-01' });
      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('Bàn VIP-01');
    });

    it('tìm kiếm theo mã hóa đơn điện tử eInvoiceCode', () => {
      const result = filterBills(MOCK_BILLS, { query: 'HD-2026-0001' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('INV-20261113-001');
    });

    it('lọc theo trạng thái VOIDED', () => {
      const result = filterBills(MOCK_BILLS, { status: 'VOIDED' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('INV-20261113-003');
    });

    it('lọc kết hợp cả trạng thái và phương thức thanh toán', () => {
      const result = filterBills(MOCK_BILLS, { status: 'PAID', method: 'VIETQR' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('INV-20261113-001');
    });

    it('trả về toàn bộ danh sách khi filter là ALL và query rỗng', () => {
      const result = filterBills(MOCK_BILLS, { query: '', status: 'ALL', method: 'ALL' });
      expect(result).toHaveLength(3);
    });
  });
});

