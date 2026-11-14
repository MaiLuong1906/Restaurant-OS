/**
 * Dữ liệu MẪU cho các trang demo trong route group (demo).
 * Không phải dữ liệu thật, không gọi API. Mọi giá tiền đều là số nguyên VND.
 */

export type DishCategory = 'Khai vị' | 'Món chính' | 'Lẩu' | 'Đồ uống' | 'Tráng miệng';

export interface DemoDish {
  id: string;
  name: string;
  price: number;
  category: DishCategory;
  description: string;
  /** Ảnh món mẫu (file local trong public/images/dishes) — team thay bằng ảnh thật của quán. */
  image: string;
}

export const DEMO_DISHES: DemoDish[] = [
  { id: 'd1', name: 'Nem Rán Phố Cổ', price: 85000, category: 'Khai vị', description: 'Tôm thịt, giòn rụm, chấm mắm pha.', image: '/images/dishes/d1.jpg' },
  { id: 'd2', name: 'Gỏi Ngó Sen Tôm Thịt', price: 95000, category: 'Khai vị', description: 'Ngó sen tươi, tôm đất, rau thơm.', image: '/images/dishes/d2.jpg' },
  { id: 'd3', name: 'Phở Bò Thăn Áp Chảo', price: 125000, category: 'Món chính', description: 'Thăn bò áp chảo, nước dùng 12 giờ.', image: '/images/dishes/d3.jpg' },
  { id: 'd4', name: 'Bò Cuộn Nấm Nướng', price: 145000, category: 'Món chính', description: 'Bò cuộn nấm kim châm, sốt tiêu đen.', image: '/images/dishes/d4.jpg' },
  { id: 'd5', name: 'Lẩu Riêu Cua Bắp Bò', price: 320000, category: 'Lẩu', description: 'Riêu cua đồng, bắp bò, sườn sụn.', image: '/images/dishes/d5.jpg' },
  { id: 'd6', name: 'Trà Sen Long Nhãn', price: 45000, category: 'Đồ uống', description: 'Trà sen ướp, long nhãn, hạt chia.', image: '/images/dishes/d6.jpg' },
  { id: 'd7', name: 'Chè Ba Màu', price: 35000, category: 'Tráng miệng', description: 'Đậu xanh, sương sa, nước cốt dừa.', image: '/images/dishes/d7.jpg' },
];

export type TableStatus = 'empty' | 'inuse' | 'overdue' | 'cleaning';
export type TableArea = 'Tầng 1' | 'Tầng 2' | 'Sân vườn';

export interface DemoTable {
  id: string;
  label: string;
  status: TableStatus;
  guests: number;
  total: number;
  /** v5: số chỗ ngồi quyết định kích thước ô bàn trên sơ đồ. */
  seats: number;
  area: TableArea;
  /** Phút đã ngồi (0 với bàn trống / cần dọn). */
  seatedMin: number;
  /** Nhân viên phụ trách bàn (rỗng với bàn trống / cần dọn). */
  staff: string;
}

export const DEMO_TABLES: DemoTable[] = [
  { id: 't1', label: 'Bàn 01', status: 'empty', guests: 0, total: 0, seats: 2, area: 'Tầng 1', seatedMin: 0, staff: '' },
  { id: 't2', label: 'Bàn 02', status: 'inuse', guests: 2, total: 185000, seats: 2, area: 'Tầng 1', seatedMin: 42, staff: 'Lan' },
  { id: 't3', label: 'Bàn 03', status: 'inuse', guests: 4, total: 420000, seats: 4, area: 'Tầng 1', seatedMin: 35, staff: 'Tuấn' },
  { id: 't4', label: 'Bàn 04', status: 'overdue', guests: 4, total: 295000, seats: 4, area: 'Tầng 1', seatedMin: 68, staff: 'Minh Anh' },
  { id: 't5', label: 'Bàn 05', status: 'cleaning', guests: 0, total: 0, seats: 2, area: 'Tầng 1', seatedMin: 0, staff: '' },
  { id: 't6', label: 'Bàn 06', status: 'inuse', guests: 3, total: 150000, seats: 4, area: 'Tầng 1', seatedMin: 18, staff: 'Lan' },
  { id: 't7', label: 'Bàn 07', status: 'empty', guests: 0, total: 0, seats: 6, area: 'Tầng 2', seatedMin: 0, staff: '' },
  { id: 't8', label: 'Bàn 08', status: 'inuse', guests: 6, total: 640000, seats: 8, area: 'Tầng 2', seatedMin: 52, staff: 'Tuấn' },
  { id: 't9', label: 'Bàn 09', status: 'overdue', guests: 2, total: 210000, seats: 6, area: 'Tầng 2', seatedMin: 61, staff: 'Minh Anh' },
  { id: 't10', label: 'Bàn 10', status: 'cleaning', guests: 0, total: 0, seats: 2, area: 'Sân vườn', seatedMin: 0, staff: '' },
  { id: 't11', label: 'Bàn 11', status: 'empty', guests: 0, total: 0, seats: 4, area: 'Sân vườn', seatedMin: 0, staff: '' },
  { id: 't12', label: 'Bàn 12', status: 'inuse', guests: 5, total: 380000, seats: 6, area: 'Sân vườn', seatedMin: 27, staff: 'Lan' },
];

