/**
 * Centralized Admin Mock Data Layer
 * Tuân thủ quy chuẩn kiến trúc mock service của Monorepo Restaurant OS.
 */

import { Bill } from '@/app/(admin)/bills/bills-helpers';

// ============================================================================
// 1. BILLS MOCK DATA (Hóa đơn & Chứng từ)
// ============================================================================
export const INITIAL_BILLS: Bill[] = [
  {
    id: '#ORD-9024',
    eInvoiceCode: 'HD-2024-009024',
    time: '19:42:15',
    table: 'Bàn VIP-02',
    customer: 'Ông Trần Hoàng Long',
    cashier: 'Nguyễn Văn Nam',
    items: [
      { name: 'Royal Lamb Biryani', qty: 2, price: 650000 },
      { name: 'Château Margaux 2015', qty: 1, price: 1850000 },
      { name: 'Garlic Butter Naan', qty: 3, price: 100000 },
    ],
    subtotal: 3450000,
    discount: 0,
    vat: 276000,
    total: 3726000,
    paymentMethod: 'VIETQR',
    status: 'PAID',
    cqtVerified: true,
    idempotencyKey: 'idemp-bill-9024',
  },
  {
    id: '#ORD-9023',
    eInvoiceCode: 'HD-2024-009023',
    time: '19:28:40',
    table: 'Bàn T1-04',
    customer: 'Khách Vãng Lai',
    cashier: 'Mai Thị Hoa',
    items: [
      { name: 'Butter Chicken Masala', qty: 2, price: 280000 },
      { name: 'Saffron Pilau Rice', qty: 2, price: 120000 },
      { name: 'Mango Lassi', qty: 2, price: 85000 },
    ],
    subtotal: 970000,
    discount: 50000,
    vat: 73600,
    total: 993600,
    paymentMethod: 'CASH',
    status: 'PAID',
    cqtVerified: true,
    idempotencyKey: 'idemp-bill-9023',
  },
  {
    id: '#ORD-9022',
    eInvoiceCode: 'HD-2024-009022',
    time: '19:15:02',
    table: 'Bàn T1-02',
    customer: 'Bà Lê Kim Ngân (Thành Viên Gold)',
    cashier: 'Mai Thị Hoa',
    items: [
      { name: 'Tandoori King Prawns', qty: 2, price: 480000 },
      { name: 'Palak Paneer', qty: 1, price: 210000 },
      { name: 'Cheese Garlic Naan', qty: 4, price: 90000 },
    ],
    subtotal: 1530000,
    discount: 153000,
    vat: 110160,
    total: 1487160,
    paymentMethod: 'CARD',
    status: 'PAID',
    cqtVerified: true,
    idempotencyKey: 'idemp-bill-9022',
  },
  {
    id: '#ORD-9021',
    time: '18:55:10',
    table: 'Bàn OUT-01',
    customer: 'Khách Đặt Trước',
    cashier: 'Phạm Đức Duy',
    items: [
      { name: 'Bò Lúc Lắc Wagyu A4 & Nấm Truffle', qty: 1, price: 480000 },
    ],
    subtotal: 480000,
    discount: 0,
    vat: 38400,
    total: 518400,
    paymentMethod: 'CASH',
    status: 'VOIDED',
    cqtVerified: false,
    voidReason: 'Khách đổi món trước chế biến',
    idempotencyKey: 'idemp-bill-9021',
  },
  {
    id: '#ORD-9020',
    eInvoiceCode: 'HD-2024-009020',
    time: '18:40:22',
    table: 'Bàn VIP-01',
    customer: 'Công ty Cổ Phần Alpha Tech',
    cashier: 'Nguyễn Văn Nam',
    items: [
      { name: 'Thịt Cừu Nướng Rogan Josh', qty: 3, price: 420000 },
      { name: 'Bánh Samosa Thập Cẩm', qty: 4, price: 150000 },
      { name: 'Chai Rượu Vang Đỏ Shiraz', qty: 2, price: 1200000 },
    ],
    subtotal: 4260000,
    discount: 426000,
    vat: 306720,
    total: 4140720,
    paymentMethod: 'TRANSFER',
    status: 'PAID',
    cqtVerified: true,
    idempotencyKey: 'idemp-bill-9020',
  },
  {
    id: '#ORD-9019',
    time: '18:22:15',
    table: 'Bàn T1-06',
    customer: 'Khách Vãng Lai',
    cashier: 'Mai Thị Hoa',
    items: [
      { name: 'Lobster Thermidor Thượng Hạng', qty: 1, price: 1650000 },
      { name: 'Súp Hải Sản saffron', qty: 2, price: 165000 },
    ],
    subtotal: 1980000,
    discount: 0,
    vat: 158400,
    total: 2138400,
    paymentMethod: 'VIETQR',
    status: 'PENDING_CQT',
    cqtVerified: false,
    idempotencyKey: 'idemp-bill-9019',
  },
  {
    id: '#ORD-9018',
    eInvoiceCode: 'HD-2024-009018',
    time: '17:50:00',
    table: 'Bàn T1-01',
    customer: 'Anh Vũ Đình Tuấn',
    cashier: 'Phạm Đức Duy',
    items: [
      { name: 'Cà Ri Gà Korma Hạt Điều', qty: 1, price: 290000 },
      { name: 'Cơm Nị Nghệ Tây', qty: 1, price: 110000 },
      { name: 'Trà Sữa Masala Nóng', qty: 2, price: 65000 },
    ],
    subtotal: 530000,
    discount: 0,
    vat: 42400,
    total: 572400,
    paymentMethod: 'VIETQR',
    status: 'PAID',
    cqtVerified: true,
    idempotencyKey: 'idemp-bill-9018',
  },
];

