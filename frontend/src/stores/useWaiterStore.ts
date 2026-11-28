import { create } from 'zustand';
import {
  AllergyAlert,
  WaiterItemProgressStatus,
  WaiterMenuItem,
  WaiterOrderItem,
  WaiterTab,
  WaiterTable,
  WaiterTableStatus,
} from '@/types/waiter';
import {
  BackendDishDto,
  BackendOrderDto,
  BackendOrderItemDto,
  BackendTableDto,
  waiterApi,
} from '../services/waiter/waiterApi';

function mapBackendDishCategory(raw?: string): WaiterMenuItem['category'] {
  const upper = (raw || '').toUpperCase();
  if (upper.includes('APPETIZER') || upper.includes('KHAI')) return 'Khai vị';
  if (upper.includes('HOTPOT') || upper.includes('LAU') || upper.includes('LẨU')) return 'Lẩu';
  if (upper.includes('DRINK') || upper.includes('BEVERAGE') || upper.includes('UỐNG')) return 'Đồ uống';
  if (upper.includes('DESSERT') || upper.includes('TRÁNG')) return 'Tráng miệng';
  return 'Món chính';
}

function mapBackendDishStation(category: WaiterMenuItem['category']): WaiterMenuItem['station'] {
  switch (category) {
    case 'Đồ uống':
      return 'Quầy Bar';
    case 'Lẩu':
      return 'Bếp Lẩu';
    case 'Tráng miệng':
      return 'Bếp Tráng miệng';
    case 'Khai vị':
      return 'Bếp lạnh';
    default:
      return 'Bếp nóng';
  }
}

function mapBackendDish(d: BackendDishDto): WaiterMenuItem {
  const category = mapBackendDishCategory(d.category || d.categoryName);
  return {
    id: d.id,
    sku: d.sku || d.id.slice(0, 6).toUpperCase(),
    name: d.name,
    category,
    price: d.price ?? d.basePrice ?? 0,
    description: d.description || '',
    station: mapBackendDishStation(category),
    isAvailable: d.isAvailable !== false,
    image: d.imageUrl || undefined,
  };
}

function mapBackendTableStatus(status: string): { status: WaiterTableStatus; text: string } {
  const upper = (status || 'VACANT').toUpperCase();
  switch (upper) {
    case 'SERVING':
      return { status: 'serving', text: 'Đang dùng bữa' };
    case 'BILLING':
      return { status: 'billing', text: 'Chờ thanh toán' };
    case 'CLEANING':
      return { status: 'cleaning', text: 'Đang dọn bàn' };
    case 'RESERVED':
      return { status: 'reserved', text: 'Đã đặt trước' };
    default:
      return { status: 'vacant', text: 'Bàn trống' };
  }
}

function mapBackendItemStatus(
  item: BackendOrderItemDto,
  nowMs: number
): { status: WaiterItemProgressStatus; text: string; isUrgent?: boolean } {
  const upper = (item.status || 'WAITING').toUpperCase();
  if (upper === 'READY') {
    return { status: 'ready', text: 'Bếp xong — Chờ giao' };
  }
  if (upper === 'SERVED') {
    return { status: 'served', text: 'Đã phục vụ' };
  }
  if (upper === 'REJECTED') {
    return { status: 'rejected', text: 'Bếp từ chối', isUrgent: true };
  }
  if (item.slaDeadline) {
    const deadlineMs = Date.parse(item.slaDeadline);
    if (!Number.isNaN(deadlineMs) && deadlineMs < nowMs) {
      const overMin = Math.max(1, Math.round((nowMs - deadlineMs) / 60000));
      return { status: 'delayed', text: `Quá hạn SLA ${overMin}p`, isUrgent: true };
    }
  }
  return { status: 'sent', text: 'Chờ bếp / Đang nấu' };
}

function formatTimeHHmm(iso?: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function calcElapsedMinutes(iso?: string | null, nowMs: number = Date.now()): number {
  if (!iso) return 0;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 0;
  return Math.max(0, Math.round((nowMs - ts) / 60000));
}

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let res = str.toLowerCase();
  res = res.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  res = res.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  res = res.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  res = res.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  res = res.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  res = res.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  res = res.replace(/đ/g, 'd');
  return res.trim();
}

