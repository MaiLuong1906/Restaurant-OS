export interface BillItem {
  name: string;
  qty: number;
  price: number;
}

export type PaymentMethod = 'VIETQR' | 'CASH' | 'CARD' | 'TRANSFER';
export type BillStatus = 'PAID' | 'VOIDED' | 'PENDING_CQT';

export interface Bill {
  id: string;
  table: string;
  customer: string;
  time: string;
  items: BillItem[];
  subtotal: number;
  vat: number; // 8% VAT
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: BillStatus;
  cashier: string;
  cqtVerified: boolean;
  eInvoiceCode?: string;
  idempotencyKey: string;
  voidReason?: string;
}

/**
 * Tính thành tiền cho 1 dòng món ăn
 */
export function calculateBillItemTotal(item: BillItem): number {
  return item.qty * item.price;
}

/**
 * Tính tổng tiền hàng, thuế VAT 8% và tổng thanh toán của hóa đơn
 */
export function calculateBillSummary(
  items: BillItem[],
  discount: number = 0
): { subtotal: number; vat: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + calculateBillItemTotal(item), 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = Math.round(taxableAmount * 0.08);
  const total = taxableAmount + vat;
  return { subtotal, vat, total };
}

export interface BillsKpis {
  totalPaidRevenue: number;
  totalPaidCount: number;
  totalVoidedAmount: number;
  totalDiscount: number;
  pendingCqtCount: number;
}

/**
 * Tính toán các chỉ số KPI điều hành từ danh sách hóa đơn
 */
export function calculateBillsKpis(bills: Bill[]): BillsKpis {
  return {
    totalPaidRevenue: bills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + b.total, 0),
    totalPaidCount: bills.filter((b) => b.status === 'PAID').length,
    totalVoidedAmount: bills
      .filter((b) => b.status === 'VOIDED')
      .reduce((sum, b) => sum + b.total, 0),
    totalDiscount: bills.reduce((sum, b) => sum + b.discount, 0),
    pendingCqtCount: bills.filter((b) => b.status === 'PENDING_CQT' || !b.cqtVerified).length,
  };
}

export interface BillFilterCriteria {
  query?: string;
  status?: string;
  method?: string;
}

/**
 * Lọc danh sách hóa đơn theo từ khóa tìm kiếm, trạng thái và phương thức thanh toán
 */
export function filterBills(bills: Bill[], filters: BillFilterCriteria): Bill[] {
  const { query = '', status = 'ALL', method = 'ALL' } = filters;
  const q = query.trim().toLowerCase();

  return bills.filter((b) => {
    const matchesSearch =
      !q ||
      b.id.toLowerCase().includes(q) ||
      b.table.toLowerCase().includes(q) ||
      b.customer.toLowerCase().includes(q) ||
      b.cashier.toLowerCase().includes(q) ||
      (b.eInvoiceCode ? b.eInvoiceCode.toLowerCase().includes(q) : false);

    const matchesStatus = status === 'ALL' || b.status === status;
    const matchesMethod = method === 'ALL' || b.paymentMethod === method;

    return matchesSearch && matchesStatus && matchesMethod;
  });
}