// ============================================================================
// 2. TABLES MOCK DATA (Sơ đồ bàn ăn)
// ============================================================================
export interface TableOrderItem {
  name: string;
  desc: string;
  price: number;
}

export interface TableData {
  id: string;
  name: string;
  capacity: string;
  status: 'Trống' | 'Đang dùng' | 'Chờ thanh toán' | 'Quá 90p' | 'Đang dọn';
  duration: number; // in minutes
  waiter: string;
  zone: 'floor1' | 'floor2' | 'terrace';
  orders: TableOrderItem[];
}

export const INITIAL_TABLES: Record<string, TableData> = {
  A01: {
    id: 'A01',
    name: 'Bàn A01',
    capacity: '2 Chỗ',
    status: 'Trống',
    duration: 0,
    waiter: 'Chưa gán',
    zone: 'floor1',
    orders: [],
  },
  A02: {
    id: 'A02',
    name: 'Bàn A02',
    capacity: '4 Chỗ',
    status: 'Trống',
    duration: 0,
    waiter: 'Mai Thị Hoa',
    zone: 'floor1',
    orders: [],
  },
  A03: {
    id: 'A03',
    name: 'Bàn A03',
    capacity: '4 Chỗ',
    status: 'Chờ thanh toán',
    duration: 80,
    waiter: 'Mai Thị Hoa (FOH Lead)',
    zone: 'floor1',
    orders: [
      { name: '02x Tasting Menu Palace Special', desc: 'Bếp nướng & lẩu · Đã ra món', price: 1800000 },
      { name: '01x Masala Chai Pot', desc: 'Quầy Bar · Đã phục vụ', price: 380000 },
    ],
  },
  VIP01: {
    id: 'VIP01',
    name: 'Bàn VIP 01',
    capacity: '6 Chỗ',
    status: 'Đang dùng',
    duration: 45,
    waiter: 'Nguyễn Văn Nam',
    zone: 'floor2',
    orders: [
      { name: '02x Royal Lamb Biryani Special', desc: 'Thố đất nung niêm phong bột nướng', price: 720000 },
      { name: '01x Château Margaux 2015', desc: 'Hầm rượu vang Connaught · Decanter 30p', price: 8500000 },
    ],
  },
  VIP04: {
    id: 'VIP04',
    name: 'Bàn VIP 04',
    capacity: '8 Chỗ',
    status: 'Quá 90p',
    duration: 105,
    waiter: 'Lê Thùy Linh (Quản lý)',
    zone: 'floor2',
    orders: [
      { name: '04x Tandoori King Prawns Thali', desc: 'Khay tiệc hải sản lớn', price: 2100000 },
      { name: '02x Champagne Dom Pérignon', desc: 'Phục vụ xô đá tinh thể', price: 14200000 },
    ],
  },
  B01: {
    id: 'B01',
    name: 'Bàn B01',
    capacity: '2 Chỗ',
    status: 'Trống',
    duration: 0,
    waiter: 'Chưa gán',
    zone: 'floor1',
    orders: [],
  },
  B02: {
    id: 'B02',
    name: 'Bàn B02',
    capacity: '4 Chỗ',
    status: 'Đang dùng',
    duration: 35,
    waiter: 'Nguyễn Văn Nam',
    zone: 'floor1',
    orders: [
      { name: '02x Butter Chicken Masala', desc: 'Kèm cơm Basmati dẻo', price: 580000 },
      { name: '04x Garlic Naan Basket', desc: 'Bánh mì nướng tỏi bơ nóng hổi', price: 400000 },
    ],
  },
  B03: {
    id: 'B03',
    name: 'Bàn B03',
    capacity: '4 Chỗ',
    status: 'Đang dọn',
    duration: 7,
    waiter: 'Lê Văn An',
    zone: 'floor1',
    orders: [],
  },
  T01: {
    id: 'T01',
    name: 'Bàn T01 (Sân vườn)',
    capacity: '4 Chỗ',
    status: 'Trống',
    duration: 0,
    waiter: 'Chưa gán',
    zone: 'terrace',
    orders: [],
  },
  T02: {
    id: 'T02',
    name: 'Bàn T02 (Sân vườn)',
    capacity: '6 Chỗ',
    status: 'Đang dùng',
    duration: 25,
    waiter: 'Mai Thị Hoa',
    zone: 'terrace',
    orders: [
      { name: '03x Shahi Paneer Tikka', desc: 'Phô mai nướng thảo mộc', price: 690000 },
      { name: '03x Kingfisher Premium Beer', desc: 'Bia lạnh', price: 270000 },
    ],
  },
};