export const INITIAL_MENU_ITEMS: WaiterMenuItem[] = [
  {
    id: 'm1',
    sku: 'KV01',
    name: 'Nem Rán Phố Cổ Hà Nội',
    category: 'Khai vị',
    price: 85000,
    description: 'Tôm thịt, nấm hương, miến dong chiên vàng giòn rụm chấm nước mắm chua ngọt.',
    station: 'Bếp nóng',
    isAvailable: true,
  },
  {
    id: 'm2',
    sku: 'KV02',
    name: 'Gỏi Ngó Sen Tôm Thịt Cung Đình',
    category: 'Khai vị',
    price: 95000,
    description: 'Ngó sen tươi giòn, tôm sú bóc nõn, thịt ba chỉ luộc, rau răm bổi giấm bỗng.',
    station: 'Bếp lạnh',
    isAvailable: true,
  },
  {
    id: 'm3',
    sku: 'MC01',
    name: 'Phở Bò Thăn Áp Chảo Thượng Hạng',
    category: 'Món chính',
    price: 125000,
    description: 'Thịt bò thăn áp chảo lửa lớn thơm nức, bánh phở tươi, nước hầm xương ống 12 tiếng.',
    station: 'Bếp nóng',
    isAvailable: true,
  },
  {
    id: 'm4',
    sku: 'MC02',
    name: 'Bò Cuộn Nấm Kim Châm Nướng Tiêu',
    category: 'Món chính',
    price: 145000,
    description: 'Thịt bò Mỹ cuốn nấm tươi sốt tiêu đen Phú Quốc đậm đà.',
    station: 'Bếp nóng',
    isAvailable: true,
  },
  {
    id: 'm5',
    sku: 'LAU01',
    name: 'Lẩu Riêu Cua Bắp Bò Sườn Sụn',
    category: 'Lẩu',
    price: 380000,
    description: 'Nước dùng riêu cua đồng thanh ngọt, bắp bò hoa giòn sần sật, sườn sụn non và rau ghém.',
    station: 'Bếp Lẩu',
    isAvailable: true,
  },
  {
    id: 'm6',
    sku: 'LAU02',
    name: 'Lẩu Nấm Chim Câu Bổ Dưỡng',
    category: 'Lẩu',
    price: 450000,
    description: 'Chim câu tiềm hạt sen, kỷ tử, nấm đông cô, nấm đùi gà và thảo mộc tự nhiên.',
    station: 'Bếp Lẩu',
    isAvailable: true,
  },
  {
    id: 'm7',
    sku: 'DU01',
    name: 'Trà Sen Tây Hồ Long Nhãn',
    category: 'Đồ uống',
    price: 45000,
    description: 'Trà sen ướp hoa tươi Bách Diệp, long nhãn Hưng Yên, hạt chia thanh nhiệt.',
    station: 'Quầy Bar',
    isAvailable: true,
  },
  {
    id: 'm8',
    sku: 'DU02',
    name: 'Nước Mơ Rừng Ngâm Đá Tuyết',
    category: 'Đồ uống',
    price: 42000,
    description: 'Mơ Hương Tích ngâm đường phèn 3 năm, vị chua thanh hòa cùng đá tuyết mát rượi.',
    station: 'Quầy Bar',
    isAvailable: true,
  },
  {
    id: 'm9',
    sku: 'TM01',
    name: 'Chè Ba Màu Cốt Dừa Bến Tre',
    category: 'Tráng miệng',
    price: 35000,
    description: 'Đậu đỏ bùi, đậu xanh tán mịn, thạch lá cẩm và nước cốt dừa thơm béo.',
    station: 'Bếp Tráng miệng',
    isAvailable: true,
  },
  {
    id: 'm10',
    sku: 'TM02',
    name: 'Bánh Flan Trứng Sữa Caramen',
    category: 'Tráng miệng',
    price: 30000,
    description: 'Trứng gà tươi đánh mịn với sữa đặc, lớp sốt caramen cà phê đắng nhẹ tinh tế.',
    station: 'Bếp Tráng miệng',
    isAvailable: true,
  },
];

