// ====================================================================
// Waiter Portal Types for Restaurant OS
// Tuân thủ: Design System v6, Tiền tệ số nguyên VND, Phân quyền Waiter
// ====================================================================

export type WaiterTableStatus = 'serving' | 'vacant' | 'billing' | 'cleaning';

export type WaiterTab = 'floor' | 'order' | 'tracking';

export type WaiterItemProgressStatus =
  | 'pending'   // Mới thêm, chưa gửi bếp
  | 'sent'      // Đã gửi vào KDS, chờ tiếp nhận
  | 'cooking'   // Bếp đang nấu
  | 'ready'     // Đã nấu xong, chờ nhân viên lên món
  | 'served'    // Đã phục vụ tới bàn
  | 'delayed';  // Quá hạn SLA

export interface WaiterOrderItem {
  id: string;
  dishId: string;
  name: string;
  sku: string;
  price: number; // VND integer
  qty: number;
  category: string;
  station: string; // ví dụ: 'Bếp nóng', 'Bếp lạnh', 'Quầy Bar'
  status: WaiterItemProgressStatus;
  statusText: string;
  note?: string;
  waitMinutes?: number;
  isUrgent?: boolean;
  tableId: string;
  sentAt?: string;
}

export interface WaiterTable {
  id: string; // '01', '02', '03'...
  name: string; // 'Bàn 01'
  seats: number; // 2, 4, 6, 8
  guests: number; // Số khách thực tế
  zone: string; // 'Sảnh Tầng 1', 'Sảnh Tầng 2', 'Sân vườn'
  status: WaiterTableStatus;
  statusText: string;
  server: string; // 'Huy'
  timeIn: string; // '11:30'
  elapsed: string; // '28 phút'
  pendingItems: WaiterOrderItem[];
  confirmedItems: WaiterOrderItem[];
  generalNote?: string;
}

export interface WaiterMenuItem {
  id: string;
  sku: string;
  name: string;
  category: 'Khai vị' | 'Món chính' | 'Lẩu' | 'Đồ uống' | 'Tráng miệng';
  price: number; // VND integer
  description: string;
  station: 'Bếp nóng' | 'Bếp lạnh' | 'Bếp Lẩu' | 'Quầy Bar' | 'Bếp Tráng miệng';
  isAvailable: boolean;
  image?: string;
}

export interface AllergyAlert {
  id: string;
  tableId: string;
  title: string;
  details: string;
  severity: 'strict' | 'vegetarian' | 'child';
  time: string;
  status: 'acknowledged' | 'pending';
  stationRecipient: string;
}