// ============================================================================
// 3. STAFF PAYROLL MOCK DATA (Lương & Thưởng)
// ============================================================================
export interface StaffPayroll {
  id: string;
  name: string;
  role: string;
  dept: 'BOH' | 'FOH' | 'Cashier';
  baseSalary: number;
  hours: number;
  otHours: number;
  bonus: number;
  status: string;
}

export const INITIAL_STAFF_PAYROLL: StaffPayroll[] = [
  {
    id: 'EMP-001',
    name: 'Nguyễn Văn Tuấn',
    role: 'Bếp Trưởng',
    dept: 'BOH',
    baseSalary: 15000000,
    hours: 192,
    otHours: 16,
    bonus: 1500000,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-002',
    name: 'Lê Văn An',
    role: 'Phụ Bếp',
    dept: 'BOH',
    baseSalary: 9500000,
    hours: 184,
    otHours: 8,
    bonus: 0,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-005',
    name: 'Mai Thị Hoa',
    role: 'Phục Vụ Lead',
    dept: 'FOH',
    baseSalary: 8500000,
    hours: 176,
    otHours: 12,
    bonus: 300000,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-008',
    name: 'Lê Thùy Linh',
    role: 'Thu Ngân Trưởng',
    dept: 'Cashier',
    baseSalary: 9000000,
    hours: 190,
    otHours: 0,
    bonus: 0,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-009',
    name: 'Nguyễn Văn Nam',
    role: 'Phục Vụ Runner',
    dept: 'FOH',
    baseSalary: 7500000,
    hours: 180,
    otHours: 6,
    bonus: 200000,
    status: 'SẴN SÀNG',
  },
  {
    id: 'EMP-010',
    name: 'Đặng Quốc Huy',
    role: 'Thực Tập Sinh',
    dept: 'FOH',
    baseSalary: 4500000,
    hours: 140,
    otHours: 0,
    bonus: 0,
    status: 'SẴN SÀNG',
  },
];

// ============================================================================
// 4. INVENTORY MOCK DATA (Tồn kho nguyên vật liệu)
// ============================================================================
export interface StockItem {
  sku: string;
  name: string;
  specs: string;
  location: string;
  category: 'cold' | 'chill' | 'dry' | 'wine';
  unit: string;
  actualStock: number;
  safetyStock: number;
  costPrice: number;
  totalValue: number;
  status: 'SAFE' | 'LOW' | 'CRITICAL';
  image: string;
}