export type TableItemStatus = 'waiting' | 'cooking' | 'served';

export interface DemoTableItem {
  id: string;
  name: string;
  qty: number;
  status: TableItemStatus;
}

/** Món của từng bàn (mẫu) — panel POS v5 hiển thị danh sách này, không chỉ Tạm tính. */
export const DEMO_TABLE_ITEMS: Record<string, DemoTableItem[]> = {
  t2: [
    { id: 't2i1', name: 'Phở Bò Thăn Áp Chảo', qty: 1, status: 'served' },
    { id: 't2i2', name: 'Trà Sen Long Nhãn', qty: 2, status: 'served' },
  ],
  t3: [
    { id: 't3i1', name: 'Gỏi Ngó Sen Tôm Thịt', qty: 1, status: 'served' },
    { id: 't3i2', name: 'Bò Cuộn Nấm Nướng', qty: 2, status: 'cooking' },
    { id: 't3i3', name: 'Chè Ba Màu', qty: 2, status: 'waiting' },
  ],
  t4: [
    { id: 't4i1', name: 'Nem Rán Phố Cổ', qty: 2, status: 'waiting' },
    { id: 't4i2', name: 'Lẩu Riêu Cua Bắp Bò', qty: 1, status: 'cooking' },
  ],
  t6: [
    { id: 't6i1', name: 'Nem Rán Phố Cổ', qty: 1, status: 'served' },
    { id: 't6i2', name: 'Trà Sen Long Nhãn', qty: 1, status: 'waiting' },
  ],
  t8: [
    { id: 't8i1', name: 'Lẩu Riêu Cua Bắp Bò', qty: 1, status: 'cooking' },
    { id: 't8i2', name: 'Bò Cuộn Nấm Nướng', qty: 3, status: 'cooking' },
    { id: 't8i3', name: 'Chè Ba Màu', qty: 3, status: 'waiting' },
  ],
  t9: [
    { id: 't9i1', name: 'Lẩu Riêu Cua Bắp Bò', qty: 1, status: 'waiting' },
  ],
  t12: [
    { id: 't12i1', name: 'Phở Bò Thăn Áp Chảo', qty: 2, status: 'served' },
    { id: 't12i2', name: 'Gỏi Ngó Sen Tôm Thịt', qty: 1, status: 'cooking' },
  ],
};

export type KdsStatus = 'waiting' | 'cooking' | 'done';

export type KdsStation = 'grill' | 'hotpot';

export interface DemoKdsOrder {
  id: string;
  table: string;
  dish: string;
  quantity: number;
  status: KdsStatus;
  elapsedMin: number;
  overdue: boolean;
  /** Trạm bếp phụ trách món (demo): grill = Bếp Nướng, hotpot = Bếp Lẩu & Nước dùng. */
  station: KdsStation;
  /** Số bàn gộp nấu theo lô (ý nghĩa thật của "Lô"): hiển thị "Nấu theo lô · gộp N bàn". */
  batchTables?: number;
  allergy?: string;
  note?: string;
}

export const DEMO_KDS_ORDERS: DemoKdsOrder[] = [
  { id: 'o1', table: 'Bàn 04', dish: 'Nem Rán Phố Cổ', quantity: 2, status: 'waiting', elapsedMin: 18, overdue: true, station: 'grill', batchTables: 5, allergy: 'Dị ứng đậu phộng' },
  { id: 'o2', table: 'Bàn 09', dish: 'Lẩu Riêu Cua Bắp Bò', quantity: 1, status: 'waiting', elapsedMin: 12, overdue: false, station: 'hotpot' },
  { id: 'o7', table: 'Bàn 04', dish: 'Gỏi Ngó Sen Tôm Thịt', quantity: 1, status: 'waiting', elapsedMin: 10, overdue: false, station: 'grill' },
  { id: 'o3', table: 'Bàn 02', dish: 'Phở Bò Thăn Áp Chảo', quantity: 1, status: 'cooking', elapsedMin: 8, overdue: false, station: 'hotpot', note: 'Ít cay' },
  { id: 'o8', table: 'Bàn 07', dish: 'Phở Bò Thăn Áp Chảo', quantity: 2, status: 'cooking', elapsedMin: 6, overdue: false, station: 'hotpot' },
  { id: 'o4', table: 'Bàn 08', dish: 'Bò Cuộn Nấm Nướng', quantity: 3, status: 'cooking', elapsedMin: 16, overdue: true, station: 'grill', batchTables: 3, note: 'Không hành' },
  { id: 'o5', table: 'Bàn 03', dish: 'Trà Sen Long Nhãn', quantity: 4, status: 'done', elapsedMin: 5, overdue: false, station: 'grill' },
  { id: 'o6', table: 'Bàn 06', dish: 'Gỏi Ngó Sen Tôm Thịt', quantity: 1, status: 'done', elapsedMin: 9, overdue: false, station: 'grill' },
];