export const INITIAL_TABLES: Record<string, WaiterTable> = {
  '01': {
    id: '01',
    name: 'Bàn 01',
    seats: 2,
    guests: 2,
    zone: 'Sảnh Tầng 1',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:15',
    elapsed: '45 phút',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-01-1',
        dishId: 'm1',
        name: 'Nem Rán Phố Cổ Hà Nội',
        sku: 'KV01',
        price: 85000,
        qty: 1,
        category: 'Khai vị',
        station: 'Bếp nóng',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 12,
        tableId: '01',
      },
      {
        id: 'c-01-2',
        dishId: 'm3',
        name: 'Phở Bò Thăn Áp Chảo Thượng Hạng',
        sku: 'MC01',
        price: 125000,
        qty: 2,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        waitMinutes: 6,
        tableId: '01',
      },
      {
        id: 'c-01-3',
        dishId: 'm7',
        name: 'Trà Sen Tây Hồ Long Nhãn',
        sku: 'DU01',
        price: 45000,
        qty: 2,
        category: 'Đồ uống',
        station: 'Quầy Bar',
        status: 'ready',
        statusText: 'Chờ lên món',
        waitMinutes: 3,
        tableId: '01',
      },
    ],
  },
  '02': {
    id: '02',
    name: 'Bàn 02',
    seats: 4,
    guests: 4,
    zone: 'Sảnh Tầng 1',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:20',
    elapsed: '40 phút',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-02-1',
        dishId: 'm2',
        name: 'Gỏi Ngó Sen Tôm Thịt Cung Đình',
        sku: 'KV02',
        price: 95000,
        qty: 1,
        category: 'Khai vị',
        station: 'Bếp lạnh',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 18,
        tableId: '02',
      },
      {
        id: 'c-02-2',
        dishId: 'm5',
        name: 'Lẩu Riêu Cua Bắp Bò Sườn Sụn',
        sku: 'LAU01',
        price: 380000,
        qty: 1,
        category: 'Lẩu',
        station: 'Bếp Lẩu',
        status: 'delayed',
        statusText: 'Quá hạn SLA 15p',
        waitMinutes: 22,
        isUrgent: true,
        tableId: '02',
      },
    ],
  },
  '03': {
    id: '03',
    name: 'Bàn 03',
    seats: 4,
    guests: 3,
    zone: 'Sảnh Tầng 1',
    status: 'billing',
    statusText: 'Chờ thanh toán',
    server: 'Huy',
    timeIn: '10:45',
    elapsed: '75 phút',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-03-1',
        dishId: 'm3',
        name: 'Phở Bò Thăn Áp Chảo Thượng Hạng',
        sku: 'MC01',
        price: 125000,
        qty: 3,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 45,
        tableId: '03',
      },
      {
        id: 'c-03-2',
        dishId: 'm9',
        name: 'Chè Ba Màu Cốt Dừa Bến Tre',
        sku: 'TM01',
        price: 35000,
        qty: 3,
        category: 'Tráng miệng',
        station: 'Bếp Tráng miệng',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 20,
        tableId: '03',
      },
    ],
  },
  '04': {
    id: '04',
    name: 'Bàn 04',
    seats: 4,
    guests: 4,
    zone: 'Sảnh Tầng 1',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:32',
    elapsed: '28 phút',
    generalNote: 'Khách VIP — Dị ứng đậu phộng nghiêm ngặt',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-04-1',
        dishId: 'm1',
        name: 'Nem Rán Phố Cổ Hà Nội',
        sku: 'KV01',
        price: 85000,
        qty: 2,
        category: 'Khai vị',
        station: 'Bếp nóng',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 15,
        tableId: '04',
      },
      {
        id: 'c-04-2',
        dishId: 'm4',
        name: 'Bò Cuộn Nấm Kim Châm Nướng Tiêu',
        sku: 'MC02',
        price: 145000,
        qty: 2,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        note: 'Không rắc lạc/đậu phộng rang',
        waitMinutes: 8,
        tableId: '04',
      },
      {
        id: 'c-04-3',
        dishId: 'm7',
        name: 'Trà Sen Tây Hồ Long Nhãn',
        sku: 'DU01',
        price: 45000,
        qty: 4,
        category: 'Đồ uống',
        station: 'Quầy Bar',
        status: 'ready',
        statusText: 'Sẵn sàng lên món',
        waitMinutes: 4,
        tableId: '04',
      },
      {
        id: 'c-04-4',
        dishId: 'm5',
        name: 'Lẩu Riêu Cua Bắp Bò Sườn Sụn',
        sku: 'LAU01',
        price: 380000,
        qty: 1,
        category: 'Lẩu',
        station: 'Bếp Lẩu',
        status: 'sent',
        statusText: 'Chờ tiếp nhận',
        note: 'Nước lẩu nấu riêng không nhiễm đậu phộng',
        waitMinutes: 2,
        tableId: '04',
      },
    ],
  },
  '05': {
    id: '05',
    name: 'Bàn 05',
    seats: 2,
    guests: 0,
    zone: 'Sảnh Tầng 1',
    status: 'cleaning',
    statusText: 'Cần dọn vệ sinh',
    server: 'Huy',
    timeIn: '--:--',
    elapsed: '5 phút trước',
    pendingItems: [],
    confirmedItems: [],
  },
  '06': {
    id: '06',
    name: 'Bàn 06',
    seats: 4,
    guests: 3,
    zone: 'Sảnh Tầng 1',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:40',
    elapsed: '20 phút',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-06-1',
        dishId: 'm3',
        name: 'Phở Bò Thăn Áp Chảo Thượng Hạng',
        sku: 'MC01',
        price: 125000,
        qty: 2,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        waitMinutes: 9,
        tableId: '06',
      },
      {
        id: 'c-06-2',
        dishId: 'm8',
        name: 'Nước Mơ Rừng Ngâm Đá Tuyết',
        sku: 'DU02',
        price: 42000,
        qty: 3,
        category: 'Đồ uống',
        station: 'Quầy Bar',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 14,
        tableId: '06',
      },
    ],
  },
  '07': {
    id: '07',
    name: 'Bàn 07',
    seats: 6,
    guests: 5,
    zone: 'Sảnh Tầng 2',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:38',
    elapsed: '22 phút',
    generalNote: 'Khách ăn chay tinh khiết',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-07-1',
        dishId: 'm2',
        name: 'Gỏi Ngó Sen Tôm Thịt Cung Đình',
        sku: 'KV02',
        price: 95000,
        qty: 2,
        category: 'Khai vị',
        station: 'Bếp lạnh',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        note: 'Làm bản thuần chay: không tôm thịt, nước mắm chay',
        waitMinutes: 7,
        tableId: '07',
      },
      {
        id: 'c-07-2',
        dishId: 'm6',
        name: 'Lẩu Nấm Chim Câu Bổ Dưỡng',
        sku: 'LAU02',
        price: 450000,
        qty: 1,
        category: 'Lẩu',
        station: 'Bếp Lẩu',
        status: 'sent',
        statusText: 'Chờ tiếp nhận',
        note: 'Thay chim câu bằng đậu hũ non và nấm đùi gà',
        waitMinutes: 3,
        tableId: '07',
      },
    ],
  },
  '08': {
    id: '08',
    name: 'Bàn 08',
    seats: 8,
    guests: 7,
    zone: 'Sảnh Tầng 2',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:05',
    elapsed: '55 phút',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-08-1',
        dishId: 'm5',
        name: 'Lẩu Riêu Cua Bắp Bò Sườn Sụn',
        sku: 'LAU01',
        price: 380000,
        qty: 2,
        category: 'Lẩu',
        station: 'Bếp Lẩu',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 30,
        tableId: '08',
      },
      {
        id: 'c-08-2',
        dishId: 'm4',
        name: 'Bò Cuộn Nấm Kim Châm Nướng Tiêu',
        sku: 'MC02',
        price: 145000,
        qty: 3,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        waitMinutes: 11,
        tableId: '08',
      },
      {
        id: 'c-08-3',
        dishId: 'm7',
        name: 'Trà Sen Tây Hồ Long Nhãn',
        sku: 'DU01',
        price: 45000,
        qty: 7,
        category: 'Đồ uống',
        station: 'Quầy Bar',
        status: 'ready',
        statusText: 'Sẵn sàng lên món',
        waitMinutes: 5,
        tableId: '08',
      },
    ],
  },
  '09': {
    id: '09',
    name: 'Bàn 09',
    seats: 6,
    guests: 4,
    zone: 'Sảnh Tầng 2',
    status: 'billing',
    statusText: 'Chờ thanh toán',
    server: 'Huy',
    timeIn: '10:50',
    elapsed: '70 phút',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-09-1',
        dishId: 'm5',
        name: 'Lẩu Riêu Cua Bắp Bò Sườn Sụn',
        sku: 'LAU01',
        price: 380000,
        qty: 1,
        category: 'Lẩu',
        station: 'Bếp Lẩu',
        status: 'served',
        statusText: 'Đã lên món',
        waitMinutes: 40,
        tableId: '09',
      },
    ],
  },
  '10': {
    id: '10',
    name: 'Bàn 10',
    seats: 2,
    guests: 0,
    zone: 'Sân vườn',
    status: 'vacant',
    statusText: 'Bàn trống',
    server: 'Huy',
    timeIn: '--:--',
    elapsed: '0 phút',
    pendingItems: [],
    confirmedItems: [],
  },
  '11': {
    id: '11',
    name: 'Bàn 11',
    seats: 4,
    guests: 3,
    zone: 'Sân vườn',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:45',
    elapsed: '15 phút',
    generalNote: 'Khu ngoài trời, khách yêu cầu phục vụ nhanh',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-11-1',
        dishId: 'm3',
        name: 'Phở Bò Thăn Áp Chảo Thượng Hạng',
        sku: 'MC01',
        price: 125000,
        qty: 3,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        note: 'Ít hành lá, nhiều ớt tươi',
        waitMinutes: 8,
        tableId: '11',
      },
      {
        id: 'c-11-2',
        dishId: 'm8',
        name: 'Nước Mơ Rừng Ngâm Đá Tuyết',
        sku: 'DU02',
        price: 42000,
        qty: 3,
        category: 'Đồ uống',
        station: 'Quầy Bar',
        status: 'ready',
        statusText: 'Sẵn sàng lên món',
        waitMinutes: 2,
        tableId: '11',
      },
      {
        id: 'c-11-3',
        dishId: 'm1',
        name: 'Nem Rán Phố Cổ Hà Nội',
        sku: 'KV01',
        price: 85000,
        qty: 1,
        category: 'Khai vị',
        station: 'Bếp nóng',
        status: 'delayed',
        statusText: 'Quá hạn SLA 12p',
        waitMinutes: 19,
        isUrgent: true,
        tableId: '11',
      },
    ],
  },
  '12': {
    id: '12',
    name: 'Bàn 12',
    seats: 6,
    guests: 5,
    zone: 'Sân vườn',
    status: 'serving',
    statusText: 'Đang dùng bữa',
    server: 'Huy',
    timeIn: '11:41',
    elapsed: '19 phút',
    generalNote: 'Có trẻ nhỏ < 3 tuổi — Không cay, nấu mềm nhừ',
    pendingItems: [],
    confirmedItems: [
      {
        id: 'c-12-1',
        dishId: 'm3',
        name: 'Phở Bò Thăn Áp Chảo Thượng Hạng',
        sku: 'MC01',
        price: 125000,
        qty: 2,
        category: 'Món chính',
        station: 'Bếp nóng',
        status: 'cooking',
        statusText: 'Bếp đang nấu',
        note: '1 tô nấu không tiêu, không bột ngọt, thịt băm nhỏ cho bé',
        waitMinutes: 10,
        tableId: '12',
      },
      {
        id: 'c-12-2',
        dishId: 'm9',
        name: 'Chè Ba Màu Cốt Dừa Bến Tre',
        sku: 'TM01',
        price: 35000,
        qty: 2,
        category: 'Tráng miệng',
        station: 'Bếp Tráng miệng',
        status: 'ready',
        statusText: 'Sẵn sàng lên món',
        waitMinutes: 4,
        tableId: '12',
      },
    ],
  },
};

