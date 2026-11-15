import { create } from 'zustand';
import {
  AttendanceMethod,
  CashDrawerLog,
  CashPayoutEntry,
  CashierAttendanceEntry,
  CashierTable,
  CashierTableArea,
  DiscountRule,
  MergedTableSnapshot,
  PaymentMethodType,
  ShiftSettlementRecord,
  TableReservation,
} from '../types';
import { getStompClient } from '../lib/stomp';
import { fetchApi } from '../lib/api-client';
import {
  SSR_FALLBACK_DATE,
  formatShortDateVN,
  formatTimeHHMM,
  formatTimeHHMMSS,
  generateIdempotencyKey,
  getRealtimeShiftMeta,
  getUpcomingTimeSlot,
  resolveReservationTargetDate,
} from '../lib/utils';

export const PRESET_DISCOUNTS: DiscountRule[] = [
  { id: 'd_none', code: 'NONE', label: 'Không giảm giá', type: 'FIXED', value: 0 },
  { id: 'd_vip10', code: 'VIP10', label: 'Thẻ thành viên VIP (-10%)', type: 'PERCENT', value: 10 },
  { id: 'd_lunch15', code: 'CA_SANG15', label: 'Ưu đãi Ca Sáng (-15%)', type: 'PERCENT', value: 15 },
  { id: 'd_voucher50k', code: 'GIAM50K', label: 'Voucher đối tác (-50.000 ₫)', type: 'FIXED', value: 50000 },
  { id: 'd_voucher100k', code: 'GIAM100K', label: 'Voucher tri ân (-100.000 ₫)', type: 'FIXED', value: 100000 },
];

const INITIAL_TABLES: CashierTable[] = [
  {
    id: 't1',
    label: 'Bàn 01',
    seats: 4,
    area: 'Sảnh Tầng 1',
    status: 'IDLE',
    guests: 0,
    seatedMin: 0,
    staff: '',
    depositAmount: 0,
    discountAmount: 0,
    items: [],
  },
  {
    id: 't2',
    label: 'Bàn 02',
    seats: 4,
    area: 'Sảnh Tầng 1',
    status: 'OCCUPIED',
    guests: 3,
    seatedMin: 34,
    staff: 'Lan',
    depositAmount: 0,
    discountAmount: 0,
    items: [
      { id: 'i_201', name: 'Phở Bò Tái Lăn Hà Nội', qty: 2, unitPrice: 95000, status: 'SERVED' },
      { id: 'i_202', name: 'Chả Cá Lã Vọng', qty: 1, unitPrice: 185000, status: 'SERVED' },
      { id: 'i_203', name: 'Trà Sen Tây Hồ', qty: 3, unitPrice: 45000, status: 'SERVED' },
    ],
  },
  {
    id: 't3',
    label: 'Bàn 03',
    seats: 2,
    area: 'Sảnh Tầng 1',
    status: 'RESERVED',
    guests: 2,
    seatedMin: 0,
    staff: 'Minh',
    depositAmount: 200000,
    discountAmount: 0,
    reservationId: 'res_01',
    items: [],
  },
  {
    id: 't4',
    label: 'Bàn 04',
    seats: 6,
    area: 'Sảnh Tầng 1',
    status: 'OVERDUE',
    guests: 5,
    seatedMin: 52,
    staff: 'Lan',
    depositAmount: 200000,
    discountAmount: 0,
    allergyAlert: 'Khách dị ứng đậu phộng — ưu tiên kiểm tra bill & đối soát cọc',
    items: [
      { id: 'i_401', name: 'Nem Rán Phố Cổ', qty: 2, unitPrice: 85000, status: 'SERVED', note: 'Không đậu phộng' },
      { id: 'i_402', name: 'Gỏi Ngó Sen Tôm Thịt', qty: 1, unitPrice: 115000, status: 'SERVED', note: 'Không hành phi' },
      { id: 'i_403', name: 'Lẩu Riêu Cua Bắp Bò', qty: 1, unitPrice: 320000, status: 'SERVED' },
      { id: 'i_404', name: 'Bún Tươi & Rau Đồng Nội', qty: 2, unitPrice: 35000, status: 'SERVED' },
      { id: 'i_405', name: 'Nước Mơ Ngâm Lâu Năm', qty: 5, unitPrice: 45000, status: 'SERVED' },
    ],
  },
  {
    id: 't5',
    label: 'Bàn 05',
    seats: 6,
    area: 'Sảnh Tầng 1',
    status: 'RESERVED',
    guests: 6,
    seatedMin: 0,
    staff: 'Nam',
    depositAmount: 500000,
    discountAmount: 0,
    reservationId: 'res_02',
    items: [],
  },
  {
    id: 't6',
    label: 'Bàn 06',
    seats: 4,
    area: 'Sảnh Tầng 1',
    status: 'OCCUPIED',
    guests: 4,
    seatedMin: 25,
    staff: 'Mai',
    depositAmount: 0,
    discountAmount: 0,
    items: [
      { id: 'i_601', name: 'Bún Chả Hàng Mành', qty: 2, unitPrice: 95000, status: 'SERVED' },
      { id: 'i_602', name: 'Bò Lúc Lắc Khoai Tây', qty: 1, unitPrice: 175000, status: 'READY' },
      { id: 'i_603', name: 'Chè Khúc Bạch Nhãn Lồng', qty: 4, unitPrice: 45000, status: 'WAITING' },
    ],
  },
  {
    id: 't7',
    label: 'Bàn 07',
    seats: 4,
    area: 'Tầng 2 VIP',
    status: 'OVERDUE',
    guests: 4,
    seatedMin: 48,
    staff: 'Nam',
    depositAmount: 0,
    discountAmount: 0,
    items: [
      { id: 'i_701', name: 'Nem Rán Phố Cổ', qty: 3, unitPrice: 85000, status: 'SERVED' },
      { id: 'i_702', name: 'Cá Lăng Nướng Riềng Mẻ', qty: 1, unitPrice: 285000, status: 'SERVED' },
      { id: 'i_703', name: 'Cơm Hạt Sen Lá Dứa', qty: 2, unitPrice: 65000, status: 'SERVED' },
    ],
  },
  {
    id: 't8',
    label: 'Bàn 08',
    seats: 8,
    area: 'Tầng 2 VIP',
    status: 'IDLE',
    guests: 0,
    seatedMin: 0,
    staff: '',
    depositAmount: 0,
    discountAmount: 0,
    items: [],
  },
  {
    id: 't9',
    label: 'Bàn 09',
    seats: 4,
    area: 'Sân vườn',
    status: 'OCCUPIED',
    guests: 2,
    seatedMin: 19,
    staff: 'Lan',
    depositAmount: 0,
    discountAmount: 0,
    items: [
      { id: 'i_901', name: 'Gỏi Cuốn Tôm Thịt', qty: 2, unitPrice: 75000, status: 'SERVED' },
      { id: 'i_902', name: 'Cà Phê Trứng Phố Cổ', qty: 2, unitPrice: 55000, status: 'SERVED' },
    ],
  },
  {
    id: 't10',
    label: 'Bàn 10',
    seats: 6,
    area: 'Sân vườn',
    status: 'CLEANING',
    guests: 0,
    seatedMin: 0,
    staff: 'Mai',
    depositAmount: 0,
    discountAmount: 0,
    items: [],
  },
];