export interface DemoKpi {
  label: string;
  value: string;
  sub: string;
  /** v5: xu hướng so với hôm qua, ví dụ "▲ 12%". Dấu ▲/▼ là ký tự văn bản, không phải emoji. */
  trend: string;
  trendUp: boolean;
  /** v6: sparkline 7 điểm cho KPI, và cờ cảnh báo (giá trị hiển thị đỏ cảnh báo). */
  spark: number[];
  alert?: boolean;
}

export const DEMO_KPIS: DemoKpi[] = [
  { label: 'Doanh thu hôm nay', value: '14.850.000 ₫', sub: 'Mở ca lúc 10:00', trend: '▲ 12% so với hôm qua', trendUp: true, spark: [9, 11, 10, 13, 14, 16, 15] },
  { label: 'Bàn đang phục vụ', value: '18 / 24', sub: '75% công suất giờ trưa', trend: '▲ 3 bàn so với hôm qua', trendUp: true, spark: [12, 13, 14, 15, 16, 17, 18] },
  { label: 'Món quá SLA', value: '2 món', sub: 'Bàn 04, Bàn 09 (SLA 15 phút)', trend: '▼ 1 món so với hôm qua', trendUp: true, spark: [4, 3, 5, 3, 2, 3, 2], alert: true },
  { label: 'Chờ phê duyệt', value: '1 yêu cầu', sub: 'Hủy 1 đĩa do nhầm bàn', trend: '— bằng hôm qua', trendUp: true, spark: [1, 2, 1, 1, 0, 1, 1] },
];

export type StaffRole = 'Quản lý' | 'Thu ngân' | 'Phục vụ' | 'Bếp';
export type StaffStatus = 'Đang làm' | 'Nghỉ' | 'Chưa vào ca';

export interface DemoStaff {
  id: string;
  name: string;
  role: StaffRole;
  shift: string;
  status: StaffStatus;
}

/** Nhân viên mẫu cho trang quản lý nhân viên v5. */
export const DEMO_STAFF: DemoStaff[] = [
  { id: 's1', name: 'Minh Anh', role: 'Quản lý', shift: 'Ca tối 17:00–23:00', status: 'Đang làm' },
  { id: 's2', name: 'Tuấn', role: 'Thu ngân', shift: 'Ca tối 17:00–23:00', status: 'Đang làm' },
  { id: 's3', name: 'Lan', role: 'Phục vụ', shift: 'Ca tối 17:00–23:00', status: 'Đang làm' },
  { id: 's4', name: 'Huy', role: 'Bếp', shift: 'Ca tối 17:00–23:00', status: 'Đang làm' },
  { id: 's5', name: 'Mai', role: 'Phục vụ', shift: 'Ca sáng 07:00–13:00', status: 'Nghỉ' },
  { id: 's6', name: 'Nam', role: 'Phục vụ', shift: 'Ca tối 17:00–23:00', status: 'Chưa vào ca' },
];

/** Lịch ca tuần mẫu: hàng = nhân viên, cột = ngày, giá trị = ca ('' = nghỉ). */
export const DEMO_SHIFT_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const DEMO_SHIFT_GRID: Record<string, string[]> = {
  s1: ['Tối', 'Tối', 'Nghỉ', 'Tối', 'Tối', 'Tối', 'Tối'],
  s2: ['Tối', 'Nghỉ', 'Tối', 'Tối', 'Tối', 'Tối', 'Nghỉ'],
  s3: ['Tối', 'Tối', 'Tối', 'Nghỉ', 'Tối', 'Tối', 'Tối'],
  s4: ['Sáng', 'Sáng', 'Sáng', 'Sáng', 'Nghỉ', 'Tối', 'Tối'],
  s5: ['Sáng', 'Sáng', 'Nghỉ', 'Sáng', 'Sáng', 'Sáng', 'Nghỉ'],
  s6: ['Nghỉ', 'Tối', 'Tối', 'Tối', 'Tối', 'Nghỉ', 'Tối'],
};

export interface DemoCashClose {
  staff: string;
  expected: number;
  actual: number;
}

/** Chốt ca mẫu: chênh lệch = thực tế − kỳ vọng, hiển thị kèm dấu +/−. */
export const DEMO_CASH_CLOSE: DemoCashClose[] = [
  { staff: 'Tuấn (Thu ngân)', expected: 14850000, actual: 14850000 },
  { staff: 'Lan (Phục vụ)', expected: 3200000, actual: 3150000 },
  { staff: 'Minh Anh (Quản lý)', expected: 0, actual: 50000 },
];

export const DEMO_ALERTS: string[] = [
  'Bàn 04 quá SLA 3 phút 15 giây — Nem Rán Phố Cổ (dị ứng đậu phộng).',
  'Bàn 09 quá SLA 4 phút 10 giây — Lẩu Riêu Cua Bắp Bò gọi thêm đợt 2.',
  'Thịt bắp bò còn 4,2 kg, dưới ngưỡng an toàn 15 kg.',
];