export const INITIAL_STOCK: StockItem[] = [
  {
    sku: 'RAW-WAGYU-A4',
    name: 'Thịt bò Wagyu Nhật A4',
    specs: 'Striploin (Cấp đông chuẩn)',
    location: 'Kho đông #B2 (-18°C)',
    category: 'cold',
    unit: 'kg',
    actualStock: 8.2,
    safetyStock: 10.0,
    costPrice: 650000,
    totalValue: 5330000,
    status: 'LOW',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=100&auto=format&fit=crop&q=80',
  },
  {
    sku: 'RAW-SALMON-01',
    name: 'Cá hồi tươi Na Uy fillet',
    specs: 'Superior Sashimi Grade',
    location: 'Kho mát #M1 (0-4°C)',
    category: 'chill',
    unit: 'kg',
    actualStock: 4.8,
    safetyStock: 6.0,
    costPrice: 450000,
    totalValue: 2160000,
    status: 'LOW',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    sku: 'RAW-SAUCE-BOMBAY',
    name: 'Sốt Garam Masala Bombay',
    specs: 'Bếp trung tâm hầm chậm 18h',
    location: 'Kho khô #K3',
    category: 'dry',
    unit: 'lít',
    actualStock: 12.5,
    safetyStock: 4.0,
    costPrice: 180000,
    totalValue: 2250000,
    status: 'SAFE',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=100&auto=format&fit=crop&q=80',
  },
  {
    sku: 'WINE-MARGAUX-15',
    name: 'Château Margaux 2015',
    specs: 'Premier Grand Cru Classé',
    location: 'Hầm Grand Cru (14°C)',
    category: 'wine',
    unit: 'chai',
    actualStock: 3,
    safetyStock: 5,
    costPrice: 8500000,
    totalValue: 25500000,
    status: 'CRITICAL',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=100&auto=format&fit=crop&q=80',
  },
  {
    sku: 'RAW-LAMB-NZ',
    name: 'Thịt đùi cừu New Zealand',
    specs: 'Đùi rút xương cao cấp',
    location: 'Kho đông #B1 (-18°C)',
    category: 'cold',
    unit: 'kg',
    actualStock: 14.0,
    safetyStock: 8.0,
    costPrice: 320000,
    totalValue: 4480000,
    status: 'SAFE',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=100&auto=format&fit=crop&q=80',
  },
];

// ============================================================================
// 5. BCG MATRIX MOCK DATA (Ma trận chiến lược thực đơn)
// ============================================================================
export interface BcgDish {
  id: string;
  name: string;
  menuType: 'lunch' | 'dinner' | 'both';
  revenue: number;
  growth: number;
  margin: number;
  quadrant: 'stars' | 'cows' | 'questions' | 'dogs';
  action: string;
}

export const INITIAL_BCG_DISHES: BcgDish[] = [
  { id: 'bcg-1', name: 'Royal Lamb Biryani', menuType: 'dinner', revenue: 215000000, growth: 18, margin: 68, quadrant: 'stars', action: 'Mở Rộng' },
  { id: 'bcg-2', name: 'Rượu Vang Château Margaux 2015', menuType: 'dinner', revenue: 189000000, growth: 24, margin: 72, quadrant: 'stars', action: 'Duy Trì Stock' },
  { id: 'bcg-3', name: 'Tandoori King Prawns Thali', menuType: 'both', revenue: 165000000, growth: 15, margin: 64, quadrant: 'stars', action: 'Ưu Tiên Bán' },
  { id: 'bcg-4', name: 'Butter Chicken Masala', menuType: 'both', revenue: 178000000, growth: 2, margin: 61, quadrant: 'cows', action: 'Tối Ưu Cost' },
  { id: 'bcg-5', name: 'Giỏ Bánh Garlic Naan Basket', menuType: 'both', revenue: 94000000, growth: -1, margin: 78, quadrant: 'cows', action: 'Bundle Món Chính' },
  { id: 'bcg-6', name: 'Lobster Thermidor Đút Lò', menuType: 'dinner', revenue: 142000000, growth: 31, margin: 45, quadrant: 'questions', action: 'Thử Nghiệm Giá' },
  { id: 'bcg-7', name: 'Mango Lassi Alphonso', menuType: 'lunch', revenue: 38000000, growth: 28, margin: 55, quadrant: 'questions', action: 'Đẩy Marketing' },
  { id: 'bcg-8', name: 'Mixed Vegetable Curry', menuType: 'lunch', revenue: 22000000, growth: -8, margin: 38, quadrant: 'dogs', action: 'Cân Nhắc Bỏ' },
  { id: 'bcg-9', name: 'Raita Dip Bowl Phụ Trợ', menuType: 'both', revenue: 8000000, growth: -12, margin: 42, quadrant: 'dogs', action: 'Tặng Kèm Thêm' },
];

