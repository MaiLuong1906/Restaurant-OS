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

export type OrderItemStatus = 'WAITING' | 'READY' | 'SERVED' | 'REJECTED';

export interface OrderItem {
  id: string;
  orderId: string;
  tableId?: string;
  tableNo?: string; // Số bàn hiển thị nổi bật trên thẻ KDS
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number; // VND integer
  modifiers: {
    name: string;
    selected: string;
    extraPrice: number;
  }[];
  notes?: string; // Ghi chú nấu nướng (ít ngọt, không cay...)
  allergy?: string; // Cảnh báo dị ứng thực phẩm
  slaDeadline?: string; // Mốc thời gian trễ SLA (ISO string)
  stationId?: string; // Trạm bếp phụ trách
  status: OrderItemStatus;
  createdAt: string;
}

export interface Ticket {
  id: string;
  orderId?: string;
  tableId: string;
  tableNo: string;
  items: OrderItem[];
  status?: OrderItemStatus;
  slaDeadline?: string; // Earliest slaDeadline của các items
  createdAt: string;
  customerNotes?: string;
}

export interface Batch {
  id: string;
  dishId: string;
  dishName: string;
  totalQuantity: number;
  notes?: string;
  allergy?: string;
  status: OrderItemStatus;
  slaDeadline?: string; // Earliest slaDeadline của các items trong mẻ
  itemIds: string[];
  items: OrderItem[];
}

// --------------------------------------------------------------------
// DTOs & Models cho Staff Portal & KDS Authentication
// --------------------------------------------------------------------

export type StaffRole = 'MANAGER' | 'CHEF' | 'STAFF' | 'CASHIER';

export interface StaffUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: StaffRole;
  avatarUrl?: string;
  isActive: boolean;
}

export interface LoginRequest {
  phoneNumber: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: StaffUser;
  expiresIn?: number;
}

export interface KdsPinAuthRequest {
  pin: string;
  tabletId?: string;
}

export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'SWAPPED';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  zone?: string;
  status: ShiftStatus;
}

export type AttendanceMethod = 'FACE_SCAN' | 'PIN';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  shiftId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  method: AttendanceMethod;
  isLate: boolean;
  lateMinutes: number;
  note?: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
  calendarDays?: number;
  affectedShifts?: number;
  idempotencyKey?: string;
}

export interface CreateLeaveRequest {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  idempotencyKey: string;
}

export interface WithdrawLeaveRequest {
  id: string;
}

export interface LeaveBalance {
  staffId: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingRequestsCount: number;
}

export type PayslipStatus = 'PROVISIONAL' | 'FINAL';
export type PayslipPaymentStatus = 'EXPECTED' | 'PAID';
export type TipPaymentStatus = 'UNPAID' | 'PAID';

export interface Payslip {
  id: string;
  staffId: string;
  staffName: string;
  month: string; // YYYY-MM
  monthLabel?: string;
  status?: PayslipStatus;
  paymentStatus?: PayslipPaymentStatus;
  periodLabel?: string;
  paymentDateLabel?: string;
  paymentNote?: string;
  baseSalary: number; // VND integer
  workedHours: number;
  hourlyRate: number; // VND integer
  allowance: number; // VND integer
  bonus: number; // VND integer
  tipAmount: number; // VND integer
  deductions: number; // VND integer
  bhxhAmount?: number;
  advanceAmount?: number;
  netSalary: number; // VND integer (thực lĩnh)
  paidAt?: string;
}

export interface TipDailyEntry {
  date: string;
  dateLabel: string;
  shiftLabel: string;
  amount: number;
}

export interface TipRecord {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  shiftId?: string;
  poolAmount: number; // VND integer
  allocatedAmount: number; // VND integer
  note?: string;
}