export const INITIAL_ALLERGY_ALERTS: AllergyAlert[] = [
  {
    id: 'alg-04',
    tableId: '04',
    title: 'Dị ứng ĐẬU PHỘNG (Lạc) & MÈ',
    details: 'Khách có tiền sử sốc phản vệ: Không dùng chung chảo, dầu chiên và thớt gỏi.',
    severity: 'strict',
    time: '11:32',
    status: 'acknowledged',
    stationRecipient: 'Bếp trưởng đã ký nhận',
  },
  {
    id: 'alg-07',
    tableId: '07',
    title: 'Ăn chay tinh khiết',
    details: 'Không mỡ động vật & nước mắm mặn. Dùng chảo xào riêng cho món rau và nấm.',
    severity: 'vegetarian',
    time: '11:38',
    status: 'acknowledged',
    stationRecipient: 'Trạm xào tiếp nhận',
  },
  {
    id: 'alg-12',
    tableId: '12',
    title: 'Trẻ em < 3 tuổi',
    details: 'Không ớt, giảm 50% muối bột ngọt. Thức ăn nấu mềm nhừ cho bé.',
    severity: 'child',
    time: '11:41',
    status: 'pending',
    stationRecipient: 'Chờ Bếp Súp xác nhận',
  },
];

interface WaiterState {
  selectedTableId: string;
  activeTab: WaiterTab;
  activeZoneFilter: string;
  trackingTableFilter: string;
  tables: Record<string, WaiterTable>;
  menuItems: WaiterMenuItem[];
  allergyAlerts: AllergyAlert[];
  isSendKitchenModalOpen: boolean;
  isTransferModalOpen: boolean;
  isSoundAlertEnabled: boolean;
  searchQuery: string;
  toastMessage: string | null;
  isSyncing: boolean;
  isSendingOrder: boolean;
  hasSyncedBackend: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  servingItemIds: Record<string, boolean>;
  pendingIdempotencyKeys: Record<string, string>;

