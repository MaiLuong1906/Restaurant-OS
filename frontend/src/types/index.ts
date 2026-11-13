// ====================================================================
// Domain Models & DTO Types for Restaurant OS
// Tuân thủ: Tiền tệ integer VND, Typed responses, Idempotency
// ====================================================================

export type Category = 'MAIN' | 'APPETIZER' | 'DRINK' | 'DESSERT';

export interface ModifierOption {
  name: string;
  priceDelta: number; // VND integer
}

export interface Modifier {
  name: string;
  options: ModifierOption[];
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number; // VND integer, ví dụ 55000
  category: Category;
  imageUrl?: string;
  isAvailable: boolean;
}

export type TableStatus = 'IDLE' | 'OCCUPIED' | 'DINING' | 'BILLING';

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  qrCodeToken: string;
  capacity: number;
  status: TableStatus;
}

export type OrderItemStatus = 'WAITING' | 'COOKING' | 'READY' | 'SERVED' | 'REJECTED';

export interface OrderItem {
  id: string;
  orderId: string;
  tableId?: string;
  tableNo?: string; // Số bàn hiển thị nổi bật trên thẻ KDS
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number; // VND
  modifiers: {
    name: string;
    selected: string;
    extraPrice: number;
  }[];
  notes?: string; // Ghi chú nấu nướng (ít ngọt, không cay...)
  allergy?: string; // Cảnh báo dị ứng thực phẩm
  slaDeadline?: string; // Mốc thời gian trễ SLA
  stationId?: string; // Trạm bếp phụ trách
  status: OrderItemStatus;
  createdAt: string;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  tableId: string;
  tableNumber: string;
  status: OrderStatus;
  totalAmount: number; // VND
  idempotencyKey?: string;
  customerNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  selectedModifiers: {
    name: string;
    selected: string;
    extraPrice: number;
  }[];
  note?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// ====================================================================
// Cashier & POS Domain Types (Use Cases: Reservation, Check-in, Split/Merge,
// Counter Settlement, Lock Table, Discount, ESC/POS, Cash Drawer, Shift Balance)
// ====================================================================

export type CashierTableStatus =
  | 'IDLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'LOCKED'
  | 'OVERDUE'
  | 'CLEANING';

export type CashierTableArea = 'Sảnh Tầng 1' | 'Tầng 2 VIP' | 'Sân vườn';

export type PaymentMethodType = 'CASH' | 'VIETQR' | 'CARD';

export interface CashierInvoiceItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number; // VND integer
  status: 'WAITING' | 'COOKING' | 'SERVED';
  note?: string;
}

export interface InvoiceSplitPart {
  id: string;
  label: string;
  amount: number; // VND integer
  status: 'UNPAID' | 'PAID';
  itemIds?: string[];
}

export interface DiscountRule {
  id: string;
  code: string;
  label: string;
  type: 'PERCENT' | 'FIXED';
  value: number; // % hoặc số nguyên VND
}

export interface CashierTable {
  id: string;
  label: string;
  seats: number;
  area: CashierTableArea;
  status: CashierTableStatus;
  guests: number;
  seatedMin: number;
  staff: string;
  items: CashierInvoiceItem[];
  depositAmount: number; // VND integer (tiền cọc đã thu từ đặt bàn)
  discountAmount: number; // VND integer (chiết khấu đã áp dụng)
  discountLabel?: string;
  reservationId?: string;
  lockedBy?: string;
  splits?: InvoiceSplitPart[];
  allergyAlert?: string;
}

export type ReservationStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';

export interface TableReservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  reservedTime: string;
  reservedDate: string;
  area: CashierTableArea;
  tableId: string;
  tableLabel: string;
  depositAmount: number; // VND integer
  depositMethod: PaymentMethodType;
  note?: string;
  status: ReservationStatus;
}

export interface CashDrawerLog {
  id: string;
  timestamp: string;
  reason: string;
  triggeredBy: string;
  idempotencyKey: string;
}

export interface ShiftSettlementRecord {
  shiftId: string;
  shiftName: string;
  area: string;
  startTime: string;
  endTime: string;
  nextShift: string;
  checkedInAt: string;
  cashierName: string;
  openingCash: number; // VND integer
  cashSales: number; // VND integer
  qrAndCardSales: number; // VND integer
  depositCashCollected: number; // VND integer
  cashRefundsOrPayouts: number; // VND integer
  actualCountedCash: number | null; // VND integer
  discrepancyReason: string;
  status: 'OPEN' | 'SETTLED';
  settledAt?: string;
  drawerOpenLogs: CashDrawerLog[];
}