export interface TipMonthSummary {
  monthKey: string;
  monthLabel: string;
  totalAmount: number;
  paymentStatus: TipPaymentStatus;
  paymentNote?: string;
  dailyEntries?: TipDailyEntry[];
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

export type OrderChangeVariant = 'CANCEL_ITEM' | 'EDIT_NOTE';

export interface OrderChangeAlertData {
  id: string;
  ticketId: string;
  itemId: string;
  dishName: string;
  tableNo: string;
  quantity: number;
  variant: OrderChangeVariant;
  reason?: string;
  previousNote?: string;
  newNote?: string;
  acknowledged: boolean;
  createdAt?: string;
}

export type DishAvailabilityStatus = 'AVAILABLE' | 'SOLD_OUT';

export interface WaitingTableRef {
  tableName: string;
  ticketId: string;
  quantity: number;
}

export interface DishAvailability {
  dishId: string;
  dishName: string;
  status: DishAvailabilityStatus;
  remainingPortions: number;
  lastStock?: number;
  waitingTables: WaitingTableRef[];
  soldOutAt?: string;
  markedBy?: string;
}

export type WasteReason =
  | 'Nấu hỏng'
  | 'Nguyên liệu hết hạn'
  | 'Rơi vỡ'
  | 'Khách trả lại'
  | 'Lý do khác';

export interface WasteDishOption {
  dishId: string;
  dishName: string;
  stockQuantity: number;
}

export interface WasteTodayStats {
  logCount: number;
  portionCount: number;
}

export interface WasteLogEntry {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  reason: WasteReason;
  note?: string;
  recordedById: string;
  recordedByName: string;
  recordedByRole: string;
  recordedAt: string;
  idempotencyKey: string;
}

export interface CreateWasteLogRequest {
  dishId: string;
  quantity: number;
  reason: WasteReason;
  note?: string;
  recordedById?: string;
  recordedByName?: string;
  recordedByRole?: string;
  idempotencyKey: string;
}

export type AttendanceCheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';
export type AttendanceResultKind = 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'NETWORK_ERROR';

export interface TodayAttendance {
  shiftName: string;
  shiftHours: string;
  zone: string;
  date: string;
  status: AttendanceCheckInStatus;
  checkedInAt: string | null;
  punctuality?: string;
  method?: AttendanceMethod;
}

export interface CheckInRequest {
  method: AttendanceMethod;
  idempotencyKey: string;
}

export interface CheckInResponse {
  kind: AttendanceResultKind;
  checkedInAt?: string;
  method?: AttendanceMethod;
  message?: string;
}

// B6-B8 Types
export interface OpenShift {
  id: string;
  dateKey: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  role: StaffRole;
  title: string;
  zone: string;
  slotsTotal: number;
  slotsTaken: number;
  postedById: string;
  postedAt: string;
  note?: string;
}

export type ShiftRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ShiftRegistration {
  id: string;
  staffId: string;
  openShiftId: string;
  dateKey: string;
  status: ShiftRegistrationStatus;
  createdAt: string;
  idempotencyKey: string;
  note?: string;
}

export interface RegisterShiftRequest {
  openShiftId: string;
  dateKey: string;
  note?: string;
  idempotencyKey: string;
}

export interface CancelRegistrationRequest {
  registrationId: string;
}

export type ShiftSwapStatus =
  | 'PENDING_PEER'
  | 'PENDING_MANAGER'
  | 'APPROVED'
  | 'REJECTED'
  | 'PEER_DECLINED';

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  requesterShiftId: string;
  peerId: string;
  peerShiftId?: string;
  dateKey: string;
  reason?: string;
  status: ShiftSwapStatus;
  createdAt: string;
  peerConfirmedAt?: string;
  idempotencyKey: string;
  rejectionReason?: string;
  processedBy?: string;
}

export interface CreateShiftSwapRequest {
  requesterShiftId: string;
  peerId: string;
  peerShiftId?: string;
  reason?: string;
  idempotencyKey: string;
}

export interface ScheduleSummary {
  shiftsThisWeek: number;
  hoursThisWeek: number;
  pendingRegistrations: number;
  pendingSwaps: number;
  openShiftsThisWeek: number;
}

export interface DaySchedule {
  dateKey: string; // YYYY-MM-DD
  weekdayLabel: string; // T2, T3, ... CN
  fullDateLabel: string; // Thứ 2, 05/11
  dayNumber: number;
  myShifts: Shift[];
  openShifts: OpenShift[];
  registrations: ShiftRegistration[];
  swaps: ShiftSwapRequest[];
}

export interface WeekSchedule {
  weekStartKey: string; // Monday YYYY-MM-DD
  weekEndKey: string; // Sunday YYYY-MM-DD
  weekLabel: string; // Tuần 05/11 – 11/11/2026
  days: DaySchedule[];
}

export interface SwapPeerCandidate {
  staffId: string;
  staffName: string;
  role: StaffRole;
  shiftTitle: string;
  shiftTime: string;
  shiftDate: string;
  zone: string;
}

export interface RecentAttendanceEntry {
  id: string;
  dateLabel: string;
  time: string;
  methodLabel: string; // 'Quét mặt' | 'Mã PIN'
  statusLabel: string; // 'Đúng giờ' | 'Đi muộn'
  isLate: boolean;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}