// ============================================================================
// 6. USERS MOCK DATA (Tài khoản & Phân quyền)
// ============================================================================
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  pin: string;
  discountCeiling: number;
  ipBinding: string;
  status: 'ACTIVE' | 'LOCKED';
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'ACC-001',
    name: 'Lương Nguyễn (Owner)',
    email: 'luong.owner@bombaypalace.co.uk',
    role: 'Chủ Nhà Hàng (Owner)',
    pin: '•••• (8888)',
    discountCeiling: 100,
    ipBinding: '192.168.1.10 (Bàn Manager)',
    status: 'ACTIVE',
  },
  {
    id: 'ACC-002',
    name: 'Nguyễn Văn Tuấn',
    email: 'tuan.chef@bombaypalace.co.uk',
    role: 'Bếp Trưởng (Head Chef)',
    pin: '•••• (1234)',
    discountCeiling: 0,
    ipBinding: 'KDS-BOH-01 (Màn hình Bếp)',
    status: 'ACTIVE',
  },
  {
    id: 'ACC-003',
    name: 'Trần Thị Mai',
    email: 'mai.manager@bombaypalace.co.uk',
    role: 'Quản Lý Ca (Shift Manager)',
    pin: '•••• (5678)',
    discountCeiling: 20,
    ipBinding: '192.168.1.11 (POS Trưởng)',
    status: 'ACTIVE',
  },
  {
    id: 'ACC-004',
    name: 'Lê Thùy Linh',
    email: 'linh.cashier@bombaypalace.co.uk',
    role: 'Thu Ngân (Cashier)',
    pin: '•••• (9012)',
    discountCeiling: 5,
    ipBinding: 'POS-CASHIER-01',
    status: 'ACTIVE',
  },
  {
    id: 'ACC-005',
    name: 'Nguyễn Văn Nam',
    email: 'nam.waiter@bombaypalace.co.uk',
    role: 'Phục Vụ (FOH Runner)',
    pin: 'Chưa cấp',
    discountCeiling: 0,
    ipBinding: 'Tablet-FOH-03',
    status: 'ACTIVE',
  },
  {
    id: 'ACC-006',
    name: 'Đặng Quốc Huy',
    email: 'huy.intern@bombaypalace.co.uk',
    role: 'Thực Tập Sinh (FOH)',
    pin: 'Chưa cấp',
    discountCeiling: 0,
    ipBinding: 'Không giới hạn',
    status: 'ACTIVE',
  },
];

// ============================================================================
// 7. P&L MOCK DATA (Báo cáo Lãi/Lỗ)
// ============================================================================
export interface PnlWaterfallItem {
  id: string;
  name: string;
  amount: number;
  pct: number;
  target: number;
  status: string;
  details: string;
}

export interface PnlPeriodData {
  rev: number;
  revGrowth: string;
  cogs: number;
  cogsPct: number;
  labor: number;
  laborPct: number;
  ebitda: number;
  ebitdaPct: number;
  waterfall: PnlWaterfallItem[];
}