function createInitialReservations(now: Date = new Date()): TableReservation[] {
  const slot1 = getUpcomingTimeSlot(20, now);
  const slot2 = getUpcomingTimeSlot(45, now);
  return [
    {
      id: 'res_01',
      customerName: 'Nguyễn Minh Quân',
      phone: '0903 456 789',
      partySize: 2,
      reservedTime: slot1,
      reservedDate: resolveReservationTargetDate(slot1, now).reservedDate,
      area: 'Sảnh Tầng 1',
      tableId: 't3',
      tableLabel: 'Bàn 03',
      depositAmount: 200000,
      depositMethod: 'VIETQR',
      note: 'Ngồi gần cửa sổ, kỷ niệm ngày cưới',
      status: 'CONFIRMED',
    },
    {
      id: 'res_02',
      customerName: 'Trần Thanh Hương (Đoàn VIP)',
      phone: '0988 112 334',
      partySize: 6,
      reservedTime: slot2,
      reservedDate: resolveReservationTargetDate(slot2, now).reservedDate,
      area: 'Sảnh Tầng 1',
      tableId: 't5',
      tableLabel: 'Bàn 05',
      depositAmount: 500000,
      depositMethod: 'CASH',
      note: 'Có 1 trẻ em — chuẩn bị ghế trẻ em, tránh đậu phộng',
      status: 'CONFIRMED',
    },
  ];
}

function createInitialShift(now: Date = new Date()): ShiftSettlementRecord {
  const meta = getRealtimeShiftMeta(now);
  const log1Time = `${meta.checkedInAt}:12`;
  const log2Time = formatTimeHHMMSS(new Date(now.getTime() - 18 * 60 * 1000));
  return {
    shiftId: `shift_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`,
    shiftName: meta.shiftName,
    area: 'Sảnh Tầng 1',
    startTime: meta.startTime,
    endTime: meta.endTime,
    nextShift: meta.nextShift,
    checkedInAt: meta.checkedInAt,
    cashierName: 'Thu ngân Minh Anh',
    openingCash: 5000000, // 5.000.000 ₫ đầu ca
    cashSales: 8450000, // 8.450.000 ₫ tiền mặt đã thu
    qrAndCardSales: 12600000, // 12.600.000 ₫ VietQR / Thẻ
    depositCashCollected: 500000, // 500.000 ₫ tiền cọc mặt
    cashRefundsOrPayouts: 100000, // 100.000 ₫ chi mua đá/hoàn tiền
    actualCountedCash: null,
    discrepancyReason: '',
    status: 'OPEN',
    drawerOpenLogs: [
      {
        id: 'drw_02',
        timestamp: log2Time,
        reason: 'Thu tiền cọc đặt bàn Bàn 05 (Trần Thanh Hương)',
        triggeredBy: 'Thu ngân Minh Anh',
        idempotencyKey: 'init-drawer-002',
      },
      {
        id: 'drw_01',
        timestamp: log1Time,
        reason: `Mở két kiểm tiền đầu ca (${meta.shiftName})`,
        triggeredBy: 'Thu ngân Minh Anh',
        idempotencyKey: 'init-drawer-001',
      },
    ],
    payoutLogs: [
      {
        id: 'pay_01',
        timestamp: log2Time,
        amount: 100000,
        note: 'Chi tạm ứng mua đá viên & chanh tươi cho quầy pha chế',
        createdBy: 'Thu ngân Minh Anh',
        idempotencyKey: 'init-payout-001',
      },
    ],
    bankTransferSales: 7400000,
    cardSales: 3800000,
    eWalletSales: 1400000,
    totalOrdersSettled: 42,
    totalRevenue: 21050000,
    notes: [],
  };
}

function parseMinutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function createInitialAttendance(
  shift: ShiftSettlementRecord,
  now: Date = new Date()
): { current: CashierAttendanceEntry; logs: CashierAttendanceEntry[] } {
  const todayStr = formatShortDateVN(now);
  const yesterday = formatShortDateVN(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const twoDaysAgo = formatShortDateVN(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
  const threeDaysAgo = formatShortDateVN(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000));

  const current: CashierAttendanceEntry = {
    id: `att_${shift.shiftId}`,
    staffId: 'cashier_minh_anh',
    staffName: shift.cashierName,
    shiftId: shift.shiftId,
    shiftName: shift.shiftName,
    date: todayStr,
    checkInTime: shift.checkedInAt,
    method: 'PIN',
    isLate: false,
    lateMinutes: 0,
    status: 'WORKING',
    breakMinutes: 0,
    note: 'Nhận két và kiểm đếm tiền đầu ca',
    idempotencyKey: 'init-att-today',
  };

  const history: CashierAttendanceEntry[] = [
    current,
    {
      id: 'att_hist_01',
      staffId: 'cashier_minh_anh',
      staffName: shift.cashierName,
      shiftId: 'shift_hist_01',
      shiftName: 'Ca chiều • Sảnh Tầng 1',
      date: yesterday,
      checkInTime: '13:54',
      checkOutTime: '18:05',
      method: 'FACE_SCAN',
      isLate: false,
      lateMinutes: 0,
      status: 'CHECKED_OUT',
      breakMinutes: 15,
      note: 'Đúng giờ, bàn giao két đủ',
    },
    {
      id: 'att_hist_02',
      staffId: 'cashier_minh_anh',
      staffName: shift.cashierName,
      shiftId: 'shift_hist_02',
      shiftName: 'Ca tối • Sảnh Tầng 1',
      date: twoDaysAgo,
      checkInTime: '18:06',
      checkOutTime: '22:08',
      method: 'PIN',
      isLate: true,
      lateMinutes: 6,
      status: 'CHECKED_OUT',
      breakMinutes: 0,
      note: 'Kẹt xe đầu ca tối',
    },
    {
      id: 'att_hist_03',
      staffId: 'cashier_minh_anh',
      staffName: shift.cashierName,
      shiftId: 'shift_hist_03',
      shiftName: 'Ca sáng • Sảnh Tầng 1',
      date: threeDaysAgo,
      checkInTime: '08:52',
      checkOutTime: '14:00',
      method: 'FACE_SCAN',
      isLate: false,
      lateMinutes: 0,
      status: 'CHECKED_OUT',
      breakMinutes: 20,
    },
  ];

  return { current, logs: history };
}

export function computeTableSubtotal(table: CashierTable): number {
  return table.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

export function computeTablePayable(table: CashierTable): number {
  const subtotal = computeTableSubtotal(table);
  const vat = Math.round(subtotal * 0.08);
  const net = subtotal + vat - table.discountAmount - table.depositAmount;
  return Math.max(0, net);
}

interface CreateReservationInput {
  customerName: string;
  phone: string;
  partySize: number;
  reservedTime: string;
  reservedDate: string;
  area: CashierTableArea;
  tableId: string;
  depositAmount: number;
  depositMethod: PaymentMethodType;
  note?: string;
}

interface PosStoreState {
  tables: CashierTable[];
  reservations: TableReservation[];
  shift: ShiftSettlementRecord;
  currentAttendance: CashierAttendanceEntry;
  attendanceLogs: CashierAttendanceEntry[];
  selectedTableId: string | null;
  hasHydratedClock: boolean;
  isCashDrawerOpen: boolean;
  isConnected: boolean;
  isLoading: boolean;
  lastSyncedAt: number | null;
  lastActionToast: string | null;
  lastPrintedReceipt: {
    receiptNo: string;
    tableLabel: string;
    printedAt: string;
    subtotal: number;
    vat: number;
    discount: number;
    deposit: number;
    totalPaid: number;
    method: PaymentMethodType;
    cashReceived: number;
    changeAmount: number;
    idempotencyKey: string;
    items: CashierTable['items'];
  } | null;

  // Navigation & Selection
  selectTable: (tableId: string | null) => void;
  clearToast: () => void;
  setToast: (message: string) => void;
  syncRealtimeClockSeed: () => void;

  // Realtime STOMP + REST Reconnect Sync (Rule 03)
  initializeWebSocket: () => void;
  syncWithBackend: () => Promise<void>;

  // UC1: Create Table Reservation + Check Table Availability + Collect Booking Deposit
  checkAvailableTables: (area: CashierTableArea | 'ALL', partySize: number) => CashierTable[];
  createReservation: (input: CreateReservationInput) => TableReservation;

  // UC2: Check-in Reserved Table
  checkInReservation: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;

  // UC3: Merge 2+ tables (keeping merged tables active OCCUPIED) & Split/unmerge selected tables from merged group
  mergeTables: (sourceTableIds: string | string[], targetTableId: string) => void;
  splitMergedTables: (masterTableId: string, memberTableIds: string[]) => void;

  // UC4: Process Counter Settlement & Payment (Lock Table, Apply Discount, ESC/POS, Cash Drawer)
  lockTableForSettlement: (tableId: string) => void;
  unlockTableState: (tableId: string) => void;
  applyDiscountRule: (tableId: string, rule: DiscountRule) => void;
  triggerCashDrawerOpening: (reason: string) => CashDrawerLog;
  closeCashDrawer: (reason?: string) => CashDrawerLog;
  toggleCashDrawer: (openReason?: string) => CashDrawerLog;
  printReceiptEscPos: (
    tableId: string,
    method: PaymentMethodType,
    cashReceived?: number
  ) => void;
  processCounterSettlement: (params: {
    tableId: string;
    method: PaymentMethodType;
    cashReceived: number;
    printEscPos: boolean;
    openCashDrawer: boolean;
  }) => void;
  markTableCleanDone: (tableId: string) => void;

  // UC5: Settle Cash & Balance Shift & Internal Payout Note
  recordInternalPayout: (amount: number, note: string) => CashPayoutEntry | null;
  settleShiftAndBalance: (actualCountedCash: number, discrepancyReason: string) => void;
  reopenShiftDemo: () => void;

  // UC6: Cashier Timekeeping (Chấm công vào ca / nghỉ ca / tan ca)
  clockInAttendance: (method: AttendanceMethod, pinCode?: string, note?: string) => boolean;
  toggleBreakAttendance: () => void;
  clockOutAttendance: (note?: string) => void;
}

const initialShiftSeed = createInitialShift(SSR_FALLBACK_DATE);
const initialAttendanceSeed = createInitialAttendance(initialShiftSeed, SSR_FALLBACK_DATE);

export const usePosStore = create<PosStoreState>((set, get) => ({
  tables: INITIAL_TABLES,
  reservations: createInitialReservations(SSR_FALLBACK_DATE),
  shift: initialShiftSeed,
  currentAttendance: initialAttendanceSeed.current,
  attendanceLogs: initialAttendanceSeed.logs,
  selectedTableId: null,
  hasHydratedClock: false,
  isCashDrawerOpen: false,
  isConnected: false,
  isLoading: false,
  lastSyncedAt: null,
  lastActionToast: null,
  lastPrintedReceipt: null,

  selectTable: (tableId) => set({ selectedTableId: tableId }),
  clearToast: () => set({ lastActionToast: null }),
  setToast: (message) => set({ lastActionToast: message }),
  syncRealtimeClockSeed: () => {
    if (get().hasHydratedClock) return;
    const now = new Date();
    const liveShift = createInitialShift(now);
    const liveAttendance = createInitialAttendance(liveShift, now);
    set({
      shift: liveShift,
      reservations: createInitialReservations(now),
      currentAttendance: liveAttendance.current,
      attendanceLogs: liveAttendance.logs,
      hasHydratedClock: true,
    });
  },

  syncWithBackend: async () => {
    set({ isLoading: true });
    try {
      const remoteTables = await fetchApi<CashierTable[]>('/pos/floor-status');
      if (Array.isArray(remoteTables) && remoteTables.length > 0) {
        set({
          tables: remoteTables,
          isLoading: false,
          lastSyncedAt: Date.now(),
        });
        return;
      }
      set({ isLoading: false, lastSyncedAt: Date.now() });
    } catch {
      // Khi chạy bản Demo độc lập không bật Backend, giữ nguyên state demo mượt mà
      set({ isLoading: false, lastSyncedAt: Date.now() });
    }
  },

  initializeWebSocket: () => {
    try {
      const client = getStompClient();

      client.onConnect = () => {
        set({ isConnected: true });
        // Luật thép Rule 03: Gọi REST API đồng bộ dữ liệu mới nhất khi kết nối / kết nối lại
        get().syncWithBackend();

        client.subscribe('/topic/pos/tables', (message: { body: string }) => {
          try {
            const event = JSON.parse(message.body);
            if (event.type === 'TABLE_UPDATED' && event.table) {
              set((state) => ({
                tables: state.tables.map((t) =>
                  t.id === event.table.id ? { ...t, ...event.table } : t
                ),
                lastSyncedAt: Date.now(),
              }));
            }
          } catch (err) {
            console.error('[POS STOMP] Lỗi đọc frame:', err);
          }
        });
      };

      client.onDisconnect = () => {
        set({ isConnected: false });
      };

      if (!client.active) {
        client.activate();
      }
    } catch {
      // Fallback an toàn cho môi trường demo
      set({ isConnected: false });
    }
  },

  // UC1 <<include>> Check Table Availability
  checkAvailableTables: (area, partySize) => {
    const { tables } = get();
    return tables.filter((t) => {
      const matchArea = area === 'ALL' || t.area === area;
      const enoughSeats = t.seats >= partySize;
      const isFree = t.status === 'IDLE';
      return matchArea && enoughSeats && isFree;
    });
  },

  // UC1: Create Table Reservation + <<extend>> Collect Booking Deposit
  createReservation: (input) => {
    const idempotencyKey = generateIdempotencyKey();
    const { tables, reservations, shift } = get();
    const targetTable = tables.find((t) => t.id === input.tableId);
    const depositInt = Math.max(0, Math.round(input.depositAmount));

    const now = new Date();
    const todayStr = formatShortDateVN(now);
    const resolvedDate =
      input.reservedDate === todayStr
        ? resolveReservationTargetDate(input.reservedTime, now).reservedDate
        : input.reservedDate;

    const newReservation: TableReservation = {
      id: `res_${Date.now().toString().slice(-4)}`,
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      partySize: input.partySize,
      reservedTime: input.reservedTime,
      reservedDate: resolvedDate,
      area: input.area,
      tableId: input.tableId,
      tableLabel: targetTable?.label ?? 'Bàn đặt',
      depositAmount: depositInt,
      depositMethod: input.depositMethod,
      note: input.note?.trim(),
      status: 'CONFIRMED',
    };

    const nextDrawerLogs = [...shift.drawerOpenLogs];
    let nextDepositCash = shift.depositCashCollected;
    let nextQrSales = shift.qrAndCardSales;

    if (depositInt > 0) {
      if (input.depositMethod === 'CASH') {
        nextDepositCash += depositInt;
        nextDrawerLogs.unshift({
          id: `drw_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
          reason: `Thu tiền cọc đặt bàn ${newReservation.tableLabel} (${newReservation.customerName})`,
          triggeredBy: shift.cashierName,
          idempotencyKey,
        });
      } else {
        nextQrSales += depositInt;
      }
    }

    set({
      reservations: [newReservation, ...reservations],
      tables: tables.map((t) =>
        t.id === input.tableId
          ? {
              ...t,
              status: 'RESERVED',
              guests: input.partySize,
              depositAmount: depositInt,
              reservationId: newReservation.id,
              staff: 'Lễ tân / Thu ngân',
            }
          : t
      ),
      shift: {
        ...shift,
        depositCashCollected: nextDepositCash,
        qrAndCardSales: nextQrSales,
        drawerOpenLogs: nextDrawerLogs,
      },
      selectedTableId: input.tableId,
      lastActionToast: `Đã tạo đặt bàn ${newReservation.tableLabel} lúc ${newReservation.reservedTime} (${newReservation.reservedDate}) cho ${newReservation.customerName}${
        depositInt > 0 ? ` (Đã thu cọc ${depositInt.toLocaleString('vi-VN')} ₫)` : ''
      }.`,
    });

    fetchApi('/pos/reservations', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(newReservation),
    }).catch(() => {});

    return newReservation;
  },

  // UC2: Check-in Reserved Table
  checkInReservation: (reservationId) => {
    const idempotencyKey = generateIdempotencyKey();
    const { reservations, tables } = get();
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    set({
      reservations: reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'CHECKED_IN' } : r
      ),
      tables: tables.map((t) =>
        t.id === res.tableId
          ? {
              ...t,
              status: 'OCCUPIED',
              guests: res.partySize,
              seatedMin: 1,
              staff: 'Lan',
              depositAmount: res.depositAmount,
              items:
                t.items.length > 0
                  ? t.items
                  : [
                      {
                        id: `item_${Date.now()}`,
                        name: 'Trà Sen Tây Hồ (Khách đặt trước)',
                        qty: res.partySize,
                        unitPrice: 45000,
                        status: 'WAITING',
                        note: res.note,
                      },
                    ],
            }
          : t
      ),
      selectedTableId: res.tableId,
      lastActionToast: `Check-in thành công ${res.tableLabel} — Khách: ${res.customerName}. Tiền cọc đã gắn vào bill.`,
    });

    fetchApi(`/pos/reservations/${reservationId}/check-in`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    }).catch(() => {});
  },

  cancelReservation: (reservationId) => {
    const idempotencyKey = generateIdempotencyKey();
    const { reservations, tables } = get();
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    set({
      reservations: reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'CANCELLED' } : r
      ),
      tables: tables.map((t) =>
        t.id === res.tableId
          ? {
              ...t,
              status: 'IDLE',
              guests: 0,
              depositAmount: 0,
              reservationId: undefined,
              staff: '',
            }
          : t
      ),
      lastActionToast: `Đã hủy đặt bàn ${res.tableLabel} (${res.customerName}). Bàn đã mở trống trở lại.`,
    });

    fetchApi(`/pos/reservations/${reservationId}/cancel`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    }).catch(() => {});
  },

  // UC3: Merge 2+ Tables (giữ trạng thái Đang phục vụ) & Split/Unmerge Tables from merged group
  mergeTables: (sourceTableIds, targetTableId) => {
    const idempotencyKey = generateIdempotencyKey();
    const { tables } = get();
    const normalizedIds = Array.from(
      new Set((Array.isArray(sourceTableIds) ? sourceTableIds : [sourceTableIds]).filter((id) => id !== targetTableId))
    );
    if (normalizedIds.length === 0) return;

    const target = tables.find((t) => t.id === targetTableId);
    if (
      !target ||
      target.mergedIntoTableId ||
      target.status === 'LOCKED' ||
      target.status === 'CLEANING' ||
      target.status === 'RESERVED'
    ) {
      return;
    }

    const sources = normalizedIds
      .map((id) => tables.find((t) => t.id === id))
      .filter(
        (src): src is CashierTable =>
          Boolean(src) &&
          !src!.mergedIntoTableId &&
          !(src!.mergedMemberTables && src!.mergedMemberTables.length > 0) &&
          (src!.status === 'OCCUPIED' || src!.status === 'OVERDUE' || src!.status === 'IDLE')
      );

    if (sources.length === 0) return;

    const sourceIdSet = new Set(sources.map((s) => s.id));
    const mergedItems = target.items.map((it) => ({ ...it }));
    const newSnapshots: MergedTableSnapshot[] = [];
    let addedGuests = 0;
    let addedDeposit = 0;
    let addedDiscount = 0;

    for (const src of sources) {
      newSnapshots.push({
        tableId: src.id,
        label: src.label,
        originalStatus: src.status,
        guests: src.guests,
        seatedMin: src.seatedMin,
        staff: src.staff,
        depositAmount: src.depositAmount,
        discountAmount: src.discountAmount,
        discountLabel: src.discountLabel,
        reservationId: src.reservationId,
        allergyAlert: src.allergyAlert,
        items: src.items.map((it) => ({ ...it })),
      });

      addedGuests += src.guests;
      addedDeposit += src.depositAmount;
      addedDiscount += src.discountAmount;

      // Hợp nhất các món trùng tên, đơn giá & ghi chú; bảo toàn số nguyên VND
      for (const srcItem of src.items) {
        const existingIdx = mergedItems.findIndex(
          (it) =>
            it.name === srcItem.name &&
            it.unitPrice === srcItem.unitPrice &&
            (it.note ?? '') === (srcItem.note ?? '')
        );
        if (existingIdx >= 0) {
          mergedItems[existingIdx] = {
            ...mergedItems[existingIdx],
            qty: mergedItems[existingIdx].qty + srcItem.qty,
          };
        } else {
          mergedItems.push({ ...srcItem, id: `${srcItem.id}_m_${src.id}` });
        }
      }
    }

    const allMergedSnapshots = [...(target.mergedMemberTables ?? []), ...newSnapshots];
    const mergedLabels = sources.map((s) => s.label).join(', ');

    set({
      tables: tables.map((t) => {
        if (t.id === targetTableId) {
          return {
            ...t,
            status: t.status === 'IDLE' ? 'OCCUPIED' : t.status,
            guests: t.guests + addedGuests,
            depositAmount: t.depositAmount + addedDeposit,
            discountAmount: t.discountAmount + addedDiscount,
            items: mergedItems,
            splits: undefined,
            mergedMemberTables: allMergedSnapshots,
          };
        }
        if (sourceIdSet.has(t.id)) {
          return {
            ...t,
            status: 'OCCUPIED',
            seatedMin: t.seatedMin || target.seatedMin || 1,
            staff: t.staff || target.staff,
            depositAmount: 0,
            discountAmount: 0,
            discountLabel: undefined,
            lockedBy: undefined,
            items: [],
            splits: undefined,
            mergedIntoTableId: targetTableId,
            mergedIntoTableLabel: target.label,
          };
        }
        return t;
      }),
      selectedTableId: targetTableId,
      lastActionToast: `Đã gộp ${mergedLabels} vào ${target.label}. Các bàn gộp vẫn giữ trạng thái Đang phục vụ.`,
    });

    fetchApi('/pos/invoices/merge', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        sourceTableIds: sources.map((s) => s.id),
        targetTableId,
        idempotencyKey,
      }),
    }).catch(() => {});
  },

  splitMergedTables: (masterTableId, memberTableIds) => {
    const idempotencyKey = generateIdempotencyKey();
    const { tables } = get();
    const directTable = tables.find((t) => t.id === masterTableId);
    if (!directTable) return;

    const resolvedMasterId = directTable.mergedIntoTableId ?? directTable.id;
    const master = tables.find((t) => t.id === resolvedMasterId);
    if (!master || !master.mergedMemberTables || master.mergedMemberTables.length === 0) return;

    const splitIdSet = new Set(memberTableIds);
    const toDetach = master.mergedMemberTables.filter((snap) => splitIdSet.has(snap.tableId));
    const remainingSnapshots = master.mergedMemberTables.filter(
      (snap) => !splitIdSet.has(snap.tableId)
    );
    if (toDetach.length === 0) return;

    const snapshotByTableId = new Map(toDetach.map((snap) => [snap.tableId, snap]));
    const remainingMasterItems = master.items.map((it) => ({ ...it }));
    let detachedGuests = 0;
    let detachedDeposit = 0;
    let detachedDiscount = 0;

    for (const snap of toDetach) {
      detachedGuests += snap.guests;
      detachedDeposit += snap.depositAmount;
      detachedDiscount += snap.discountAmount;

      for (const origItem of snap.items) {
        let qtyLeftToSubtract = origItem.qty;
        for (let idx = remainingMasterItems.length - 1; idx >= 0 && qtyLeftToSubtract > 0; idx--) {
          const cur = remainingMasterItems[idx];
          if (
            cur.name === origItem.name &&
            cur.unitPrice === origItem.unitPrice &&
            (cur.note ?? '') === (origItem.note ?? '')
          ) {
            const take = Math.min(cur.qty, qtyLeftToSubtract);
            cur.qty -= take;
            qtyLeftToSubtract -= take;
            if (cur.qty <= 0) {
              remainingMasterItems.splice(idx, 1);
            }
          }
        }
      }
    }

    const detachedLabels = toDetach.map((s) => s.label).join(', ');
    const nextMasterDiscount = Math.max(0, master.discountAmount - detachedDiscount);

    set({
      tables: tables.map((t) => {
        if (t.id === master.id) {
          return {
            ...t,
            guests: Math.max(0, master.guests - detachedGuests),
            depositAmount: Math.max(0, master.depositAmount - detachedDeposit),
            discountAmount: nextMasterDiscount,
            discountLabel: nextMasterDiscount > 0 ? master.discountLabel : undefined,
            items: remainingMasterItems,
            splits: undefined,
            mergedMemberTables: remainingSnapshots.length > 0 ? remainingSnapshots : undefined,
          };
        }
        const snap = snapshotByTableId.get(t.id);
        if (snap) {
          return {
            ...t,
            status: snap.originalStatus,
            guests: snap.guests,
            seatedMin: snap.seatedMin,
            staff: snap.staff,
            depositAmount: snap.depositAmount,
            discountAmount: snap.discountAmount,
            discountLabel: snap.discountLabel,
            reservationId: snap.reservationId,
            allergyAlert: snap.allergyAlert,
            items: snap.items.map((it) => ({ ...it })),
            splits: undefined,
            mergedIntoTableId: undefined,
            mergedIntoTableLabel: undefined,
          };
        }
        return t;
      }),
      selectedTableId: toDetach.length === 1 ? toDetach[0].tableId : master.id,
      lastActionToast: `Đã tách ${detachedLabels} ra khỏi nhóm ${master.label}.`,
    });

    fetchApi('/pos/tables/split', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        masterTableId: master.id,
        memberTableIds: toDetach.map((s) => s.tableId),
        idempotencyKey,
      }),
    }).catch(() => {});
  },

  // UC4 <<include>> Lock Table State
  lockTableForSettlement: (tableId) => {
    const idempotencyKey = generateIdempotencyKey();
    const { tables, shift } = get();
    const target = tables.find((t) => t.id === tableId);
    if (!target || target.status === 'IDLE' || target.status === 'CLEANING') return;

    set({
      tables: tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'LOCKED',
              lockedBy: shift.cashierName,
            }
          : t
      ),
      lastActionToast: `Đã khóa trạng thái ${target.label} (Lock Table State) để quyết toán an toàn.`,
    });

    fetchApi(`/pos/tables/${tableId}/lock`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    }).catch(() => {});
  },

  unlockTableState: (tableId) => {
    const { tables } = get();
    set({
      tables: tables.map((t) =>
        t.id === tableId && t.status === 'LOCKED'
          ? {
              ...t,
              status: t.seatedMin >= 45 ? 'OVERDUE' : 'OCCUPIED',
              lockedBy: undefined,
            }
          : t
      ),
      lastActionToast: 'Đã mở khóa trạng thái bàn.',
    });
  },

  // UC4 <<extend>> Apply Discount
  applyDiscountRule: (tableId, rule) => {
    const { tables } = get();
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const subtotal = computeTableSubtotal(table);
    let discountInt = 0;
    if (rule.type === 'PERCENT') {
      discountInt = Math.round((subtotal * rule.value) / 100);
    } else {
      discountInt = Math.min(subtotal, Math.round(rule.value));
    }

    set({
      tables: tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              discountAmount: discountInt,
              discountLabel: discountInt > 0 ? rule.label : undefined,
            }
          : t
      ),
      lastActionToast:
        discountInt > 0
          ? `Đã áp dụng "${rule.label}" (-${discountInt.toLocaleString('vi-VN')} ₫) cho ${table.label}.`
          : `Đã gỡ chiết khấu cho ${table.label}.`,
    });
  },

  // UC4 <<extend>> Trigger Cash Drawer Opening
  triggerCashDrawerOpening: (reason) => {
    const idempotencyKey = generateIdempotencyKey();
    const { shift } = get();
    const newLog: CashDrawerLog = {
      id: `drw_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      reason: reason.trim() || 'Mở ngăn kéo tiền tại quầy thu ngân',
      triggeredBy: shift.cashierName,
      idempotencyKey,
    };

    set({
      isCashDrawerOpen: true,
      shift: {
        ...shift,
        drawerOpenLogs: [newLog, ...shift.drawerOpenLogs],
      },
      lastActionToast: `Đã phát xung mở két tiền (RJ11/ESC-POS): "${newLog.reason}"`,
    });

    fetchApi('/pos/hardware/cash-drawer/open', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(newLog),
    }).catch(() => {});

    return newLog;
  },

  closeCashDrawer: (reason = 'Đóng két tiền tại quầy thu ngân') => {
    const idempotencyKey = generateIdempotencyKey();
    const { shift } = get();
    const newLog: CashDrawerLog = {
      id: `drw_${Date.now()}`,
      timestamp: formatTimeHHMMSS(new Date()),
      reason: reason.trim() || 'Đóng két tiền tại quầy thu ngân',
      triggeredBy: shift.cashierName,
      idempotencyKey,
    };

    set({
      isCashDrawerOpen: false,
      shift: {
        ...shift,
        drawerOpenLogs: [newLog, ...shift.drawerOpenLogs],
      },
      lastActionToast: 'Đã xác nhận đóng két tiền thu ngân.',
    });

    fetchApi('/pos/hardware/cash-drawer/close', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(newLog),
    }).catch(() => {});

    return newLog;
  },

  toggleCashDrawer: (openReason = 'Mở ngăn kéo tiền tại quầy thu ngân') => {
    if (get().isCashDrawerOpen) {
      return get().closeCashDrawer('Đóng két tiền tại quầy thu ngân');
    }
    return get().triggerCashDrawerOpening(openReason);
  },

  // UC4 <<extend>> Print Receipt via ESC/POS
  printReceiptEscPos: (tableId, method, cashReceived = 0) => {
    const idempotencyKey = generateIdempotencyKey();
    const { tables } = get();
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const subtotal = computeTableSubtotal(table);
    const vat = Math.round(subtotal * 0.08);
    const payable = computeTablePayable(table);
    const actualReceived = method === 'CASH' && cashReceived >= payable ? cashReceived : payable;
    const changeAmount = Math.max(0, actualReceived - payable);

    const receipt = {
      receiptNo: `HD-${new Date().getHours()}${new Date().getMinutes()}-${table.label.replace(/\s+/g, '')}`,
      tableLabel: table.label,
      printedAt: new Date().toLocaleString('vi-VN', { hour12: false }),
      subtotal,
      vat,
      discount: table.discountAmount,
      deposit: table.depositAmount,
      totalPaid: payable,
      method,
      cashReceived: actualReceived,
      changeAmount,
      idempotencyKey,
      items: [...table.items],
    };

    set({
      lastPrintedReceipt: receipt,
      lastActionToast: `Đã gửi lệnh in nhiệt ESC/POS (80mm) cho ${table.label} — Mã phiếu ${receipt.receiptNo}.`,
    });

    fetchApi('/pos/hardware/escpos/print', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(receipt),
    }).catch(() => {});
  },

  // UC4: Process Counter Settlement & Payment
  processCounterSettlement: ({ tableId, method, cashReceived, printEscPos, openCashDrawer }) => {
    const idempotencyKey = generateIdempotencyKey();
    const { tables } = get();
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const payable = computeTablePayable(table);
    const unpaidSplitSum = payable;

    if (printEscPos) {
      get().printReceiptEscPos(tableId, method, cashReceived);
    }

    if (openCashDrawer || method === 'CASH') {
      get().triggerCashDrawerOpening(`Thanh toán hóa đơn ${table.label} (${method})`);
    }

    const latestShift = get().shift;
    const isCash = method === 'CASH';
    const mergedMemberIdSet = new Set((table.mergedMemberTables ?? []).map((m) => m.tableId));

    set({
      tables: tables.map((t) =>
        t.id === tableId || mergedMemberIdSet.has(t.id)
          ? {
              ...t,
              status: 'CLEANING',
              guests: 0,
              seatedMin: 0,
              depositAmount: 0,
              discountAmount: 0,
              discountLabel: undefined,
              lockedBy: undefined,
              splits: undefined,
              allergyAlert: undefined,
              mergedIntoTableId: undefined,
              mergedIntoTableLabel: undefined,
              mergedMemberTables: undefined,
              items: [],
            }
          : t
      ),
      shift: {
        ...latestShift,
        cashSales: isCash ? latestShift.cashSales + unpaidSplitSum : latestShift.cashSales,
        qrAndCardSales: !isCash
          ? latestShift.qrAndCardSales + unpaidSplitSum
          : latestShift.qrAndCardSales,
      },
      lastActionToast: `Quyết toán thành công ${table.label} (${unpaidSplitSum.toLocaleString(
        'vi-VN'
      )} ₫). Bàn đã chuyển sang Cần dọn.`,
    });

    fetchApi(`/pos/tables/${tableId}/settle`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        tableId,
        amount: unpaidSplitSum,
        method,
        idempotencyKey,
      }),
    }).catch(() => {});
  },

  markTableCleanDone: (tableId) => {
    const { tables } = get();
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    set({
      tables: tables.map((t) =>
        t.id === tableId
          ? { ...t, status: 'IDLE', staff: '', guests: 0, seatedMin: 0, items: [] }
          : t
      ),
      lastActionToast: `${table.label} đã dọn xong và sẵn sàng đón khách mới.`,
    });
  },

  // UC5: Ghi nhận phiếu chi nội bộ có ghi chú & Settle Cash
  recordInternalPayout: (amount, note) => {
    const amountInt = Math.max(0, Math.round(amount));
    const trimmedNote = note.trim();
    if (amountInt <= 0 || !trimmedNote) {
      set({
        lastActionToast: 'Vui lòng nhập số tiền chi hợp lệ và ghi chú lý do chi nội bộ.',
      });
      return null;
    }

    const idempotencyKey = generateIdempotencyKey();
    const { shift } = get();
    const timestamp = formatTimeHHMMSS(new Date());

    const newPayout: CashPayoutEntry = {
      id: `pay_${Date.now()}`,
      timestamp,
      amount: amountInt,
      note: trimmedNote,
      createdBy: shift.cashierName,
      idempotencyKey,
    };

    const newDrawerLog: CashDrawerLog = {
      id: `drw_${Date.now()}`,
      timestamp,
      reason: `Chi nội bộ -${amountInt.toLocaleString('vi-VN')} ₫ (${trimmedNote})`,
      triggeredBy: shift.cashierName,
      idempotencyKey,
    };

    set({
      shift: {
        ...shift,
        cashRefundsOrPayouts: shift.cashRefundsOrPayouts + amountInt,
        payoutLogs: [newPayout, ...shift.payoutLogs],
        drawerOpenLogs: [newDrawerLog, ...shift.drawerOpenLogs],
      },
      lastActionToast: `Đã ghi nhận chi nội bộ -${amountInt.toLocaleString(
        'vi-VN'
      )} ₫: "${trimmedNote}"`,
    });

    fetchApi('/pos/shifts/payouts', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        shiftId: shift.shiftId,
        amount: amountInt,
        note: trimmedNote,
        idempotencyKey,
      }),
    }).catch(() => {});

    return newPayout;
  },

  // UC5: Settle Cash & Balance Shift
  settleShiftAndBalance: (actualCountedCash, discrepancyReason) => {
    const idempotencyKey = generateIdempotencyKey();
    const { shift } = get();
    const countedInt = Math.max(0, Math.round(actualCountedCash));

    set({
      shift: {
        ...shift,
        actualCountedCash: countedInt,
        discrepancyReason: discrepancyReason.trim(),
        status: 'SETTLED',
        settledAt: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      },
      lastActionToast: `Đã đối soát tiền mặt & chốt kết ca (${shift.shiftName}) thành công!`,
    });

    fetchApi('/pos/shifts/settle', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        shiftId: shift.shiftId,
        actualCountedCash: countedInt,
        discrepancyReason,
        idempotencyKey,
      }),
    }).catch(() => {});
  },

  reopenShiftDemo: () => {
    const { shift } = get();
    set({
      shift: {
        ...shift,
        status: 'OPEN',
        actualCountedCash: null,
        settledAt: undefined,
      },
      lastActionToast: 'Đã mở lại ca thu ngân (Chế độ Demo).',
    });
  },

  // UC6: Cashier Timekeeping (Chấm công Thu ngân)
  clockInAttendance: (method, pinCode, note) => {
    if (method === 'PIN' && (!pinCode || pinCode.trim().length < 4)) {
      set({
        lastActionToast: 'Vui lòng nhập đủ mã PIN gồm ít nhất 4 chữ số để chấm công vào ca.',
      });
      return false;
    }

    const now = new Date();
    const idempotencyKey = generateIdempotencyKey();
    const checkInTime = formatTimeHHMM(now);
    const { shift, attendanceLogs } = get();
    const lateDiff = Math.max(
      0,
      parseMinutesOfDay(checkInTime) - parseMinutesOfDay(shift.startTime)
    );
    const isLate = lateDiff > 5 && lateDiff < 240;
    const lateMinutes = isLate ? lateDiff : 0;

    const entry: CashierAttendanceEntry = {
      id: `att_${Date.now()}`,
      staffId: 'cashier_minh_anh',
      staffName: shift.cashierName,
      shiftId: shift.shiftId,
      shiftName: shift.shiftName,
      date: formatShortDateVN(now),
      checkInTime,
      method,
      isLate,
      lateMinutes,
      status: 'WORKING',
      breakMinutes: 0,
      note: note?.trim() || undefined,
      idempotencyKey,
    };

    const filteredLogs = attendanceLogs.filter((l) => l.id !== entry.id);

    set({
      currentAttendance: entry,
      attendanceLogs: [entry, ...filteredLogs],
      shift: {
        ...shift,
        checkedInAt: checkInTime,
      },
      lastActionToast: `Chấm công vào ca thành công lúc ${checkInTime} (${
        method === 'FACE_SCAN' ? 'Quét khuôn mặt' : 'Mã PIN'
      }).`,
    });

    fetchApi('/pos/attendance/clock-in', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        staffId: entry.staffId,
        shiftId: entry.shiftId,
        method,
        checkInTime,
        note: entry.note,
        idempotencyKey,
      }),
    }).catch(() => {});

    return true;
  },

  toggleBreakAttendance: () => {
    const now = new Date();
    const { currentAttendance, attendanceLogs } = get();
    if (
      currentAttendance.status === 'NOT_CHECKED_IN' ||
      currentAttendance.status === 'CHECKED_OUT'
    ) {
      return;
    }

    const nowHHMM = formatTimeHHMM(now);
    const isResuming = currentAttendance.status === 'ON_BREAK';
    let addedBreakMin = 0;

    if (isResuming && currentAttendance.breakStartedAt) {
      const diff =
        parseMinutesOfDay(nowHHMM) - parseMinutesOfDay(currentAttendance.breakStartedAt);
      addedBreakMin = Math.max(1, diff);
    }

    const updated: CashierAttendanceEntry = {
      ...currentAttendance,
      status: isResuming ? 'WORKING' : 'ON_BREAK',
      breakStartedAt: isResuming ? undefined : nowHHMM,
      breakMinutes: currentAttendance.breakMinutes + addedBreakMin,
    };

    set({
      currentAttendance: updated,
      attendanceLogs: attendanceLogs.map((l) => (l.id === updated.id ? updated : l)),
      lastActionToast: isResuming
        ? `Đã chấm công quay lại làm việc lúc ${nowHHMM}.`
        : `Đã bắt đầu nghỉ giữa ca lúc ${nowHHMM}.`,
    });
  },

  clockOutAttendance: (note) => {
    const now = new Date();
    const idempotencyKey = generateIdempotencyKey();
    const checkOutTime = formatTimeHHMM(now);
    const { currentAttendance, attendanceLogs } = get();

    let extraBreak = 0;
    if (currentAttendance.status === 'ON_BREAK' && currentAttendance.breakStartedAt) {
      extraBreak = Math.max(
        1,
        parseMinutesOfDay(checkOutTime) - parseMinutesOfDay(currentAttendance.breakStartedAt)
      );
    }

    const updated: CashierAttendanceEntry = {
      ...currentAttendance,
      checkOutTime,
      status: 'CHECKED_OUT',
      breakStartedAt: undefined,
      breakMinutes: currentAttendance.breakMinutes + extraBreak,
      note: note?.trim() ? note.trim() : currentAttendance.note,
      idempotencyKey,
    };

    set({
      currentAttendance: updated,
      attendanceLogs: attendanceLogs.map((l) => (l.id === updated.id ? updated : l)),
      lastActionToast: `Đã chấm công tan ca (Check-out) lúc ${checkOutTime}.`,
    });

    fetchApi('/pos/attendance/clock-out', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        attendanceId: updated.id,
        shiftId: updated.shiftId,
        checkOutTime,
        breakMinutes: updated.breakMinutes,
        note: updated.note,
        idempotencyKey,
      }),
    }).catch(() => {});
  },
}));