  // Actions
  syncFromBackend: () => Promise<void>;
  updateTableStatusApi: (
    tableId: string,
    targetStatus: 'VACANT' | 'RESERVED' | 'SERVING' | 'BILLING' | 'CLEANING'
  ) => Promise<boolean>;
  setSelectedTable: (tableId: string) => void;
  setActiveTab: (tab: WaiterTab) => void;
  setZoneFilter: (filter: string) => void;
  setTrackingTableFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  updateTableStatus: (tableId: string, status: WaiterTableStatus) => void;
  addItemToOrder: (tableId: string, menuItem: WaiterMenuItem, note?: string) => void;
  updateItemQty: (tableId: string, itemId: string, delta: number) => void;
  updateItemNote: (tableId: string, itemId: string, note: string) => void;
  removeItemFromPending: (tableId: string, itemId: string) => void;
  clearPendingOrder: (tableId: string) => void;
  openSendKitchenModal: () => boolean;
  closeSendKitchenModal: () => void;
  sendPendingOrderToKitchen: (tableId: string, note?: string) => Promise<number>;
  confirmItemServed: (tableId: string, itemId: string) => Promise<boolean>;
  pingKitchenItem: (tableId: string, itemId: string) => void;
  transferTable: (sourceId: string, targetId: string) => void;
  mergeTable: (sourceId: string, targetId: string) => void;
  toggleSoundAlert: () => boolean;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useWaiterStore = create<WaiterState>((set, get) => {
  // Sync initial table from localStorage safely in browser
  let initialTable = '';
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('restaurant_os_selected_table');
      if (saved) {
        initialTable = saved;
      }
    } catch { }
  }

