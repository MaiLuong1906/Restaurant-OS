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
  formatIsoDate,
  formatShortDateVN,
  formatTimeHHMM,
  formatTimeHHMMSS,
  generateIdempotencyKey,
  getRealtimeShiftMeta,
  resolveReservationTargetDate,
} from '../lib/utils';

interface BackendReservationResponse {
  id: string;
  tableId: string | null;
  tableNumber: string | null;
  tableCapacity: number | null;
  tableStatus: 'VACANT' | 'SERVING' | 'BILLING' | 'CLEANING' | 'RESERVED' | null;
  qrCodeToken: string | null;
  zoneId: string | null;
  zoneName: string | null;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationTime: string;
  depositAmount: number;
  depositMethod: PaymentMethodType | null;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';
  notes: string | null;
}

interface BackendAvailableTableResponse {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'VACANT' | 'SERVING' | 'BILLING' | 'CLEANING' | 'RESERVED';
  zoneId: string | null;
  zoneName: string | null;
  qrCodeToken: string | null;
}

interface BackendTableResponse {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  currentOrderId?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  occupiedAt?: string | null;
}

interface BackendOrderItemResponse {
  id: string;
  dishId: string;
  dishNameSnapshot: string;
  portionId?: string | null;
  portionNameSnapshot?: string | null;
  quantity: number;
  unitPrice: number;
  status: string;
  notes?: string | null;
  allergyNote?: string | null;
}

interface BackendOrderResponse {
  id: string;
  tableId: string;
  orderCode?: string | null;
  status: string;
  totalAmount: number;
  customerNotes?: string | null;
  openedAt?: string | null;
  createdAt?: string | null;
  items: BackendOrderItemResponse[];
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapZoneNameToArea(zoneName?: string | null): CashierTableArea {
  if (!zoneName) return 'Sảnh Tầng 1';
  const lower = zoneName.toLowerCase();
  if (lower.includes('tầng 2') || lower.includes('vip')) return 'Tầng 2 VIP';
  if (lower.includes('sân vườn') || lower.includes('ngoài trời')) return 'Sân vườn';
  return 'Sảnh Tầng 1';
}

function mapBackendTableStatus(
  status?: string | null
): CashierTable['status'] {
  switch ((status || '').toUpperCase()) {
    case 'RESERVED':
      return 'RESERVED';
    case 'SERVING':
    case 'DINING':
    case 'OCCUPIED':
      return 'OCCUPIED';
    case 'BILLING':
    case 'LOCKED':
      return 'LOCKED';
    case 'CLEANING':
      return 'CLEANING';
    case 'VACANT':
    case 'IDLE':
    case 'FREE':
    default:
      return 'IDLE';
  }
}

function mapBackendItemStatus(
  status?: string | null
): 'WAITING' | 'READY' | 'SERVED' {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'SERVED') return 'SERVED';
  if (normalized === 'READY') return 'READY';
  return 'WAITING';
}

function computeSeatedMinutes(openedAtIso?: string | null, nowMs: number = Date.now()): number {
  if (!openedAtIso) return 0;
  const parsed = new Date(openedAtIso).getTime();
  if (Number.isNaN(parsed)) return 0;
  return Math.max(1, Math.round((nowMs - parsed) / 60000));
}

function mapBackendReservationToFrontend(res: BackendReservationResponse): TableReservation {
  const dt = new Date(res.reservationTime);
  const isValidDate = !Number.isNaN(dt.getTime());
  if (!isValidDate) {
    console.warn('[POS] Backend trả về reservationTime không hợp lệ:', res.reservationTime);
  }
  const reservedTime = isValidDate ? formatTimeHHMM(dt) : '19:00';
  const reservedDate = isValidDate ? formatShortDateVN(dt) : formatShortDateVN(new Date());
  const mappedStatus: TableReservation['status'] =
    res.status === 'SEATED'
      ? 'CHECKED_IN'
      : res.status === 'CANCELLED' || res.status === 'NO_SHOW'
      ? 'CANCELLED'
      : 'CONFIRMED';

  return {
    id: res.id,
    customerName: res.customerName,
    phone: res.customerPhone,
    partySize: res.guestCount,
    reservedTime,
    reservedDate,
    area: mapZoneNameToArea(res.zoneName),
    tableId: res.tableId ?? '',
    tableLabel: res.tableNumber ?? 'Bàn đặt',
    depositAmount: Math.max(0, Math.round(Number(res.depositAmount) || 0)),
    depositMethod: res.depositMethod ?? 'VIETQR',
    note: res.notes ?? undefined,
    status: mappedStatus,
  };
}

