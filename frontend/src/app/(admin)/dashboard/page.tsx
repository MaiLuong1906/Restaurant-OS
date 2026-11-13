'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldAlert,
  Receipt,
  X,
  Lock,
  Search,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { AdminToast, useAdminToast, KpiCard } from '@/components/admin';

interface DashboardAction {
  id: string;
  type: string;
  title: string;
  badgeClass: string;
  time: string;
  dish: string;
  desc: string;
  price?: number;
  approved?: boolean;
  link?: string;
  linkText?: string;
}

interface RecentOrder {
  id: string;
  time: string;
  table: string;
  items: string;
  method: string;
  total: number;
  subtotal: number;
  vat: number;
  waiter: string;
  status: string;
  statusClass: string;
}

export default function AdminDashboardPage() {
  const MANAGER_PIN = '1234'; // PIN demo
  const [period, setPeriod] = React.useState<'live' | 'week' | 'month'>('live');
  const { toastMsg, showToast } = useAdminToast();

  // Modal State for Pin Approval
  const [pinModalOpen, setPinModalOpen] = React.useState(false);
  const [pinDigits, setPinDigits] = React.useState(['', '', '', '']);
  const [actionToApprove, setActionToApprove] = React.useState<string | null>(null);
  const pinInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Selected Order for Detail Modal (Strictly Typed)
  const [selectedOrder, setSelectedOrder] = React.useState<RecentOrder | null>(null);

  // Filter Search
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modal a11y: Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinModalOpen(false);
        setSelectedOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus first PIN input when PIN modal opens
  React.useEffect(() => {
    if (pinModalOpen) {
      setTimeout(() => pinInputRefs.current[0]?.focus(), 50);
    }
  }, [pinModalOpen]);

  // Urgent Actions State
  const [actions, setActions] = React.useState<DashboardAction[]>([
    {
      id: 'ACT-01',
      type: 'void',
      title: '[HỦY MÓN] Bàn 04',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      time: '2p trước',
      dish: '01x Bò Lúc Lắc Wagyu A4 & Nấm Truffle',
      desc: 'Khách đổi ý sau khi order 12 phút. Cần xác thực PIN trừ BOM.',
      price: 480000,
      approved: false,
    },
    {
      id: 'ACT-02',
      type: 'sla',
      title: '[SLA BẾP TRỄ] Bàn 12',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      time: '17:20s (MAX 15:00)',
      dish: '02x Tandoori King Prawns & Saffron Pilau',
      desc: 'Lò nướng Tandoor #02 đang quá tải xào nướng.',
      link: '/tables',
      linkText: 'Kiểm Tra Bàn',
    },
    {
      id: 'ACT-03',
      type: 'swap',
      title: '[ĐỔI CA] Mai Thị Hoa',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      time: '15p trước',
      dish: 'Ca Tối Thứ 7 (08/11)',
      desc: 'Xin đổi ca trực với Nguyễn Văn Nam do lịch thi đại học.',
      link: '/roster',
      linkText: 'Phê Duyệt Ca',
    },
  ]);

  // Dynamic Metrics based on period
  const METRICS = {
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
  }[period];

  const HOURLY_DATA = [
    { hour: '10H', amount: '1.2M', height: 14, isPeak: false },
    { hour: '11H', amount: '2.8M', height: 26, isPeak: false },
    { hour: '12H', amount: '7.4M', height: 78, isPeak: true, label: 'ĐỈNH TRƯA' },
    { hour: '13H', amount: '5.1M', height: 52, isPeak: false },
    { hour: '14H', amount: '1.8M', height: 18, isPeak: false },
    { hour: '15H', amount: '0.9M', height: 10, isPeak: false },
    { hour: '16H', amount: '1.4M', height: 15, isPeak: false },
    { hour: '17H', amount: '3.6M', height: 38, isPeak: false },
    { hour: '18H', amount: '6.2M', height: 65, isPeak: false },
    { hour: '19H', amount: '9.8M', height: 96, isPeak: true, label: 'ĐỈNH TỐI' },
    { hour: '20H', amount: '6.5M', height: 68, isPeak: false },
    { hour: '21H', amount: '2.1M', height: 22, isPeak: false },
  ];

  const [recentOrders, setRecentOrders] = React.useState([
    {
      id: '#ORD-9024',
      time: '19:42:15',
      table: 'Bàn VIP-02',
      items: 'Royal Lamb Biryani x2, Château Margaux 2015 x1',
      method: 'VIETQR DYNAMIC',
      total: 3450000,
      subtotal: 3194444,
      vat: 255556,
      waiter: 'Nguyễn Văn Nam',
      status: 'ĐÃ THANH TOÁN',
      statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: '#ORD-9023',
      time: '19:38:02',
      table: 'Bàn A-03',
      items: 'Tandoori King Prawns x4, Black Lentil Dal Makhani x2',
      method: 'TIỀN MẶT POS',
      total: 2180000,
      subtotal: 2018519,
      vat: 161481,
      waiter: 'Mai Thị Hoa',
      status: 'CHỜ THANH TOÁN',
      statusClass: 'bg-amber-50 text-amber-800 border-amber-300',
    },
    {
      id: '#ORD-9022',
      time: '19:31:40',
      table: 'Bàn A-01',
      items: 'Butter Chicken Masala x2, Garlic Naan x4',
      method: 'VIETQR DYNAMIC',
      total: 1250000,
      subtotal: 1157407,
      vat: 92593,
      waiter: 'Lê Văn An',
      status: 'ĐÃ THANH TOÁN',
      statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: '#ORD-9021',
      time: '19:15:10',
      table: 'Bàn B-02',
      items: 'Lobster Thermidor x1, Mango Lassi x2',
      method: 'THẺ TÍN DỤNG',
      total: 1980000,
      subtotal: 1833333,
      vat: 146667,
      waiter: 'Mai Thị Hoa',
      status: 'ĐÃ THANH TOÁN',
      statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ]);

  const handleOpenPin = (actionId: string) => {
    setActionToApprove(actionId);
    setPinDigits(['', '', '', '']);
    setPinModalOpen(true);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinDigits.join('');
    if (pin.length < 4) {
      showToast('Vui lòng nhập đủ 4 chữ số PIN Quản lý');
      return;
    }
    if (pin !== MANAGER_PIN) {
      showToast('PIN không đúng');
      return;
    }
    setActions((prev) =>
      prev.map((act) => (act.id === actionToApprove ? { ...act, approved: true } : act))
    );
    setPinModalOpen(false);
    showToast('Xác thực PIN thành công: Đã duyệt hủy món và hoàn nguyên định lượng kho BOM!');
  };

  const filteredOrders = recentOrders.filter(
    (ord) =>
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Toast Alert Dùng Chung */}
      <AdminToast message={toastMsg} />

      {/* Top Command Status Strip */}
      <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 sm:gap-3">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl text-stone-900 font-bold tracking-tight">
              Tổng Quan Điều Hành
            </h1>
            <span className="font-mono text-xs font-bold text-stone-700 tracking-wider bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md sm:ml-2">
              CA TỐI #02 • 17:00 - 23:30
            </span>
          </div>
          <p className="text-sm font-medium text-stone-600">
            Theo dõi dòng tiền, tải phòng ăn, hiệu suất bếp và các ngoại lệ cần phê duyệt thời gian thực
          </p>
        </div>

        {/* Sleek Period Tab Switcher (Realtime / Week / Month) */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          <div className="inline-flex items-center bg-white border border-stone-200 rounded-lg p-1 shadow-2xs">
            <button
              onClick={() => {
                setPeriod('live');
                showToast('Chế độ: Thời gian thực ca hiện tại');
              }}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded-md font-bold transition-all cursor-pointer ${
                period === 'live' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Thời gian thực
            </button>
            <button
              onClick={() => {
                setPeriod('week');
                showToast('Chế độ: Tổng hợp 7 ngày gần nhất');
              }}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded-md font-bold transition-all cursor-pointer ${
                period === 'week' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => {
                setPeriod('month');
                showToast('Chế độ: Tổng hợp tháng 11/2024');
              }}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded-md font-bold transition-all cursor-pointer ${
                period === 'month' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Tháng
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Metric KPI Blocks (Dùng KpiCard Component) */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh thu */}
        <KpiCard
          title="DOANH THU TÍCH LŨY"
          value={formatVND(METRICS.rev)}
          badge={{ text: METRICS.revGrowth, variant: 'success' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>{METRICS.target}</span>
              <span className="font-mono font-bold text-emerald-700">{METRICS.targetPct}</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-ops-brand"
        />

        {/* KPI 2: Tải phòng ăn */}
        <KpiCard
          title="TẢI PHÒNG ĂN"
          value={METRICS.occ}
          badge={{ text: '4 BÀN > 90 PHÚT', variant: 'danger' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>{METRICS.occDesc}</span>
              <span className="font-mono font-bold text-amber-700">{METRICS.occPct}</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-amber-500"
        />

        {/* KPI 3: Tốc độ bếp KDS */}
        <KpiCard
          title="TỐC ĐỘ BẾP KDS"
          value={
            <>
              {METRICS.kdsTime} <span className="text-sm text-stone-500 font-normal">/ 15:00 MAX</span>
            </>
          }
          badge={{ text: '94% ĐÚNG SLA', variant: 'success' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>Vé đang ra: 14 vé</span>
              <span className="font-mono font-bold text-emerald-700">TIẾN ĐỘ TỐT</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-600"
        />

        {/* KPI 4: Food Cost */}
        <KpiCard
          title="TỶ LỆ FOOD COST"
          value={
            <>
              {METRICS.cogs} <span className="text-sm text-emerald-700 font-bold ml-1">{METRICS.cogsDiff}</span>
            </>
          }
          badge={{ text: 'MỤC TIÊU < 33.0%', variant: 'success' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>Định lượng BOM</span>
              <span className="font-mono font-bold text-emerald-700">CHUẨN ĐỊNH MỨC</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-ops-brand"
        />
      </div>

      {/* Main Operational Area: Hourly Chart (Left 8 cols) & Action Feed (Right 4 cols) */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 12-hour revenue chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-ops-brand rounded-xs" />
                <h2 className="font-ops text-base sm:text-lg text-stone-900 font-bold tracking-tight">
                  Phân Bổ Doanh Thu Theo Giờ
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-ops-brand rounded-xs" />
                  <span className="text-stone-900 font-bold">Đỉnh tải / Thực thu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-stone-200 border border-stone-300 rounded-xs" />
                  <span className="text-stone-600 font-semibold">Giờ thường</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="w-full pt-7 pb-3 overflow-x-auto">
              <div className="h-60 flex items-end justify-between gap-2 sm:gap-2.5 px-2 border-b border-stone-200 min-w-[520px]">
                {HOURLY_DATA.map((item) => (
                  <div
                    key={item.hour}
                    onClick={() => showToast(`Doanh thu khung ${item.hour}: ${item.amount}`)}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                  >
                    {item.isPeak && (
                      <span className="absolute -top-6 font-mono text-[10px] text-ops-brand uppercase tracking-tight font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap shadow-2xs">
                        {item.label}
                      </span>
                    )}
                    <span
                      className={`font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold ${
                        item.isPeak ? 'text-ops-brand' : 'text-stone-700'
                      }`}
                    >
                      {item.amount}
                    </span>
                    <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                      <div
                        style={{ height: `${item.height}%` }}
                        className={`w-full rounded-t-xs transition-all ${
                          item.isPeak
                            ? 'bg-ops-brand group-hover:bg-ops-brand-dark shadow-xs'
                            : 'bg-stone-300 group-hover:bg-stone-400'
                        }`}
                      />
                    </div>
                    <span
                      className={`font-mono text-xs font-bold mt-1.5 ${
                        item.isPeak ? 'text-ops-brand' : 'text-stone-700'
                      }`}
                    >
                      {item.hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metric Footer Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 pt-2 sm:pt-4 mt-2 bg-stone-50 border border-stone-200 rounded-lg p-3 sm:p-4">
              <div className="px-3 first:pl-1 py-1 sm:py-0">
                <span className="font-mono text-xs text-stone-600 uppercase block font-bold tracking-wider">
                  GIÁ TRỊ HÓA ĐƠN TB (AOV)
                </span>
                <span className="font-mono text-base text-stone-900 font-extrabold mt-1 block">685.000 ₫</span>
              </div>
              <div className="px-3 py-1 sm:py-0">
                <span className="font-mono text-xs text-stone-600 uppercase block font-bold tracking-wider">
                  TỐC ĐỘ VÒNG QUAY BÀN
                </span>
                <span className="font-mono text-base text-stone-900 font-extrabold mt-1 block">2.4 lượt / bàn</span>
              </div>
              <div className="px-3 py-1 sm:py-0">
                <span className="font-mono text-xs text-stone-600 uppercase block font-bold tracking-wider">
                  KHÁCH PHỤC VỤ LŨY KẾ
                </span>
                <span className="font-mono text-base text-stone-900 font-extrabold mt-1 block">168 lượt khách</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Urgent Action Feed */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-ops-brand" />
                <h3 className="font-ops text-sm font-bold text-stone-900">Hàng Đợi Xử Lý Gấp</h3>
              </div>
              <span className="font-mono text-xs uppercase font-extrabold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {actions.filter((a) => !a.approved).length} Yêu cầu
              </span>
            </div>

            <div className="divide-y divide-stone-200 text-xs">
              {actions.map((act) => (
                <div key={act.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${act.badgeClass}`}>
                      {act.title}
                    </span>
                    <span className="font-mono text-xs font-semibold text-stone-500">{act.time}</span>
                  </div>
                  <p className="font-bold text-sm text-stone-900">{act.dish}</p>
                  <p className="text-xs text-stone-600 font-medium">{act.desc}</p>
                  <div className="flex items-center justify-between pt-1">
                    {act.price && (
                      <span className="font-mono text-sm font-extrabold text-ops-brand">{formatVND(act.price)}</span>
                    )}
                    {act.approved ? (
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        ĐÃ DUYỆT PIN ✓
                      </span>
                    ) : act.type === 'void' ? (
                      <button
                        onClick={() => handleOpenPin(act.id)}
                        className="px-3 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-md font-mono text-xs font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        Duyệt PIN
                      </button>
                    ) : (
                      <Link
                        href={act.link || '#'}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-900 rounded-md font-mono text-xs font-bold shadow-2xs transition-colors"
                      >
                        {act.linkText}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Shift Activity Feed */}
      <div className="px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-ops-brand" />
              <h2 className="font-ops text-base font-bold text-stone-900">Nhật Ký Giao Dịch Gần Nhất</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Lọc mã đơn, bàn, món..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand w-52 sm:w-64"
                />
              </div>
              <Link
                href="/cash"
                className="font-mono text-xs text-ops-brand hover:underline uppercase flex items-center gap-1 font-bold whitespace-nowrap"
              >
                <span>Xem sổ két</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="text-stone-700 font-mono text-xs uppercase bg-stone-100 border-y border-stone-200">
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Mã Đơn</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Thời gian</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Vị trí</th>
                  <th className="py-3 px-3 font-bold">Món chính</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Phương thức</th>
                  <th className="py-3 px-3 text-right font-bold whitespace-nowrap">Tổng tiền</th>
                  <th className="py-3 px-3 text-right font-bold whitespace-nowrap">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-stone-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-3 font-mono text-ops-brand font-bold whitespace-nowrap group-hover:underline">
                      {ord.id}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-stone-600 font-medium whitespace-nowrap">{ord.time}</td>
                    <td className="py-3.5 px-3 font-bold text-stone-900 whitespace-nowrap">{ord.table}</td>
                    <td className="py-3.5 px-3 text-stone-700 font-medium truncate max-w-xs">{ord.items}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded border border-stone-200 text-xs font-mono font-medium">
                        {ord.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-stone-900 font-extrabold whitespace-nowrap text-sm">
                      {formatVND(ord.total)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${ord.statusClass}`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Xác thực PIN Quản Lý */}
      {pinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác Thực PIN Duyệt Ngoại Lệ"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-sm font-bold text-ops-ink">Xác Thực PIN Duyệt Ngoại Lệ</h3>
              </div>
              <button
                onClick={() => setPinModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ops-muted">
              Nhập mã PIN 4 số của Quản lý để duyệt hủy món và hoàn nguyên nguyên vật liệu vào kho BOM:
            </p>

            <form onSubmit={handleConfirmPin}>
              <div className="flex justify-center gap-3 py-3">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      pinInputRefs.current[i] = el;
                    }}
                    type="password"
                    maxLength={1}
                    value={pinDigits[i]}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1);
                      const next = [...pinDigits];
                      next[i] = val;
                      setPinDigits(next);
                      if (val && i < 3) {
                        pinInputRefs.current[i + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !pinDigits[i] && i > 0) {
                        pinInputRefs.current[i - 1]?.focus();
                      }
                    }}
                    className="w-11 h-12 text-center text-xl font-mono font-bold bg-ops-bg border border-ops-border rounded-lg focus:outline-none focus:border-ops-brand"
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Xác Nhận Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Chi Tiết Hóa Đơn ${selectedOrder.id}`}
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">
                  Chi Tiết Hóa Đơn {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-600 font-medium">Bàn phục vụ:</span>
                <strong className="text-stone-900 font-bold">{selectedOrder.table}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-600 font-medium">Thời gian tạo:</span>
                <span className="font-mono text-stone-900 font-semibold">{selectedOrder.time}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-600 font-medium">Nhân viên phụ trách:</span>
                <span className="text-stone-900 font-bold">{selectedOrder.waiter}</span>
              </div>
              <div className="py-2">
                <span className="text-stone-700 block mb-1 font-mono uppercase text-xs font-bold tracking-wider">
                  Danh mục món ăn:
                </span>
                <p className="p-3 bg-stone-50 rounded-lg border border-stone-200 font-semibold text-stone-900 text-xs leading-relaxed">
                  {selectedOrder.items}
                </p>
              </div>
              <div className="space-y-1.5 pt-2 font-mono text-xs">
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Tiền hàng trước thuế:</span>
                  <span className="text-stone-800 font-semibold">{formatVND(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Thuế VAT (8%):</span>
                  <span className="text-stone-800 font-semibold">{formatVND(selectedOrder.vat)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Tổng thanh toán:</span>
                  <span className="text-ops-brand text-lg">{formatVND(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => {
                  showToast(`Đang in lại phiếu hóa đơn ${selectedOrder.id} ra máy in thu ngân...`);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-900 text-xs font-mono uppercase rounded-lg font-bold cursor-pointer transition-colors"
              >
                In Lại Hóa Đơn
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded-lg font-bold cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
