'use client';

import * as React from 'react';
import {
  FileText,
  Search,
  Filter,
  Printer,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Receipt,
  QrCode,
  ArrowUpDown,
  Lock,
  X,
  Send,
  Calendar,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface BillItem {
  name: string;
  qty: number;
  price: number;
}

interface Bill {
  id: string;
  eInvoiceCode?: string;
  time: string;
  table: string;
  zone: string;
  customer: string;
  phone?: string;
  cashier: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: 'VIETQR DYNAMIC' | 'THẺ TÍN DỤNG' | 'TIỀN MẶT' | 'CHUYỂN KHOẢN';
  status: 'PAID' | 'PENDING' | 'VOIDED' | 'REFUNDED';
  cqtVerified: boolean;
}

const INITIAL_BILLS: Bill[] = [
  {
    id: '#ORD-9024',
    eInvoiceCode: 'HD-2024-009024',
    time: '19:42:15',
    table: 'Bàn VIP-02',
    zone: 'Tầng 2 - Phòng Riêng',
    customer: 'Ông Trần Hoàng Long',
    phone: '0903 *** 888',
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
    paymentMethod: 'VIETQR DYNAMIC',
    status: 'PAID',
    cqtVerified: true,
  },
  {
    id: '#ORD-9023',
    eInvoiceCode: 'HD-2024-009023',
    time: '19:28:40',
    table: 'Bàn T1-04',
    zone: 'Tầng 1 - Sảnh Chính',
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
    paymentMethod: 'TIỀN MẶT',
    status: 'PAID',
    cqtVerified: true,
  },
  {
    id: '#ORD-9022',
    eInvoiceCode: 'HD-2024-009022',
    time: '19:15:02',
    table: 'Bàn T1-02',
    zone: 'Tầng 1 - Sảnh Chính',
    customer: 'Bà Lê Kim Ngân (Thành Viên Gold)',
    phone: '0912 *** 345',
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
    paymentMethod: 'THẺ TÍN DỤNG',
    status: 'PAID',
    cqtVerified: true,
  },
  {
    id: '#ORD-9021',
    time: '18:55:10',
    table: 'Bàn OUT-01',
    zone: 'Sân Vườn Terrace',
    customer: 'Khách Đặt Trước',
    cashier: 'Phạm Đức Duy',
    items: [
      { name: 'Bò Lúc Lắc Wagyu A4 & Nấm Truffle', qty: 1, price: 480000 },
    ],
    subtotal: 480000,
    discount: 0,
    vat: 38400,
    total: 518400,
    paymentMethod: 'TIỀN MẶT',
    status: 'VOIDED',
    cqtVerified: false,
  },
  {
    id: '#ORD-9020',
    eInvoiceCode: 'HD-2024-009020',
    time: '18:40:22',
    table: 'Bàn VIP-01',
    zone: 'Tầng 2 - Phòng Riêng',
    customer: 'Công ty Cổ Phần Alpha Tech',
    phone: '028 3822 ****',
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
    paymentMethod: 'CHUYỂN KHOẢN',
    status: 'PAID',
    cqtVerified: true,
  },
  {
    id: '#ORD-9019',
    time: '18:22:15',
    table: 'Bàn T1-06',
    zone: 'Tầng 1 - Sảnh Chính',
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
    paymentMethod: 'VIETQR DYNAMIC',
    status: 'PENDING',
    cqtVerified: false,
  },
  {
    id: '#ORD-9018',
    eInvoiceCode: 'HD-2024-009018',
    time: '17:50:00',
    table: 'Bàn T1-01',
    zone: 'Tầng 1 - Sảnh Chính',
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
    paymentMethod: 'VIETQR DYNAMIC',
    status: 'PAID',
    cqtVerified: true,
  },
];

export default function AdminBillsPage() {
  const [bills, setBills] = React.useState<Bill[]>(INITIAL_BILLS);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [methodFilter, setMethodFilter] = React.useState<string>('ALL');
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // Modals
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [voidModalOpen, setVoidModalOpen] = React.useState(false);
  const [voidBillId, setVoidBillId] = React.useState<string | null>(null);
  const [voidReason, setVoidReason] = React.useState('Khách đổi món trước chế biến');
  const [voidPin, setVoidPin] = React.useState(['', '', '', '']);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleOpenVoidModal = (billId: string) => {
    setVoidBillId(billId);
    setVoidPin(['', '', '', '']);
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = voidPin.join('');
    if (pin.length < 4) {
      showToast('Vui lòng nhập đủ 4 chữ số PIN Quản lý!');
      return;
    }
    if (!voidBillId) return;

    setBills((prev) =>
      prev.map((b) => (b.id === voidBillId ? { ...b, status: 'VOIDED', cqtVerified: false } : b))
    );
    setVoidModalOpen(false);
    showToast(`Đã duyệt hủy hóa đơn ${voidBillId} thành công và hoàn nguyên định lượng kho BOM!`);
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.cashier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.eInvoiceCode && b.eInvoiceCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || b.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalPaidRevenue = bills
    .filter((b) => b.status === 'PAID')
    .reduce((sum, b) => sum + b.total, 0);

  const totalPaidCount = bills.filter((b) => b.status === 'PAID').length;
  const totalVoidedAmount = bills
    .filter((b) => b.status === 'VOIDED')
    .reduce((sum, b) => sum + b.total, 0);
  const totalDiscount = bills.reduce((sum, b) => sum + b.discount, 0);

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-stone-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Top Header Strip */}
      <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 sm:gap-3">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl text-stone-900 font-bold tracking-tight">
              Quản Lý Hóa Đơn & Chứng Từ
            </h1>
            <span className="font-mono text-xs font-bold text-stone-700 tracking-wider bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md sm:ml-2">
              CA TỐI #02 • {bills.length} HÓA ĐƠN
            </span>
          </div>
          <p className="text-sm font-medium text-stone-600">
            Tra cứu toàn bộ phiếu thanh toán, in lại hóa đơn nhiệt 80mm và kiểm soát phát hành hóa đơn điện tử VAT
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
          <button
            onClick={() => showToast('Đang kết xuất dữ liệu hóa đơn Ca Tối #02 ra file Excel (.xlsx)...')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 rounded-lg text-xs font-bold font-mono uppercase shadow-2xs cursor-pointer transition-colors"
          >
            <Download className="h-4 w-4 text-stone-600" />
            <span className="hidden sm:inline">Xuất File Excel</span>
          </button>
          <button
            onClick={() => showToast('Mở lệnh phát hành hóa đơn điện tử hàng loạt lên Tổng Cục Thuế...')}
            className="flex items-center gap-1.5 px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg text-xs font-bold font-mono uppercase shadow-xs cursor-pointer transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Ký Số E-Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-ops-brand" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700 whitespace-nowrap">
                DOANH THU THỰC THU
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-bold rounded">
                +14.2% CA TRƯỚC
              </span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap">
              {formatVND(totalPaidRevenue)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>Đã thu tiền thành công</span>
            <span className="font-mono font-bold text-emerald-700">{totalPaidCount} hóa đơn</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700 whitespace-nowrap">
                HÓA ĐƠN HOÀN TẤT
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-bold rounded">
                97.2% TỶ LỆ
              </span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap">
              {totalPaidCount} / {bills.length}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>Chờ thanh toán: 1 bàn</span>
            <span className="font-mono font-bold text-stone-700">ĐANG PHỤC VỤ</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700 whitespace-nowrap">
                GIẢM GIÁ & VOUCHER
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-bold rounded">
                3 HÓA ĐƠN
              </span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap">
              {formatVND(totalDiscount)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>Chính sách thẻ VIP/Gold</span>
            <span className="font-mono font-bold text-amber-700">ĐÃ ÁP DỤNG</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700 whitespace-nowrap">
                HỦY & TRẢ MÓN (VOID)
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-mono text-xs font-bold rounded">
                1 HÓA ĐƠN
              </span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap">
              {formatVND(totalVoidedAmount)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>Đã hoàn nguyên kho BOM</span>
            <span className="font-mono font-bold text-rose-700">KIỂM SOÁT TỐT</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Area */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ (#ORD-...), e-Invoice, bàn, khách hàng, thu ngân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center bg-stone-100 border border-stone-200 rounded-lg p-1">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'PAID', label: 'Đã thanh toán' },
                { key: 'PENDING', label: 'Chờ thu' },
                { key: 'VOIDED', label: 'Đã hủy (Void)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1 font-mono text-xs uppercase rounded-md font-bold transition-all cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-ops-brand text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Payment Method Select */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:border-ops-brand cursor-pointer"
            >
              <option value="ALL">Mọi phương thức</option>
              <option value="VIETQR DYNAMIC">VietQR Dynamic</option>
              <option value="THẺ TÍN DỤNG">Thẻ tín dụng / POS</option>
              <option value="TIỀN MẶT">Tiền mặt</option>
              <option value="CHUYỂN KHOẢN">Chuyển khoản</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Bills Table */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 pb-12">
        <div className="bg-white border border-stone-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead>
                <tr className="text-stone-700 font-mono text-xs uppercase bg-stone-100 border-b border-stone-200">
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Mã Hóa Đơn</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Thời Gian</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Vị Trí / Bàn</th>
                  <th className="py-3 px-3 font-bold">Khách Hàng / Đơn Vị</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Thu Ngân</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Phương Thức</th>
                  <th className="py-3 px-3 text-right font-bold whitespace-nowrap">Tổng Tiền</th>
                  <th className="py-3 px-3 text-center font-bold whitespace-nowrap">E-Invoice</th>
                  <th className="py-3 px-3 text-center font-bold whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3 px-4 text-right font-bold whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-stone-500 font-medium">
                      Không tìm thấy hóa đơn nào khớp với bộ lọc tìm kiếm hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-stone-50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <td className="py-3.5 px-4 font-mono text-ops-brand font-bold whitespace-nowrap group-hover:underline">
                        {bill.id}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-stone-600 font-medium whitespace-nowrap">
                        {bill.time}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-stone-900 block">{bill.table}</span>
                        <span className="font-mono text-[10px] text-stone-500">{bill.zone}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-stone-900 block">{bill.customer}</span>
                        {bill.phone && <span className="font-mono text-[11px] text-stone-500">{bill.phone}</span>}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-stone-700 whitespace-nowrap">
                        {bill.cashier}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded border border-stone-200 text-xs font-mono font-medium">
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-stone-900 font-extrabold whitespace-nowrap text-sm">
                        {formatVND(bill.total)}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {bill.cqtVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            CQT ĐÃ CẤP MÃ
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-stone-400 font-medium">
                            Chưa cấp mã
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {bill.status === 'PAID' && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-xs font-bold">
                            ĐÃ THANH TOÁN
                          </span>
                        )}
                        {bill.status === 'PENDING' && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-mono text-xs font-bold">
                            CHỜ THANH TOÁN
                          </span>
                        )}
                        {bill.status === 'VOIDED' && (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded font-mono text-xs font-bold">
                            ĐÃ HỦY (VOID)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="p-1.5 hover:bg-stone-100 text-stone-700 hover:text-stone-900 rounded-md transition-colors"
                            title="Xem chi tiết phiếu hóa đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => showToast(`Đang gửi lệnh in lại hóa đơn ${bill.id} ra máy in nhiệt 80mm...`)}
                            className="p-1.5 hover:bg-stone-100 text-stone-700 hover:text-stone-900 rounded-md transition-colors"
                            title="In lại phiếu hóa đơn"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {bill.status === 'PAID' && (
                            <button
                              onClick={() => handleOpenVoidModal(bill.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-md transition-colors"
                              title="Hủy / Hoàn tiền hóa đơn (Yêu cầu PIN Quản lý)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: CHI TIẾT HÓA ĐƠN & PHIẾU IN NHIỆT                            */}
      {/* ===================================================================== */}
      {selectedBill && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-ops-brand" />
                <h3 className="font-ops text-base font-bold text-stone-900">
                  Phiếu Hóa Đơn {selectedBill.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="w-7 h-7 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated 80mm Thermal Receipt Preview */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3 font-mono text-xs text-stone-900">
              <div className="text-center pb-2 border-b border-dashed border-stone-300">
                <h4 className="font-ops font-bold text-sm uppercase text-stone-900">BOMBAY PALACE CONNAUGHT</h4>
                <p className="text-[11px] text-stone-600 font-medium">Fine Dining London & Asian Luxury Cuisine</p>
                <p className="text-[10px] text-stone-500">MST: 0108928374 • Hotline: 1900 6868</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-dashed border-stone-300">
                <div>
                  <span className="text-stone-500">Mã HĐ: </span>
                  <span className="font-bold text-ops-brand">{selectedBill.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500">Giờ in: </span>
                  <span className="font-semibold">{selectedBill.time}</span>
                </div>
                <div>
                  <span className="text-stone-500">Vị trí: </span>
                  <span className="font-bold">{selectedBill.table}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500">Thu ngân: </span>
                  <span>{selectedBill.cashier}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1 border-b border-dashed border-stone-300">
                <div className="flex justify-between font-bold text-stone-700 pb-1 text-[11px]">
                  <span>Tên món</span>
                  <span className="text-right">SL x Đơn giá = Thành tiền</span>
                </div>
                {selectedBill.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-stone-900 max-w-[200px] truncate">{item.name}</span>
                    <span className="font-bold text-stone-800 text-right">
                      {item.qty} x {formatVND(item.price)} = {formatVND(item.qty * item.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-1 pt-1 text-xs">
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Tiền hàng trước thuế:</span>
                  <span>{formatVND(selectedBill.subtotal)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Giảm giá thẻ thành viên:</span>
                    <span>-{formatVND(selectedBill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Thuế GTGT VAT (8%):</span>
                  <span>{formatVND(selectedBill.vat)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-300">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-ops-brand text-lg">{formatVND(selectedBill.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-600 pt-1">
                  <span>Phương thức:</span>
                  <span className="font-bold text-stone-800">{selectedBill.paymentMethod}</span>
                </div>
              </div>

              {/* E-Invoice Section */}
              {selectedBill.eInvoiceCode && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900 block">Hóa đơn điện tử CQT hợp lệ</span>
                      <span className="text-emerald-700 font-mono">{selectedBill.eInvoiceCode}</span>
                    </div>
                  </div>
                  <QrCode className="w-6 h-6 text-emerald-800 shrink-0" />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => {
                  showToast(`Đang gửi phiếu hóa đơn ${selectedBill.id} qua Zalo / SMS cho khách hàng...`);
                }}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-900 text-xs font-mono uppercase rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Zalo / Email</span>
              </button>
              <button
                onClick={() => {
                  showToast(`Đang in lại hóa đơn ${selectedBill.id} ra máy in thu ngân...`);
                  setSelectedBill(null);
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-mono uppercase rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu 80mm</span>
              </button>
              <button
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded-lg font-bold cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: DUYỆT HỦY / HOÀN TIỀN VỚI MÃ PIN QUẢN LÝ                     */}
      {/* ===================================================================== */}
      {voidModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-ops-brand" />
                <h3 className="font-ops text-sm font-bold text-stone-900">
                  Xác Thực Hủy Hóa Đơn {voidBillId}
                </h3>
              </div>
              <button
                onClick={() => setVoidModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-stone-100 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 font-medium">
              Thao tác này sẽ hủy giao dịch, hoàn nguyên nguyên vật liệu về kho BOM và tạo biên bản ghi vết kiểm toán hệ thống:
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Lý do hủy hóa đơn:
                </label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:border-ops-brand cursor-pointer"
                >
                  <option value="Khách đổi món trước chế biến">Khách đổi món trước chế biến</option>
                  <option value="Thu ngân gộp nhầm bàn">Thu ngân gộp nhầm bàn</option>
                  <option value="Lỗi thiết bị POS / Không thể quẹt thẻ">Lỗi thiết bị POS / Không thể quẹt thẻ</option>
                  <option value="Khách yêu cầu tách hóa đơn">Khách yêu cầu tách hóa đơn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 text-center">
                  Nhập mã PIN Quản lý (4 số):
                </label>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      id={`void-pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={voidPin[i]}
                      onChange={(e) => {
                        const val = e.target.value.slice(-1);
                        const next = [...voidPin];
                        next[i] = val;
                        setVoidPin(next);
                        if (val && i < 3) {
                          document.getElementById(`void-pin-${i + 1}`)?.focus();
                        }
                      }}
                      className="w-11 h-12 text-center text-lg font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-ops-brand text-stone-900"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono uppercase rounded-lg font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Xác Nhận Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