export const PERIOD_DATA: Record<'month' | 'quarter' | 'year', PnlPeriodData> = {
  month: {
    rev: 1285000000,
    revGrowth: '+12.4% vs tháng trước',
    cogs: 379075000,
    cogsPct: 29.5,
    labor: 308400000,
    laborPct: 24.0,
    ebitda: 359800000,
    ebitdaPct: 28.0,
    waterfall: [
      { id: 'c1', name: '1. Doanh thu thuần ẩm thực (Net F&B)', amount: 1285000000, pct: 100, target: 100, status: 'BENCHMARK', details: 'Doanh thu từ 760 lượt bàn thanh toán' },
      { id: 'c2', name: '2. Giá vốn hàng bán (COGS - Nguyên vật liệu)', amount: 379075000, pct: 29.5, target: 32, status: 'TỐT (DƯỚI TARGET)', details: 'Thịt bò Wagyu: 142M, Rượu vang: 98M, Hải sản & rau củ: 139M' },
      { id: 'c3', name: '3. Chi phí nhân công (Labor & Tip Share)', amount: 308400000, pct: 24.0, target: 26, status: 'TỐT (DƯỚI TARGET)', details: 'Lương cơ bản: 245M, Thưởng & Quỹ Tip: 63.4M' },
      { id: 'c4', name: '4. Chi phí thuê mặt bằng Connaught', amount: 128500000, pct: 10.0, target: 10, status: 'CHUẨN ĐỊNH MỨC', details: 'Hợp đồng thuê 5 năm cố định' },
      { id: 'c5', name: '5. Tiện ích (Điện 3 pha, Nước, Gas Bếp)', amount: 51400000, pct: 4.0, target: 4.5, status: 'TIẾT KIỆM', details: 'Hệ thống điện thông minh tiết kiệm 12% điện sảnh' },
      { id: 'c6', name: '6. Chi phí marketing & vận hành phụ trợ', amount: 57825000, pct: 4.5, target: 5.0, status: 'TỐT (DƯỚI TARGET)', details: 'Quảng cáo Meta/Google: 35M, Khăn ăn, nến & in ấn: 22.8M' },
    ],
  },
  quarter: {
    rev: 3740000000,
    revGrowth: '+9.8% vs Quý 3',
    cogs: 1122000000,
    cogsPct: 30.0,
    labor: 935000000,
    laborPct: 25.0,
    ebitda: 972400000,
    ebitdaPct: 26.0,
    waterfall: [
      { id: 'c1', name: '1. Doanh thu thuần ẩm thực (Net F&B)', amount: 3740000000, pct: 100, target: 100, status: 'BENCHMARK', details: 'Tổng 2.240 lượt bàn trong 3 tháng' },
      { id: 'c2', name: '2. Giá vốn hàng bán (COGS - Nguyên vật liệu)', amount: 1122000000, pct: 30.0, target: 32, status: 'TỐT (DƯỚI TARGET)', details: 'Giá vốn trung bình 30% giữ vững' },
      { id: 'c3', name: '3. Chi phí nhân công (Labor & Tip Share)', amount: 935000000, pct: 25.0, target: 26, status: 'TỐT (DƯỚI TARGET)', details: 'Tỷ trọng nhân công đạt định mức' },
      { id: 'c4', name: '4. Chi phí thuê mặt bằng Connaught', amount: 385500000, pct: 10.3, target: 10, status: 'CHUẨN ĐỊNH MỨC', details: 'Chi phí mặt bằng 3 tháng' },
      { id: 'c5', name: '5. Tiện ích (Điện 3 pha, Nước, Gas Bếp)', amount: 157080000, pct: 4.2, target: 4.5, status: 'TIẾT KIỆM', details: 'Chi phí năng lượng mùa thu ổn định' },
      { id: 'c6', name: '6. Chi phí marketing & vận hành phụ trợ', amount: 168300000, pct: 4.5, target: 5.0, status: 'TỐT (DƯỚI TARGET)', details: 'Chiến dịch Private Dining mùa lễ' },
    ],
  },
  year: {
    rev: 14200000000,
    revGrowth: '+15.2% vs Năm 2023',
    cogs: 4331000000,
    cogsPct: 30.5,
    labor: 3550000000,
    laborPct: 25.0,
    ebitda: 3692000000,
    ebitdaPct: 26.0,
    waterfall: [
      { id: 'c1', name: '1. Doanh thu thuần ẩm thực (Net F&B)', amount: 14200000000, pct: 100, target: 100, status: 'BENCHMARK', details: 'Doanh thu cả năm 2024' },
      { id: 'c2', name: '2. Giá vốn hàng bán (COGS - Nguyên vật liệu)', amount: 4331000000, pct: 30.5, target: 32, status: 'TỐT (DƯỚI TARGET)', details: 'Hợp đồng mua dài hạn giúp ổn định giá thịt và rượu' },
      { id: 'c3', name: '3. Chi phí nhân công (Labor & Tip Share)', amount: 3550000000, pct: 25.0, target: 26, status: 'TỐT (DƯỚI TARGET)', details: 'Định biên nhân sự 14 nhân sự ổn định' },
      { id: 'c4', name: '4. Chi phí thuê mặt bằng Connaught', amount: 1542000000, pct: 10.8, target: 10, status: 'CHUẨN ĐỊNH MỨC', details: 'Hợp đồng mặt bằng năm 2024' },
      { id: 'c5', name: '5. Tiện ích (Điện 3 pha, Nước, Gas Bếp)', amount: 596400000, pct: 4.2, target: 4.5, status: 'TIẾT KIỆM', details: 'Tổng năng lượng tiêu thụ 12 tháng' },
      { id: 'c6', name: '6. Chi phí marketing & vận hành phụ trợ', amount: 639000000, pct: 4.5, target: 5.0, status: 'TỐT (DƯỚI TARGET)', details: 'Ngân sách xây dựng thương hiệu' },
    ],
  },
};

