'use client';

import * as React from 'react';
import {
  Split,
  Plus,
  Clock,
  Printer,
  Receipt,
  X,
  CalendarDays,
  CreditCard,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface OrderItem {
  name: string;
  desc: string;
  price: number;
}

interface TableData {
  id: string;
  name: string;
  capacity: string;
  status: 'Trống' | 'Đang dùng' | 'Chờ thanh toán' | 'Quá 90p' | 'Đang dọn';
  duration: number; // in minutes
  waiter: string;
  zone: 'floor1' | 'floor2' | 'terrace';
  orders: OrderItem[];
}

const INITIAL_TABLES: Record<string, TableData> = {
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

export default function AdminTablesPage() {
  const [tables, setTables] = React.useState<Record<string, TableData>>(INITIAL_TABLES);
  const [activeZone, setActiveZone] = React.useState<'floor1' | 'floor2' | 'terrace' | 'all'>('floor1');
  const [statusFilter, setStatusFilter] = React.useState<string | 'all'>('all');
  const [selectedTableId, setSelectedTableId] = React.useState<string | null>(null);

  // Merge / Split Modal
  const [mergeModalOpen, setMergeModalOpen] = React.useState(false);
  const [mergeSource, setMergeSource] = React.useState('A01');
  const [mergeTarget, setMergeTarget] = React.useState('A03');

  // Reservation Modal
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [newBooking, setNewBooking] = React.useState({
    guestName: '',
    phone: '',
    guestsCount: '4',
    tableId: 'A01',
    time: '19:30',
    notes: 'Kỷ niệm ngày cưới',
  });

  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Modal a11y: Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTableId(null);
        setMergeModalOpen(false);
        setBookingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const selectedTable = selectedTableId ? tables[selectedTableId] : null;

  const calculateSubtotal = (orders: OrderItem[]) => orders.reduce((sum, o) => sum + o.price, 0);

  // Status Change Action
  const handleUpdateStatus = (tableId: string, newStatus: TableData['status']) => {
    setTables((prev) => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        status: newStatus,
        duration: newStatus === 'Trống' ? 0 : prev[tableId].duration || 1,
        orders: newStatus === 'Trống' ? [] : prev[tableId].orders,
      },
    }));
    showToast(`Đã chuyển trạng thái Bàn ${tableId} thành [${newStatus}]`);
  };

  // Merge Action
  const handleConfirmMerge = () => {
    if (mergeSource === mergeTarget) {
      showToast('Bàn nguồn và bàn đích không được trùng nhau');
      return;
    }
    const sourceTable = tables[mergeSource];
    const targetTable = tables[mergeTarget];

    if (!sourceTable || !targetTable) return;

    setTables((prev) => ({
      ...prev,
      [mergeTarget]: {
        ...targetTable,
        status: 'Đang dùng',
        orders: [...targetTable.orders, ...sourceTable.orders],
      },
      [mergeSource]: {
        ...sourceTable,
        status: 'Trống',
        orders: [],
        duration: 0,
      },
    }));

    showToast(`Đã gộp Bàn ${mergeSource} vào Bàn ${mergeTarget} thành công!`);
    setMergeModalOpen(false);
  };

  // Booking Submit
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.guestName) {
      showToast('Vui lòng nhập tên khách hàng');
      return;
    }
    setTables((prev) => ({
      ...prev,
      [newBooking.tableId]: {
        ...prev[newBooking.tableId],
        status: 'Đang dùng',
        waiter: 'Đã gán khách đặt',
        duration: 1,
      },
    }));
    showToast(`Đã tiếp nhận đặt bàn cho khách ${newBooking.guestName} tại Bàn ${newBooking.tableId}!`);
    setBookingModalOpen(false);
    setNewBooking({
      guestName: '',
      phone: '',
      guestsCount: '4',
      tableId: 'A01',
      time: '19:30',
      notes: '',
    });
  };

  // Filter tables
  const displayedTables = Object.values(tables).filter((t) => {
    const matchZone = activeZone === 'all' || t.zone === activeZone;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchZone && matchStatus;
  });

  const getStatusBorder = (status: TableData['status']) => {
    switch (status) {
      case 'Trống':
        return 'border-l-4 border-l-emerald-600';
      case 'Đang dùng':
        return 'border-l-4 border-l-amber-500';
      case 'Chờ thanh toán':
        return 'border-l-4 border-l-primary-500';
      case 'Quá 90p':
        return 'border-l-4 border-l-rose-600 bg-rose-50/20';
      case 'Đang dọn':
        return 'border-l-4 border-l-stone-400 bg-stone-50';
    }
  };

  const getStatusDot = (status: TableData['status']) => {
    switch (status) {
      case 'Trống':
        return 'bg-emerald-600';
      case 'Đang dùng':
        return 'bg-amber-500';
      case 'Chờ thanh toán':
        return 'bg-primary-500';
      case 'Quá 90p':
        return 'bg-rose-600 animate-pulse';
      case 'Đang dọn':
        return 'bg-stone-400';
    }
  };

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ops-ink text-white px-4 py-2.5 rounded-lg shadow-lg border border-ops-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1720px] mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Sơ Đồ Bàn Ăn & Điều Phối
            </h1>
            <p className="text-sm font-medium text-stone-600">
              Quản lý trạng thái bàn ăn, thời gian dùng bữa, gọi món và tiếp nhận khách đặt chỗ
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setMergeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 text-xs font-mono uppercase tracking-wider rounded-lg shadow-2xs cursor-pointer font-bold transition-colors"
            >
              <Split className="h-4 w-4 text-ops-brand" />
              <span>Tách / Gộp Bàn</span>
            </button>
            <button
              onClick={() => setBookingModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase tracking-wider rounded-lg shadow-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tiếp Nhận Đặt Bàn</span>
            </button>
          </div>
        </div>

        {/* Zone Tabs & Status Quick Filters */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Zone Tabs */}
          <div className="xl:col-span-6 flex items-center gap-1.5 p-1 bg-white rounded-xl border border-stone-200 shadow-2xs flex-wrap">
            <button
              onClick={() => setActiveZone('floor1')}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeZone === 'floor1'
                  ? 'bg-stone-100 text-stone-900 border border-stone-300 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Tầng 1 (Sảnh Chính)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white font-mono font-bold text-stone-700 border border-stone-200">
                {Object.values(tables).filter((t) => t.zone === 'floor1').length} Bàn
              </span>
            </button>
            <button
              onClick={() => setActiveZone('floor2')}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeZone === 'floor2'
                  ? 'bg-stone-100 text-stone-900 border border-stone-300 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Tầng 2 (VIP)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white font-mono font-bold text-stone-700 border border-stone-200">
                {Object.values(tables).filter((t) => t.zone === 'floor2').length} Bàn
              </span>
            </button>
            <button
              onClick={() => setActiveZone('terrace')}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeZone === 'terrace'
                  ? 'bg-stone-100 text-stone-900 border border-stone-300 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Sân Vườn (Terrace)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white font-mono font-bold text-stone-700 border border-stone-200">
                {Object.values(tables).filter((t) => t.zone === 'terrace').length} Bàn
              </span>
            </button>
          </div>

          {/* Quick Status Filters */}
          <div className="xl:col-span-6 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <button
              onClick={() => setStatusFilter(statusFilter === 'Trống' ? 'all' : 'Trống')}
              className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                statusFilter === 'Trống' ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-stone-700 font-mono text-xs uppercase font-bold tracking-wider">Trống</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-mono text-sm font-extrabold text-stone-900">
                  {Object.values(tables).filter((t) => t.status === 'Trống').length} Bàn
                </span>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'Đang dùng' ? 'all' : 'Đang dùng')}
              className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                statusFilter === 'Đang dùng' ? 'bg-amber-50 border-amber-400' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-stone-700 font-mono text-xs uppercase font-bold tracking-wider">Đang dùng</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-mono text-sm font-extrabold text-amber-700">
                  {Object.values(tables).filter((t) => t.status === 'Đang dùng').length} Bàn
                </span>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'Chờ thanh toán' ? 'all' : 'Chờ thanh toán')}
              className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                statusFilter === 'Chờ thanh toán' ? 'bg-rose-50 border-rose-400' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-stone-700 font-mono text-xs uppercase font-bold tracking-wider">Chờ TT</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ops-brand" />
                <span className="font-mono text-sm font-extrabold text-ops-brand">
                  {Object.values(tables).filter((t) => t.status === 'Chờ thanh toán').length} Bàn
                </span>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'Quá 90p' ? 'all' : 'Quá 90p')}
              className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                statusFilter === 'Quá 90p' ? 'bg-rose-100 border-rose-500' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-stone-700 font-mono text-xs uppercase font-bold tracking-wider">Quá 90p</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span className="font-mono text-sm font-extrabold text-rose-800">
                  {Object.values(tables).filter((t) => t.status === 'Quá 90p').length} Bàn
                </span>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'Đang dọn' ? 'all' : 'Đang dọn')}
              className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                statusFilter === 'Đang dọn' ? 'bg-stone-200 border-stone-400' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-stone-700 font-mono text-xs uppercase font-bold tracking-wider">Đang dọn</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-500" />
                <span className="font-mono text-sm font-extrabold text-stone-900">
                  {Object.values(tables).filter((t) => t.status === 'Đang dọn').length} Bàn
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedTables.map((t) => {
            const subtotal = calculateSubtotal(t.orders);
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`bg-white rounded-xl border border-stone-200 p-4 flex flex-col justify-between h-[165px] shadow-2xs hover:shadow-md transition-all cursor-pointer group ${getStatusBorder(
                  t.status
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-ops text-stone-900 text-base font-bold">{t.name}</h2>
                    <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold border border-stone-200">
                      {t.capacity}
                    </span>
                  </div>
                  {t.duration > 0 && (
                    <span
                      className={`font-mono text-xs font-bold flex items-center gap-1 ${
                        t.duration >= 90 ? 'text-rose-700' : 'text-stone-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {t.duration} phút
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between my-auto">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot(t.status)}`} />
                    <span className="text-xs font-bold text-stone-900">{t.status}</span>
                  </div>
                  <span className="font-mono text-base font-extrabold text-stone-900">
                    {subtotal > 0 ? formatVND(subtotal) : '0 ₫'}
                  </span>
                </div>

                <div className="w-full py-1.5 px-3 bg-stone-50 group-hover:bg-stone-200 border border-stone-200 text-stone-800 font-mono text-xs uppercase tracking-wider rounded-lg transition-colors font-bold flex items-center justify-center gap-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết Món</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-out Table Detail Drawer */}
      {selectedTable && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Chi Tiết ${selectedTable.name}`}
          className="fixed inset-0 z-50 overflow-hidden flex justify-end"
        >
          <div
            role="presentation"
            onClick={() => setSelectedTableId(null)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-ops-border flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-ops-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-ops text-xl font-bold text-ops-ink">{selectedTable.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-ops-bg text-ops-muted font-semibold">
                    {selectedTable.capacity}
                  </span>
                </div>
                <span className="text-xs text-ops-muted">Nhân viên phụ trách: {selectedTable.waiter}</span>
              </div>
              <button
                onClick={() => setSelectedTableId(null)}
                aria-label="Đóng chi tiết bàn"
                className="w-8 h-8 rounded-lg hover:bg-ops-bg text-ops-muted hover:text-ops-ink flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Quick Status Changer */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-ops-muted block">
                  Đổi Trạng Thái Bàn Nhanh:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Trống', 'Đang dùng', 'Chờ thanh toán', 'Quá 90p', 'Đang dọn'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedTable.id, st)}
                      className={`py-1.5 px-2 rounded font-mono text-[10px] font-semibold border cursor-pointer ${
                        selectedTable.status === st
                          ? 'bg-ops-brand text-white border-ops-brand'
                          : 'bg-ops-bg border-ops-border text-ops-ink hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-2 pt-2 border-t border-ops-border">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-ops-muted">
                    Danh Sách Món Gọi ({selectedTable.orders.length})
                  </span>
                  {selectedTable.duration > 0 && (
                    <span className="font-mono text-[11px] text-ops-muted">
                      Thời gian: {selectedTable.duration} phút
                    </span>
                  )}
                </div>

                {selectedTable.orders.length === 0 ? (
                  <div className="p-6 text-center text-ops-muted bg-ops-bg rounded-lg border border-ops-border">
                    Bàn hiện đang trống, chưa có món nào được gọi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTable.orders.map((ord, idx) => (
                      <div
                        key={`${selectedTable.id}-${ord.name}-${idx}`}
                        className="p-3 rounded-lg bg-ops-bg border border-ops-border flex items-start justify-between"
                      >
                        <div>
                          <strong className="text-ops-ink block">{ord.name}</strong>
                          <span className="text-[11px] text-ops-muted">{ord.desc}</span>
                        </div>
                        <span className="font-mono font-bold text-ops-ink">{formatVND(ord.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Totals */}
              {selectedTable.orders.length > 0 && (
                <div className="p-3.5 bg-ops-bg rounded-lg space-y-1.5 font-mono pt-3 border border-ops-border">
                  <div className="flex justify-between text-ops-muted">
                    <span>Tiền hàng:</span>
                    <span>{formatVND(calculateSubtotal(selectedTable.orders))}</span>
                  </div>
                  <div className="flex justify-between text-ops-muted">
                    <span>Thuế VAT (8%):</span>
                    <span>{formatVND(Math.round(calculateSubtotal(selectedTable.orders) * 0.08))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-ops-ink pt-2 border-t border-ops-border">
                    <span>Tổng hóa đơn:</span>
                    <span className="text-ops-brand">
                      {formatVND(Math.round(calculateSubtotal(selectedTable.orders) * 1.08))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-ops-border bg-white flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    showToast(`Đã gửi lệnh in tạm tính Bàn ${selectedTable.name} ra máy in quầy thu ngân`);
                  }}
                  className="py-2.5 px-3 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink text-xs font-mono uppercase rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-ops-muted" />
                  <span>In Tạm Tính</span>
                </button>
                <button
                  onClick={() => {
                    setMergeSource(selectedTable.id);
                    setMergeModalOpen(true);
                  }}
                  className="py-2.5 px-3 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink text-xs font-mono uppercase rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Split className="w-4 h-4 text-ops-brand" />
                  <span>Chuyển / Gộp</span>
                </button>
              </div>

              {selectedTable.orders.length > 0 && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedTable.id, 'Trống');
                    showToast(`Đã thanh toán và giải phóng Bàn ${selectedTable.name} về trạng thái Trống!`);
                    setSelectedTableId(null);
                  }}
                  className="w-full py-2.5 px-4 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded-lg font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Thanh Toán &amp; Trả Bàn</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tách / Gộp Bàn */}
      {mergeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Điều Phối / Gộp Bàn Ăn"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Split className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Điều Phối / Gộp Bàn Ăn</h3>
              </div>
              <button
                onClick={() => setMergeModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ops-muted">
              Chuyển toàn bộ các món đã gọi từ bàn nguồn sang bàn đích và cập nhật trạng thái trên POS:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Bàn Nguồn (Cần Chuyển)
                </label>
                <select
                  value={mergeSource}
                  onChange={(e) => setMergeSource(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                >
                  {Object.keys(tables).map((id) => (
                    <option key={id} value={id}>
                      {tables[id].name} ({tables[id].status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Bàn Đích (Nhận Món)
                </label>
                <select
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                >
                  {Object.keys(tables).map((id) => (
                    <option key={id} value={id}>
                      {tables[id].name} ({tables[id].status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
              <button
                type="button"
                onClick={() => setMergeModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
              >
                Xác Nhận Gộp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tiếp Nhận Đặt Bàn Mới */}
      {bookingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tiếp Nhận Đặt Chỗ Mới"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Tiếp Nhận Đặt Chỗ Mới</h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Tên Khách Hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh Hoàng Tuấn"
                  value={newBooking.guestName}
                  onChange={(e) => setNewBooking({ ...newBooking, guestName: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Số Lượng Khách
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newBooking.guestsCount}
                    onChange={(e) => setNewBooking({ ...newBooking, guestsCount: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Gán Bàn Phục Vụ
                  </label>
                  <select
                    value={newBooking.tableId}
                    onChange={(e) => setNewBooking({ ...newBooking, tableId: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                  >
                    {Object.keys(tables).map((id) => (
                      <option key={id} value={id}>
                        {tables[id].name} ({tables[id].capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Thời Gian Đến
                  </label>
                  <input
                    type="time"
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Ghi Chú Đặc Biệt (Dị ứng, Trang trí)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kỷ niệm ngày cưới, xếp bàn cạnh cửa sổ"
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Lưu Đặt Bàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