function buildReservationInstantIso(shortDateVN: string, timeHHMM: string): string {
  const parts = shortDateVN.split('/').map(Number);
  const [hh, mm] = timeHHMM.split(':').map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [d, m, y] = parts;
    const dt = new Date(
      y,
      m - 1,
      d,
      Number.isFinite(hh) ? hh : 19,
      Number.isFinite(mm) ? mm : 0,
      0
    );
    if (!Number.isNaN(dt.getTime())) {
      return dt.toISOString();
    }
  }
  return new Date(Date.now() + 30 * 60 * 1000).toISOString();
}

export const PRESET_DISCOUNTS: DiscountRule[] = [
  { id: 'd_none', code: 'NONE', label: 'Không giảm giá', type: 'FIXED', value: 0 },
  { id: 'd_vip10', code: 'VIP10', label: 'Thẻ thành viên VIP (-10%)', type: 'PERCENT', value: 10 },
  { id: 'd_lunch15', code: 'CA_SANG15', label: 'Ưu đãi Ca Sáng (-15%)', type: 'PERCENT', value: 15 },
  { id: 'd_voucher50k', code: 'GIAM50K', label: 'Voucher đối tác (-50.000 ₫)', type: 'FIXED', value: 50000 },
  { id: 'd_voucher100k', code: 'GIAM100K', label: 'Voucher tri ân (-100.000 ₫)', type: 'FIXED', value: 100000 },
];