export const MONTHLY_TREND = [
  { month: 'T6', pct: 22, height: 55 },
  { month: 'T7', pct: 19, height: 48 },
  { month: 'T8', pct: 24, height: 60 },
  { month: 'T9', pct: 25, height: 63 },
  { month: 'T10', pct: 26, height: 66 },
  { month: 'T11', pct: 28, height: 72, isCurrent: true },
];


// ============================================================================
// 8. DASHBOARD METRICS MOCK DATA (KPI theo kỳ: live / week / month)
// ============================================================================
export interface DashboardMetrics {
  rev: number;
  revGrowth: string;
  target: string;
  targetPct: string;
  occ: string;
  occDesc: string;
  occPct: string;
  cogs: string;
  cogsDiff: string;
  kdsTime: string;
}

export const DASHBOARD_METRICS: Record<'live' | 'week' | 'month', DashboardMetrics> = {
  live: {
    rev: 42850000,
    revGrowth: '+14.2% T7 TRƯỚC',
    target: 'Target ngày: 48M',
    targetPct: '89.2% ĐẠT CHỈ TIÊU',
    occ: '28/34 bàn',
    occDesc: '6 bàn trống khả dụng',
    occPct: '82% CÔNG SUẤT',
    cogs: '31.4%',
    cogsDiff: '-1.6% TIẾT KIỆM',
    kdsTime: '08:42',
  },
  week: {
    rev: 298400000,
    revGrowth: '+8.7% W-o-W',
    target: 'Target tuần: 320M',
    targetPct: '93.2% ĐẠT CHỈ TIÊU',
    occ: '86% TB',
    occDesc: '184 lượt bàn / tuần',
    occPct: '86% CÔNG SUẤT',
    cogs: '30.2%',
    cogsDiff: '-2.8% TIẾT KIỆM',
    kdsTime: '09:15',
  },
  month: {
    rev: 1285000000,
    revGrowth: '+12.4% vs T10',
    target: 'Target tháng: 1.35B',
    targetPct: '95.1% ĐẠT CHỈ TIÊU',
    occ: '88% TB',
    occDesc: '760 lượt bàn / tháng',
    occPct: '88% CÔNG SUẤT',
    cogs: '29.5%',
    cogsDiff: '-2.5% TIẾT KIỆM',
    kdsTime: '08:50',
  },
};

// ============================================================================
// 9. BILLS SHIFT COMPARISON (Dữ liệu ca trước để tính % tăng trưởng)
// ============================================================================
/** Doanh thu ca tối #01 (ca trước) — dùng để tính % tăng trưởng KPI */
export const PREV_SHIFT_REVENUE = 11430000; // Ca Tối #01
/** Số hóa đơn ca trước */
export const PREV_SHIFT_BILL_COUNT = 6;
