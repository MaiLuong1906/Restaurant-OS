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
}

export const DEMO_DISHES: DemoDish[] = [
  { id: 'd1', name: 'Nem Rán Phố Cổ', price: 85000, category: 'Khai vị', description: 'Tôm thịt, giòn rụm, chấm mắm pha.' },
  { id: 'd2', name: 'Gỏi Ngó Sen Tôm Thịt', price: 95000, category: 'Khai vị', description: 'Ngó sen tươi, tôm đất, rau thơm.' },
  { id: 'd3', name: 'Phở Bò Thăn Áp Chảo', price: 125000, category: 'Món chính', description: 'Thăn bò áp chảo, nước dùng 12 giờ.' },
  { id: 'd4', name: 'Bò Cuộn Nấm Nướng', price: 145000, category: 'Món chính', description: 'Bò cuộn nấm kim châm, sốt tiêu đen.' },
  { id: 'd5', name: 'Lẩu Riêu Cua Bắp Bò', price: 320000, category: 'Lẩu', description: 'Riêu cua đồng, bắp bò, sườn sụn.' },
  { id: 'd6', name: 'Trà Sen Long Nhãn', price: 45000, category: 'Đồ uống', description: 'Trà sen ướp, long nhãn, hạt chia.' },
  { id: 'd7', name: 'Chè Ba Màu', price: 35000, category: 'Tráng miệng', description: 'Đậu xanh, sương sa, nước cốt dừa.' },
];

export type TableStatus = 'empty' | 'inuse' | 'overdue' | 'cleaning';

export interface DemoTable {
  id: string;
  label: string;
  status: TableStatus;
  guests: number;
  total: number;
}

export const DEMO_TABLES: DemoTable[] = [
  { id: 't1', label: 'Bàn 01', status: 'empty', guests: 0, total: 0 },
  { id: 't2', label: 'Bàn 02', status: 'inuse', guests: 2, total: 185000 },
  { id: 't3', label: 'Bàn 03', status: 'inuse', guests: 4, total: 420000 },
  { id: 't4', label: 'Bàn 04', status: 'overdue', guests: 4, total: 295000 },
  { id: 't5', label: 'Bàn 05', status: 'cleaning', guests: 0, total: 0 },
  { id: 't6', label: 'Bàn 06', status: 'inuse', guests: 3, total: 150000 },
  { id: 't7', label: 'Bàn 07', status: 'empty', guests: 0, total: 0 },
  { id: 't8', label: 'Bàn 08', status: 'inuse', guests: 6, total: 640000 },
  { id: 't9', label: 'Bàn 09', status: 'overdue', guests: 2, total: 210000 },
  { id: 't10', label: 'Bàn 10', status: 'cleaning', guests: 0, total: 0 },
  { id: 't11', label: 'Bàn 11', status: 'empty', guests: 0, total: 0 },
  { id: 't12', label: 'Bàn 12', status: 'inuse', guests: 5, total: 380000 },
];

export type KdsStatus = 'waiting' | 'cooking' | 'done';

export interface DemoKdsOrder {
  id: string;
  table: string;
  dish: string;
  quantity: number;
  status: KdsStatus;
  elapsedMin: number;
  overdue: boolean;
  batch?: string;
  allergy?: string;
}

export const DEMO_KDS_ORDERS: DemoKdsOrder[] = [
  { id: 'o1', table: 'Bàn 04', dish: 'Nem Rán Phố Cổ', quantity: 2, status: 'waiting', elapsedMin: 18, overdue: true, batch: 'Lô x5', allergy: 'Dị ứng đậu phộng' },
  { id: 'o2', table: 'Bàn 09', dish: 'Lẩu Riêu Cua Bắp Bò', quantity: 1, status: 'waiting', elapsedMin: 12, overdue: false },
  { id: 'o3', table: 'Bàn 02', dish: 'Phở Bò Thăn Áp Chảo', quantity: 1, status: 'cooking', elapsedMin: 8, overdue: false },
  { id: 'o4', table: 'Bàn 08', dish: 'Bò Cuộn Nấm Nướng', quantity: 3, status: 'cooking', elapsedMin: 16, overdue: true, batch: 'Lô x3' },
  { id: 'o5', table: 'Bàn 03', dish: 'Trà Sen Long Nhãn', quantity: 4, status: 'done', elapsedMin: 5, overdue: false },
  { id: 'o6', table: 'Bàn 06', dish: 'Gỏi Ngó Sen Tôm Thịt', quantity: 1, status: 'done', elapsedMin: 9, overdue: false },
];

export interface DemoKpi {
  label: string;
  value: string;
  sub: string;
}

export const DEMO_KPIS: DemoKpi[] = [
  { label: 'Bàn đang phục vụ', value: '18 / 24', sub: '75% công suất giờ trưa' },
  { label: 'Món quá SLA', value: '2 món', sub: 'Bàn 04, Bàn 09 (SLA 15 phút)' },
  { label: 'Tiền két ca hiện tại', value: '14.850.000 ₫', sub: 'Mở ca lúc 10:00' },
  { label: 'Chờ phê duyệt', value: '1 yêu cầu', sub: 'Hủy 1 đĩa do nhầm bàn' },
];

export const DEMO_ALERTS: string[] = [
  'Bàn 04 quá SLA 3 phút 15 giây — Nem Rán Phố Cổ (dị ứng đậu phộng).',
  'Bàn 09 quá SLA 4 phút 10 giây — Lẩu Riêu Cua Bắp Bò gọi thêm đợt 2.',
  'Thịt bắp bò còn 4,2 kg, dưới ngưỡng an toàn 15 kg.',
];