const INITIAL_TABLES: CashierTable[] = [];

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
  idempotencyKey?: string;
  allowLocalOnly?: boolean;
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
  hasBackendTableUuids: boolean;
  syncError: string | null;
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
  createReservation: (input: CreateReservationInput) => TableReservation | null;

  // UC2: Check-in Reserved Table
  checkInReservation: (reservationId: string, idempotencyKey?: string) => void;
  cancelReservation: (reservationId: string, idempotencyKey?: string) => void;

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
  reservations: [],
  shift: initialShiftSeed,
  currentAttendance: initialAttendanceSeed.current,
  attendanceLogs: initialAttendanceSeed.logs,
  selectedTableId: null,
  hasHydratedClock: false,
  isCashDrawerOpen: false,
  isConnected: false,
  isLoading: false,
  hasBackendTableUuids: false,
  syncError: null,
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
      currentAttendance: liveAttendance.current,
      attendanceLogs: liveAttendance.logs,
      hasHydratedClock: true,
    });
    void get().syncWithBackend();
  },

  syncWithBackend: async () => {
    set({ isLoading: true });
    try {
      const now = new Date();
      const nowMs = now.getTime();
      const todayIso = formatIsoDate(now);
      const todayShortVN = formatShortDateVN(now);
      const futureCheckTime = new Date(nowMs + 30 * 60 * 1000).toISOString();

      const [
        tablesResult,
        activeOrdersResult,
        remoteReservationsResult,
        availableTablesResult,
      ] = await Promise.allSettled([
        fetchApi<BackendTableResponse[]>('/tables'),
        fetchApi<BackendOrderResponse[]>('/orders/active'),
        fetchApi<BackendReservationResponse[]>(
          `/reservations?date=${encodeURIComponent(todayIso)}`
        ),
        fetchApi<BackendAvailableTableResponse[]>(
          `/reservations/available-tables?time=${encodeURIComponent(futureCheckTime)}&guestCount=1`
        ),
      ]);

      if (
        tablesResult.status === 'rejected' &&
        activeOrdersResult.status === 'rejected' &&
        remoteReservationsResult.status === 'rejected' &&
        availableTablesResult.status === 'rejected'
      ) {
        const reason =
          tablesResult.reason instanceof Error
            ? tablesResult.reason.message
            : remoteReservationsResult.reason instanceof Error
            ? remoteReservationsResult.reason.message
            : 'Không thể kết nối máy chủ POS';
        set({
          isLoading: false,
          syncError: `Chưa đồng bộ được với máy chủ (${reason}). Vui lòng kiểm tra kết nối Backend.`,
          lastActionToast: `Chưa đồng bộ được dữ liệu POS: ${reason}`,
        });
        return;
      }

      const nextReservations =
        remoteReservationsResult.status === 'fulfilled' &&
        Array.isArray(remoteReservationsResult.value)
          ? remoteReservationsResult.value.map(mapBackendReservationToFrontend)
          : get().reservations;

      const existingTablesById = new Map(get().tables.map((t) => [t.id, t]));
      const existingTablesByLabel = new Map(
        get().tables.map((t) => [t.label.trim().toLowerCase(), t])
      );

      // Map zoneName bổ trợ từ /reservations/available-tables nếu có
      const availZoneByLabel = new Map<string, { id: string; capacity: number; zoneName: string | null }>();
      if (
        availableTablesResult.status === 'fulfilled' &&
        Array.isArray(availableTablesResult.value)
      ) {
        for (const tb of availableTablesResult.value) {
          availZoneByLabel.set(tb.tableNumber.trim().toLowerCase(), {
            id: tb.id,
            capacity: tb.capacity,
            zoneName: tb.zoneName,
          });
        }
      }

      // Map active orders theo tableId
      const activeOrderByTableId = new Map<string, BackendOrderResponse>();
      if (
        activeOrdersResult.status === 'fulfilled' &&
        Array.isArray(activeOrdersResult.value)
      ) {
        for (const ord of activeOrdersResult.value) {
          if (ord.tableId && !activeOrderByTableId.has(ord.tableId)) {
            activeOrderByTableId.set(ord.tableId, ord);
          }
        }
      }

      let nextTables: CashierTable[] = [...get().tables];

      // 1. Xây dựng danh sách bàn thật từ GET /api/v1/tables (hoặc fallback từ available-tables)
      if (
        tablesResult.status === 'fulfilled' &&
        Array.isArray(tablesResult.value) &&
        tablesResult.value.length > 0
      ) {
        const sortedBackendTables = [...tablesResult.value].sort((a, b) =>
          a.tableNumber.localeCompare(b.tableNumber, 'vi', { numeric: true })
        );

        nextTables = sortedBackendTables.map((bt) => {
          const normalizedLabel = bt.tableNumber.trim().toLowerCase();
          const prev =
            existingTablesById.get(bt.id) ?? existingTablesByLabel.get(normalizedLabel);
          const availMeta = availZoneByLabel.get(normalizedLabel);
          const resolvedZoneName = bt.zoneName ?? availMeta?.zoneName ?? null;
          const area: CashierTableArea = resolvedZoneName
            ? mapZoneNameToArea(resolvedZoneName)
            : prev?.area ?? 'Sảnh Tầng 1';

          let mappedStatus = mapBackendTableStatus(bt.status);
          const activeOrder = activeOrderByTableId.get(bt.id);

          const orderItems = activeOrder
            ? (activeOrder.items ?? [])
                .filter((it) => (it.status || '').toUpperCase() !== 'REJECTED')
                .map((it) => {
                  const noteParts = [it.notes?.trim(), it.allergyNote ? `Dị ứng: ${it.allergyNote.trim()}` : '']
                    .filter(Boolean);
                  return {
                    id: it.id,
                    name: it.dishNameSnapshot || 'Món ăn',
                    qty: Math.max(1, Math.round(Number(it.quantity) || 1)),
                    unitPrice: Math.max(0, Math.round(Number(it.unitPrice) || 0)),
                    status: mapBackendItemStatus(it.status),
                    note: noteParts.length > 0 ? noteParts.join(' • ') : undefined,
                  };
                })
            : prev?.items ?? [];

          const allergyNotes = activeOrder
            ? Array.from(
                new Set(
                  (activeOrder.items ?? [])
                    .map((it) => it.allergyNote?.trim())
                    .filter((n): n is string => Boolean(n))
                )
              )
            : [];

          const seatedMin = activeOrder
            ? computeSeatedMinutes(activeOrder.openedAt ?? activeOrder.createdAt ?? bt.occupiedAt, nowMs)
            : mappedStatus === 'OCCUPIED' || mappedStatus === 'LOCKED'
            ? computeSeatedMinutes(bt.occupiedAt, nowMs) || prev?.seatedMin || 1
            : 0;

          if (activeOrder && mappedStatus === 'IDLE') {
            mappedStatus = 'OCCUPIED';
          }
          if (mappedStatus === 'OCCUPIED' && seatedMin >= 45) {
            mappedStatus = 'OVERDUE';
          }

          return {
            id: bt.id,
            label: bt.tableNumber,
            seats: bt.capacity || prev?.seats || 4,
            area,
            status: prev?.status === 'LOCKED' ? 'LOCKED' : mappedStatus,
            guests:
              mappedStatus === 'IDLE' || mappedStatus === 'CLEANING'
                ? 0
                : prev?.guests && prev.guests > 0
                ? prev.guests
                : activeOrder
                ? Math.min(bt.capacity || 4, Math.max(1, orderItems.reduce((s, i) => s + i.qty, 0)))
                : 0,
            seatedMin,
            staff:
              mappedStatus === 'IDLE'
                ? ''
                : prev?.staff || (activeOrder ? 'Phục vụ' : ''),
            depositAmount: prev?.depositAmount ?? 0,
            discountAmount: prev?.discountAmount ?? 0,
            discountLabel: prev?.discountLabel,
            reservationId: prev?.reservationId,
            lockedBy: prev?.lockedBy,
            allergyAlert:
              allergyNotes.length > 0
                ? allergyNotes.join(' | ')
                : activeOrder?.customerNotes?.toLowerCase().includes('dị ứng')
                ? activeOrder.customerNotes
                : prev?.allergyAlert,
            mergedIntoTableId: prev?.mergedIntoTableId,
            mergedIntoTableLabel: prev?.mergedIntoTableLabel,
            mergedMemberTables: prev?.mergedMemberTables,
            items: mappedStatus === 'IDLE' || mappedStatus === 'CLEANING' ? [] : orderItems,
          };
        });
      } else if (
        availableTablesResult.status === 'fulfilled' &&
        Array.isArray(availableTablesResult.value) &&
        availableTablesResult.value.length > 0
      ) {
        nextTables = availableTablesResult.value.map((tb) => {
          const prev =
            existingTablesById.get(tb.id) ??
            existingTablesByLabel.get(tb.tableNumber.trim().toLowerCase());
          return {
            id: tb.id,
            label: tb.tableNumber,
            seats: tb.capacity || 4,
            area: mapZoneNameToArea(tb.zoneName),
            status: mapBackendTableStatus(tb.status),
            guests: prev?.guests ?? 0,
            seatedMin: prev?.seatedMin ?? 0,
            staff: prev?.staff ?? '',
            depositAmount: prev?.depositAmount ?? 0,
            discountAmount: prev?.discountAmount ?? 0,
            items: prev?.items ?? [],
          };
        });
      }

      // 2. Đồng bộ trạng thái các bàn đã đặt trước / đã check-in TRONG NGÀY HÔM NAY từ DB
      if (
        remoteReservationsResult.status === 'fulfilled' &&
        Array.isArray(remoteReservationsResult.value)
      ) {
        for (const rawRes of remoteReservationsResult.value) {
          const mappedRes = mapBackendReservationToFrontend(rawRes);
          if (mappedRes.reservedDate !== todayShortVN) {
            continue;
          }

          const existsInList = nextTables.some(
            (t) =>
              (rawRes.tableId && t.id === rawRes.tableId) ||
              (rawRes.tableNumber &&
                t.label.trim().toLowerCase() === rawRes.tableNumber.trim().toLowerCase())
          );

          if (!existsInList && rawRes.tableId && rawRes.tableNumber) {
            nextTables.push({
              id: rawRes.tableId,
              label: rawRes.tableNumber,
              seats: rawRes.tableCapacity ?? 4,
              area: mapZoneNameToArea(rawRes.zoneName),
              status: mappedRes.status === 'CONFIRMED' ? 'RESERVED' : 'OCCUPIED',
              guests: mappedRes.partySize,
              seatedMin: mappedRes.status === 'CHECKED_IN' ? 1 : 0,
              staff: 'Lễ tân / Thu ngân',
              depositAmount: mappedRes.depositAmount,
              discountAmount: 0,
              reservationId: mappedRes.id,
              items: [],
            });
            continue;
          }

          nextTables = nextTables.map((t) => {
            const isSameTable =
              (rawRes.tableId && t.id === rawRes.tableId) ||
              (rawRes.tableNumber &&
                t.label.trim().toLowerCase() === rawRes.tableNumber.trim().toLowerCase());
            if (!isSameTable) return t;

            const updatedTable: CashierTable = {
              ...t,
              id: rawRes.tableId ?? t.id,
              seats: rawRes.tableCapacity ?? t.seats,
              area: rawRes.zoneName ? mapZoneNameToArea(rawRes.zoneName) : t.area,
            };

            if (mappedRes.status === 'CONFIRMED') {
              return {
                ...updatedTable,
                status: 'RESERVED',
                guests: mappedRes.partySize,
                depositAmount: mappedRes.depositAmount,
                reservationId: mappedRes.id,
                staff: updatedTable.staff || 'Lễ tân / Thu ngân',
              };
            }
            if (mappedRes.status === 'CHECKED_IN' && rawRes.tableStatus === 'SERVING') {
              return {
                ...updatedTable,
                status: updatedTable.status === 'OVERDUE' ? 'OVERDUE' : 'OCCUPIED',
                guests: mappedRes.partySize,
                depositAmount: mappedRes.depositAmount,
                reservationId: mappedRes.id,
              };
            }
            return updatedTable;
          });
        }
      }

      const hasUuids = nextTables.some((t) => UUID_V4_REGEX.test(t.id));
      const partialError =
        tablesResult.status === 'rejected' && availableTablesResult.status === 'rejected'
          ? 'Chưa đồng bộ được danh sách bàn từ máy chủ.'
          : remoteReservationsResult.status === 'rejected'
          ? 'Chưa tải được danh sách đơn đặt bàn từ máy chủ.'
          : null;

      set({
        reservations: nextReservations,
        tables: nextTables,
        hasBackendTableUuids: hasUuids,
        syncError: partialError,
        isLoading: false,
        lastSyncedAt: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      set({
        isLoading: false,
        syncError: `Chưa đồng bộ được với máy chủ (${msg}).`,
        lastActionToast: `Chưa đồng bộ được với máy chủ: ${msg}`,
      });
    }
  },

  initializeWebSocket: () => {
    try {
      const client = getStompClient();

      client.onConnect = () => {
        set({ isConnected: true });
        // Luật thép Rule 03: Gọi REST API đồng bộ dữ liệu mới nhất khi kết nối / kết nối lại
        void get().syncWithBackend();

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
              return;
            }

            // Xử lý PosTableEvent từ ReservationServiceImpl (RESERVATION_CREATED, RESERVATION_UPDATED, RESERVATION_CHECKED_IN, RESERVATION_CANCELLED, RESERVATION_NO_SHOW)
            if (event.tableId || event.tableNumber) {
              set((state) => ({
                tables: state.tables.map((t) => {
                  const match =
                    (event.tableId && t.id === event.tableId) ||
                    (event.tableNumber &&
                      t.label.trim().toLowerCase() === String(event.tableNumber).trim().toLowerCase());
                  if (!match) return t;
                  const nextStatus = mapBackendTableStatus(event.tableStatus);
                  return {
                    ...t,
                    id: event.tableId ?? t.id,
                    status: nextStatus,
                    guests:
                      nextStatus === 'IDLE'
                        ? 0
                        : typeof event.guestCount === 'number'
                        ? event.guestCount
                        : t.guests,
                    depositAmount:
                      nextStatus === 'IDLE'
                        ? 0
                        : typeof event.depositAmount === 'number'
                        ? event.depositAmount
                        : t.depositAmount,
                    reservationId: nextStatus === 'IDLE' ? undefined : event.reservationId ?? t.reservationId,
                  };
                }),
                lastSyncedAt: Date.now(),
              }));
              void get().syncWithBackend();
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
    const idempotencyKey = input.idempotencyKey || generateIdempotencyKey();
    const { tables, reservations, shift } = get();
    const targetTable = tables.find((t) => t.id === input.tableId);
    const isUuidTable = UUID_V4_REGEX.test(input.tableId);

    if (!isUuidTable && !input.allowLocalOnly) {
      set({
        lastActionToast:
          'Chưa kết nối được máy chủ đặt bàn (chưa đồng bộ mã UUID của bàn) — chưa thể lưu đơn và chưa ghi tiền cọc.',
      });
      return null;
    }

    const depositInt = Math.max(0, Math.round(input.depositAmount));

    const now = new Date();
    const todayStr = formatShortDateVN(now);
    const resolvedDate =
      input.reservedDate === todayStr
        ? resolveReservationTargetDate(input.reservedTime, now).reservedDate
        : input.reservedDate;

    const tempId = generateIdempotencyKey();
    const newReservation: TableReservation = {
      id: tempId,
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

    const prevReservations = [...reservations];
    const prevTables = tables.map((t) => ({ ...t }));
    const prevShift: ShiftSettlementRecord = {
      ...shift,
      drawerOpenLogs: [...shift.drawerOpenLogs],
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
      lastActionToast: isUuidTable
        ? `Đang gửi yêu cầu đặt bàn ${newReservation.tableLabel} lên máy chủ...`
        : `Đã tạo đặt bàn ${newReservation.tableLabel} lúc ${newReservation.reservedTime} (${newReservation.reservedDate}) cho ${newReservation.customerName}${
            depositInt > 0 ? ` (Đã thu cọc ${depositInt.toLocaleString('vi-VN')} ₫)` : ''
          }.`,
    });

    if (isUuidTable) {
      const payload = {
        tableId: input.tableId,
        customerName: newReservation.customerName,
        customerPhone: newReservation.phone,
        guestCount: newReservation.partySize,
        reservationTime: buildReservationInstantIso(resolvedDate, newReservation.reservedTime),
        depositAmount: depositInt,
        depositMethod: depositInt > 0 ? newReservation.depositMethod : null,
        notes: newReservation.note ?? null,
      };

      fetchApi<BackendReservationResponse>('/reservations', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      })
        .then((created) => {
          const synced = mapBackendReservationToFrontend(created);
          set((state) => ({
            reservations: state.reservations.map((r) => (r.id === tempId ? synced : r)),
            tables: state.tables.map((t) =>
              t.id === input.tableId ? { ...t, reservationId: synced.id } : t
            ),
            lastActionToast: `Đã tạo đặt bàn ${synced.tableLabel} lúc ${synced.reservedTime} (${synced.reservedDate}) cho ${synced.customerName}${
              depositInt > 0 ? ` (Đã thu cọc ${depositInt.toLocaleString('vi-VN')} ₫)` : ''
            }.`,
          }));
        })
        .catch((err) => {
          const reason = err instanceof Error ? err.message : 'Lỗi máy chủ khi tạo đặt bàn';
          set({
            reservations: prevReservations,
            tables: prevTables,
            shift: prevShift,
            lastActionToast: `Không thể tạo đặt bàn ${newReservation.tableLabel}: ${reason} (Đã hoàn tác tiền cọc & trạng thái bàn).`,
          });
        });
    }

    return newReservation;
  },

  // UC2: Check-in Reserved Table
  checkInReservation: (reservationId, providedIdempotencyKey) => {
    const idempotencyKey = providedIdempotencyKey || generateIdempotencyKey();
    const { reservations, tables } = get();
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    const prevReservations = [...reservations];
    const prevTables = tables.map((t) => ({ ...t }));
    const isUuidReservation = UUID_V4_REGEX.test(reservationId);

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
              staff: t.staff || 'Lễ tân / Thu ngân',
              depositAmount: res.depositAmount,
            }
          : t
      ),
      selectedTableId: res.tableId,
      lastActionToast: isUuidReservation
        ? `Đang xác nhận Check-in ${res.tableLabel} với máy chủ...`
        : `Check-in thành công ${res.tableLabel} — Khách: ${res.customerName}. Tiền cọc đã gắn vào bill.`,
    });

    if (isUuidReservation) {
      fetchApi<BackendReservationResponse>(`/reservations/${reservationId}/check-in`, {
        method: 'POST',
        headers: { 'X-Idempotency-Key': idempotencyKey },
      })
        .then((checkedIn) => {
          const synced = mapBackendReservationToFrontend(checkedIn);
          set((state) => ({
            reservations: state.reservations.map((r) => (r.id === reservationId ? synced : r)),
            lastActionToast: `Check-in thành công ${res.tableLabel} — Khách: ${res.customerName}. Tiền cọc đã gắn vào bill.`,
          }));
        })
        .catch((err) => {
          const reason = err instanceof Error ? err.message : 'Lỗi máy chủ khi Check-in';
          set({
            reservations: prevReservations,
            tables: prevTables,
            lastActionToast: `Không thể Check-in ${res.tableLabel}: ${reason} (Đã hoàn tác trạng thái bàn).`,
          });
        });
    }
  },

  cancelReservation: (reservationId, providedIdempotencyKey) => {
    const idempotencyKey = providedIdempotencyKey || generateIdempotencyKey();
    const { reservations, tables } = get();
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    const prevReservations = [...reservations];
    const prevTables = tables.map((t) => ({ ...t }));
    const isUuidReservation = UUID_V4_REGEX.test(reservationId);

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
      lastActionToast: isUuidReservation
        ? `Đang gửi yêu cầu hủy đặt bàn ${res.tableLabel} lên máy chủ...`
        : `Đã hủy đặt bàn ${res.tableLabel} (${res.customerName}). Bàn đã mở trống trở lại.`,
    });

    if (isUuidReservation) {
      fetchApi<BackendReservationResponse>(`/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: { 'X-Idempotency-Key': idempotencyKey },
      })
        .then((cancelled) => {
          const synced = mapBackendReservationToFrontend(cancelled);
          set((state) => ({
            reservations: state.reservations.map((r) => (r.id === reservationId ? synced : r)),
            lastActionToast: `Đã hủy đặt bàn ${res.tableLabel} (${res.customerName}). Bàn đã mở trống trở lại.`,
          }));
        })
        .catch((err) => {
          const reason = err instanceof Error ? err.message : 'Lỗi máy chủ khi hủy đặt bàn';
          set({
            reservations: prevReservations,
            tables: prevTables,
            lastActionToast: `Không thể hủy đặt bàn ${res.tableLabel}: ${reason} (Đã khôi phục trạng thái đặt bàn).`,
          });
        });
    }
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

    if (UUID_V4_REGEX.test(tableId)) {
      fetchApi(`/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ status: 'BILLING' }),
      }).catch(() => {});
    }
  },

  unlockTableState: (tableId) => {
    const idempotencyKey = generateIdempotencyKey();
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

    if (UUID_V4_REGEX.test(tableId)) {
      fetchApi(`/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ status: 'SERVING' }),
      }).catch(() => {});
    }
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
    const idempotencyKey = generateIdempotencyKey();
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

    if (UUID_V4_REGEX.test(tableId)) {
      fetchApi(`/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ status: 'VACANT' }),
      }).catch(() => {});
    }
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