  return {
    selectedTableId: initialTable,
    activeTab: 'floor',
    activeZoneFilter: 'all',
    trackingTableFilter: 'all',
    tables: {},
    menuItems: [],
    allergyAlerts: [],
    isSendKitchenModalOpen: false,
    isTransferModalOpen: false,
    isSoundAlertEnabled: true,
    searchQuery: '',
    toastMessage: null,
    isSyncing: false,
    isSendingOrder: false,
    hasSyncedBackend: false,
    lastSyncedAt: null,
    syncError: null,
    servingItemIds: {},
    pendingIdempotencyKeys: {},

    syncFromBackend: async () => {
      if (get().isSyncing) return;
      set({ isSyncing: true, syncError: null });
      try {
        const [backendTables, activeOrders, backendDishes] = await Promise.all([
          waiterApi.fetchTables(),
          waiterApi.fetchActiveOrders(),
          waiterApi.fetchDishes().catch(() => [] as BackendDishDto[]),
        ]);

        const nowMs = Date.now();
        const prevTables = get().tables;
        const ordersByTableId = new Map<string, BackendOrderDto[]>();
        for (const order of activeOrders) {
          if (order.tableId) {
            const list = ordersByTableId.get(order.tableId) || [];
            list.push(order);
            ordersByTableId.set(order.tableId, list);
          }
        }

        const nextTables: Record<string, WaiterTable> = {};
        const nextAllergies: AllergyAlert[] = [];

        backendTables.forEach((t: BackendTableDto) => {
          const tableOrders = ordersByTableId.get(t.id) || [];
          const primaryOrder = tableOrders[0];
          const mappedStatus = mapBackendTableStatus(t.status);
          const existingLocal = prevTables[t.id];
          const elapsedMin = primaryOrder
            ? calcElapsedMinutes(primaryOrder.openedAt || primaryOrder.createdAt, nowMs)
            : 0;

          const confirmedItems: WaiterOrderItem[] = tableOrders.flatMap((order) =>
            (order.items || []).map((item) => {
              const st = mapBackendItemStatus(item, nowMs);
              if (item.allergyNote) {
                nextAllergies.push({
                  id: `alg-${item.id}`,
                  tableId: t.id,
                  title: `Dị ứng — ${item.dishNameSnapshot}`,
                  details: item.allergyNote,
                  severity: 'strict',
                  time: formatTimeHHmm(item.createdAt),
                  status: 'acknowledged',
                  stationRecipient: 'Bếp KDS',
                });
              }
              return {
                id: item.id,
                dishId: item.dishId,
                name: item.dishNameSnapshot,
                sku: item.portionNameSnapshot || 'STD',
                price: item.unitPrice,
                qty: item.quantity,
                category: 'Thực đơn',
                station: 'Bếp KDS',
                status: st.status,
                statusText: st.text,
                note: item.notes || undefined,
                allergyNote: item.allergyNote || undefined,
                waitMinutes: calcElapsedMinutes(item.createdAt, nowMs),
                isUrgent: st.isUrgent,
                tableId: t.id,
                orderId: order.id,
                orderCode: order.orderCode,
                sentAt: formatTimeHHmm(item.createdAt),
                slaDeadline: item.slaDeadline || undefined,
              };
            })
          );

          const mergedNotes = tableOrders
            .map((o) => o.customerNotes)
            .filter(Boolean)
            .join(' | ');

          nextTables[t.id] = {
            id: t.id,
            name: t.tableNumber.startsWith('Bàn') ? t.tableNumber : `Bàn ${t.tableNumber}`,
            seats: t.capacity,
            guests: mappedStatus.status === 'vacant' ? 0 : t.capacity,
            zone: 'Sảnh chính',
            status: mappedStatus.status,
            statusText: mappedStatus.text,
            server: existingLocal?.server || 'Phục vụ',
            timeIn: primaryOrder ? formatTimeHHmm(primaryOrder.openedAt || primaryOrder.createdAt) : '--:--',
            elapsed: primaryOrder ? `${elapsedMin} phút` : '0 phút',
            orderId: primaryOrder?.id ?? t.currentOrderId ?? null,
            orderCode: primaryOrder?.orderCode ?? null,
            orderStatus: primaryOrder?.status ?? null,
            pendingItems: existingLocal?.pendingItems || [],
            confirmedItems,
            generalNote: mergedNotes || existingLocal?.generalNote,
          };
        });

        const currentSelected = get().selectedTableId;
        const nextSelected = nextTables[currentSelected]
          ? currentSelected
          : Object.keys(nextTables)[0] || currentSelected;

        const mappedDishes =
          Array.isArray(backendDishes) && backendDishes.length > 0
            ? backendDishes.map(mapBackendDish)
            : get().menuItems;

        set({
          tables: nextTables,
          menuItems: mappedDishes,
          allergyAlerts: nextAllergies,
          selectedTableId: nextSelected,
          isSyncing: false,
          hasSyncedBackend: true,
          lastSyncedAt: new Date().toISOString(),
          syncError: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể đồng bộ dữ liệu từ máy chủ';
        set({ isSyncing: false, syncError: message });
      }
    },

    updateTableStatusApi: async (tableId, targetStatus) => {
      try {
        const updated = await waiterApi.updateTableStatus(tableId, targetStatus);
        const mapped = mapBackendTableStatus(updated.status);
        set((state) => {
          const existing = state.tables[tableId];
          if (!existing) return state;
          return {
            tables: {
              ...state.tables,
              [tableId]: {
                ...existing,
                status: mapped.status,
                statusText: mapped.text,
              },
            },
          };
        });
        get().showToast(`Đã cập nhật trạng thái bàn thành ${mapped.text}`);
        await get().syncFromBackend();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cập nhật trạng thái bàn thất bại';
        get().showToast(`⚠️ ${message}`);
        return false;
      }
    },

    setSelectedTable: (tableId: string) => {
      const isUuid = /^[0-9a-f-]{32,36}$/i.test(tableId);
      const id = isUuid ? tableId : tableId.replace(/\D/g, '').padStart(2, '0');
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('restaurant_os_selected_table', id);
        } catch { }
      }
      set({ selectedTableId: id });
    },

    setActiveTab: (tab: WaiterTab) => {
      set({ activeTab: tab });
    },

    setZoneFilter: (filter: string) => {
      set({ activeZoneFilter: filter });
    },

    setTrackingTableFilter: (filter: string) => {
      set({ trackingTableFilter: filter });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    updateTableStatus: (tableId: string, status: WaiterTableStatus) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;

        const statusMap: Record<WaiterTableStatus, string> = {
          serving: 'Đang dùng bữa',
          billing: 'Chờ thanh toán',
          cleaning: 'Cần dọn vệ sinh',
          vacant: 'Bàn trống',
          reserved: 'Đã đặt trước',
        };

        const updatedTable: WaiterTable = {
          ...table,
          status,
          statusText: statusMap[status],
          timeIn: status === 'vacant' ? '--:--' : table.timeIn === '--:--' ? '12:00' : table.timeIn,
          pendingItems: status === 'vacant' ? [] : table.pendingItems,
          confirmedItems: status === 'vacant' ? [] : table.confirmedItems,
        };

        return {
          tables: {
            ...state.tables,
            [tableId]: updatedTable,
          },
        };
      });
    },

    addItemToOrder: (tableId: string, menuItem: WaiterMenuItem, note?: string) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;

        const existingPending = table.pendingItems.find(
          (p) => p.dishId === menuItem.id && (p.note || '') === (note || '')
        );

        let newPending: WaiterOrderItem[];
        if (existingPending) {
          newPending = table.pendingItems.map((p) =>
            p.id === existingPending.id ? { ...p, qty: p.qty + 1 } : p
          );
        } else {
          const newItem: WaiterOrderItem = {
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            dishId: menuItem.id,
            name: menuItem.name,
            sku: menuItem.sku,
            price: menuItem.price,
            qty: 1,
            category: menuItem.category,
            station: menuItem.station,
            status: 'pending',
            statusText: 'Chưa gửi bếp',
            note: note || '',
            tableId,
          };
          newPending = [...table.pendingItems, newItem];
        }

        return {
          tables: {
            ...state.tables,
            [tableId]: {
              ...table,
              pendingItems: newPending,
            },
          },
        };
      });
    },

    updateItemQty: (tableId: string, itemId: string, delta: number) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;

        const updatedPending = table.pendingItems
          .map((item) => {
            if (item.id === itemId) {
              const newQty = item.qty + delta;
              return newQty > 0 ? { ...item, qty: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as WaiterOrderItem[];

        return {
          tables: {
            ...state.tables,
            [tableId]: {
              ...table,
              pendingItems: updatedPending,
            },
          },
        };
      });
    },

    updateItemNote: (tableId: string, itemId: string, note: string) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;

        const updatedPending = table.pendingItems.map((item) =>
          item.id === itemId ? { ...item, note } : item
        );

        return {
          tables: {
            ...state.tables,
            [tableId]: {
              ...table,
              pendingItems: updatedPending,
            },
          },
        };
      });
    },

    removeItemFromPending: (tableId: string, itemId: string) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;
        const nextKeys = { ...state.pendingIdempotencyKeys };
        delete nextKeys[tableId];

        return {
          pendingIdempotencyKeys: nextKeys,
          tables: {
            ...state.tables,
            [tableId]: {
              ...table,
              pendingItems: table.pendingItems.filter((i) => i.id !== itemId),
            },
          },
        };
      });
    },

    clearPendingOrder: (tableId: string) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;
        const nextKeys = { ...state.pendingIdempotencyKeys };
        delete nextKeys[tableId];

        return {
          pendingIdempotencyKeys: nextKeys,
          tables: {
            ...state.tables,
            [tableId]: {
              ...table,
              pendingItems: [],
            },
          },
        };
      });
    },

    openSendKitchenModal: () => {
      const state = get();
      const currentTable = state.tables[state.selectedTableId];
      if (!currentTable || currentTable.pendingItems.length === 0) {
        state.showToast('⚠️ Không có món mới nào cần gửi bếp! Vui lòng chọn món trước.');
        return false;
      }
      set({ isSendKitchenModalOpen: true });
      return true;
    },

    closeSendKitchenModal: () => {
      set({ isSendKitchenModalOpen: false });
    },

    sendPendingOrderToKitchen: async (tableId: string, note?: string) => {
      const state = get();
      if (state.isSendingOrder) return 0;
      const table = state.tables[tableId];
      if (!table || table.pendingItems.length === 0) {
        set({ isSendKitchenModalOpen: false });
        return 0;
      }

      const pendingCount = table.pendingItems.length;
      const totalQty = table.pendingItems.reduce((acc, i) => acc + i.qty, 0);

      // Tái sử dụng idempotencyKey theo giỏ hiện tại của bàn để chống tạo đơn trùng khi retry mạng lỗi
      let idempotencyKey = state.pendingIdempotencyKeys[tableId];
      if (!idempotencyKey) {
        idempotencyKey =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `waiter-ord-${crypto.randomUUID()}`
            : `waiter-ord-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      set((s) => ({
        isSendingOrder: true,
        pendingIdempotencyKeys: {
          ...s.pendingIdempotencyKeys,
          [tableId]: idempotencyKey,
        },
      }));

      try {
        await waiterApi.createOrder({
          tableId,
          items: table.pendingItems.map((p) => ({
            dishId: p.dishId,
            quantity: p.qty,
            notes: p.note || undefined,
            allergyNote: p.allergyNote || undefined,
          })),
          customerNotes: note?.trim() || undefined,
          idempotencyKey,
        });

        set((s) => {
          const current = s.tables[tableId];
          const nextKeys = { ...s.pendingIdempotencyKeys };
          delete nextKeys[tableId];
          return {
            isSendingOrder: false,
            isSendKitchenModalOpen: false,
            pendingIdempotencyKeys: nextKeys,
            tables: current
              ? {
                ...s.tables,
                [tableId]: {
                  ...current,
                  pendingItems: [],
                  generalNote: note?.trim() || current.generalNote,
                },
              }
              : s.tables,
          };
        });

        get().showToast(`Đã gửi đơn (${pendingCount} món / ${totalQty} phần) vào Bếp thành công!`);
        await get().syncFromBackend();
        return pendingCount;
      } catch (err) {
        set({ isSendingOrder: false });
        const message = err instanceof Error ? err.message : 'Gửi đơn vào Bếp thất bại';
        get().showToast(`⚠️ ${message}`);
        return 0;
      }
    },

    confirmItemServed: async (tableId: string, itemId: string) => {
      const state = get();
      if (state.servingItemIds[itemId]) {
        return false;
      }
      const table = state.tables[tableId];
      const targetItem = table?.confirmedItems.find((i) => i.id === itemId);
      if (targetItem && targetItem.status !== 'ready') {
        state.showToast('⚠️ Chỉ có thể xác nhận giao các món đã chế biến xong (READY).');
        return false;
      }

      set((s) => ({
        servingItemIds: { ...s.servingItemIds, [itemId]: true },
      }));

      try {
        await waiterApi.serveOrderItem(itemId);
        set((s) => {
          const nextServing = { ...s.servingItemIds };
          delete nextServing[itemId];
          const currentTable = s.tables[tableId];
          if (!currentTable) return { servingItemIds: nextServing };

          const updatedConfirmed = currentTable.confirmedItems.map((item) =>
            item.id === itemId
              ? { ...item, status: 'served' as const, statusText: 'Đã phục vụ' }
              : item
          );

          return {
            servingItemIds: nextServing,
            tables: {
              ...s.tables,
              [tableId]: {
                ...currentTable,
                confirmedItems: updatedConfirmed,
              },
            },
          };
        });
        get().showToast(
          `Đã xác nhận giao món ${targetItem?.name || ''} cho ${table?.name || `Bàn ${tableId}`}!`
        );
        return true;
      } catch (err) {
        set((s) => {
          const nextServing = { ...s.servingItemIds };
          delete nextServing[itemId];
          return { servingItemIds: nextServing };
        });
        const message = err instanceof Error ? err.message : 'Xác nhận giao món thất bại';
        get().showToast(`⚠️ ${message}`);
        return false;
      }
    },

    pingKitchenItem: (tableId: string, itemId: string) => {
      set((state) => {
        const table = state.tables[tableId];
        if (!table) return state;

        const updatedConfirmed = table.confirmedItems.map((item) =>
          item.id === itemId
            ? { ...item, isUrgent: true, statusText: '⚡ Đã hối bếp khẩn cấp' }
            : item
        );

        return {
          tables: {
            ...state.tables,
            [tableId]: {
              ...table,
              confirmedItems: updatedConfirmed,
            },
          },
        };
      });
    },

    transferTable: (sourceId: string, targetId: string) => {
      set((state) => {
        const source = state.tables[sourceId];
        const target = state.tables[targetId];
        if (!source || !target) return state;

        return {
          selectedTableId: targetId,
          tables: {
            ...state.tables,
            [targetId]: {
              ...target,
              status: source.status,
              statusText: source.statusText,
              guests: source.guests || target.seats,
              timeIn: source.timeIn,
              elapsed: source.elapsed,
              server: source.server,
              pendingItems: [...target.pendingItems, ...source.pendingItems],
              confirmedItems: [...target.confirmedItems, ...source.confirmedItems],
              generalNote: source.generalNote || target.generalNote,
            },
            [sourceId]: {
              ...source,
              status: 'vacant',
              statusText: 'Bàn trống',
              guests: 0,
              timeIn: '--:--',
              elapsed: '0 phút',
              pendingItems: [],
              confirmedItems: [],
              generalNote: undefined,
            },
          },
        };
      });
    },

    mergeTable: (sourceId: string, targetId: string) => {
      set((state) => {
        const source = state.tables[sourceId];
        const target = state.tables[targetId];
        if (!source || !target) return state;

        return {
          selectedTableId: targetId,
          tables: {
            ...state.tables,
            [targetId]: {
              ...target,
              status: 'serving',
              statusText: 'Đang dùng bữa',
              guests: (target.guests || 2) + (source.guests || 2),
              pendingItems: [...target.pendingItems, ...source.pendingItems],
              confirmedItems: [...target.confirmedItems, ...source.confirmedItems],
              generalNote: [target.generalNote, source.generalNote].filter(Boolean).join(' | '),
            },
            [sourceId]: {
              ...source,
              status: 'vacant',
              statusText: 'Bàn trống',
              guests: 0,
              timeIn: '--:--',
              elapsed: '0 phút',
              pendingItems: [],
              confirmedItems: [],
              generalNote: undefined,
            },
          },
        };
      });
    },

    toggleSoundAlert: () => {
      const next = !get().isSoundAlertEnabled;
      set({ isSoundAlertEnabled: next });
      return next;
    },

    showToast: (msg: string) => {
      set({ toastMessage: msg });
      setTimeout(() => {
        if (get().toastMessage === msg) {
          set({ toastMessage: null });
        }
      }, 3000);
    },

    clearToast: () => {
      set({ toastMessage: null });
    },
  };
});
