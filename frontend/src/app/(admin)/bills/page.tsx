'use client';

import * as React from 'react';
import {
  FileText,
  Search,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Ban,
  Receipt,
  QrCode,
  Lock,
  X,
  Send,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { AdminToast, useAdminToast, KpiCard } from '@/components/admin';
import { INITIAL_BILLS, PREV_SHIFT_REVENUE } from '@/services/mock';
import { Bill } from './bills-helpers';

export default function AdminBillsPage() {
  const MANAGER_PIN = '1234'; // PIN demo — thay bằng xác thực API trong production
  const [bills, setBills] = React.useState<Bill[]>(INITIAL_BILLS);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [methodFilter, setMethodFilter] = React.useState<string>('ALL');
  const { toastMsg, showToast } = useAdminToast(3200);

  // Modals
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [voidModalOpen, setVoidModalOpen] = React.useState(false);
  const [voidBillId, setVoidBillId] = React.useState<string | null>(null);
  const [voidReason, setVoidReason] = React.useState('Khách đổi món trước chế biến');
  const [voidPin, setVoidPin] = React.useState(['', '', '', '']);
  const pinInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Modal a11y: Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBill(null);
        setVoidModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus first PIN input when void modal opens
  React.useEffect(() => {
    if (!voidModalOpen) return;
    const timer = setTimeout(() => pinInputRefs.current[0]?.focus(), 50);
    return () => clearTimeout(timer);
  }, [voidModalOpen]);

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
    if (pin !== MANAGER_PIN) {
      showToast('PIN không đúng');
      return;
    }
    if (!voidBillId) return;

    setBills((prev) =>
      prev.map((b) => (b.id === voidBillId ? { ...b, status: 'VOIDED', cqtVerified: false, voidReason: voidReason } : b))
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

  // Tính % tăng trưởng doanh thu so với ca trước (rounded 1 decimal)
  const revenueGrowthPct =
    PREV_SHIFT_REVENUE > 0
      ? Math.round(((totalPaidRevenue - PREV_SHIFT_REVENUE) / PREV_SHIFT_REVENUE) * 1000) / 10
      : 0;
  const revenueGrowthText =
    revenueGrowthPct >= 0 ? `+${revenueGrowthPct}% CA TRƯỚC` : `${revenueGrowthPct}% CA TRƯỚC`;

  // Tỷ lệ hoàn tất hóa đơn (%)
  const paidRatioPct =
    bills.length > 0 ? Math.round((totalPaidCount / bills.length) * 1000) / 10 : 0;
  const paidRatioText = `${paidRatioPct}% TỶ LỆ`;

  // Số hóa đơn có giảm giá
  const discountBillCount = bills.filter((b) => b.discount > 0).length;
  const discountBadgeText = `${discountBillCount} HÓA ĐƠN`;

  // Số hóa đơn VOIDED (cho KPI thứ 4)
  const voidedCount = bills.filter((b) => b.status === 'VOIDED').length;
  const voidedBadgeText = `${voidedCount} HÓA ĐƠN`;

  return (
    <div className="w-full">
      {/* Toast Alert Dùng Chung */}
      <AdminToast message={toastMsg} />

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

      {/* 4 Summary KPI Cards (Dùng KpiCard Component) */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="DOANH THU THỰC THU"
          value={formatVND(totalPaidRevenue)}
          badge={{ text: revenueGrowthText, variant: 'success' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>Đã thu tiền thành công</span>
              <span className="font-mono font-bold text-emerald-700">{totalPaidCount} hóa đơn</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-ops-brand"
        />

        <KpiCard
          title="HÓA ĐƠN HOÀN TẤT"
          value={`${totalPaidCount} / ${bills.length}`}
          badge={{ text: paidRatioText, variant: 'success' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>Chờ thanh toán: 1 bàn</span>
              <span className="font-mono font-bold text-stone-700">ĐANG PHỤC VỤ</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-600"
        />

        <KpiCard
          title="GIẢM GIÁ & VOUCHER"
          value={formatVND(totalDiscount)}
          badge={{ text: discountBadgeText, variant: 'warning' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>Chính sách thẻ VIP/Gold</span>
              <span className="font-mono font-bold text-amber-700">ĐÃ ÁP DỤNG</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-amber-500"
        />

        <KpiCard
          title="HỦY & TRẢ MÓN (VOID)"
          value={formatVND(totalVoidedAmount)}
          badge={{ text: voidedBadgeText, variant: 'danger' }}
          subtext={
            <div className="flex items-center justify-between">
              <span>Đã hoàn nguyên kho BOM</span>
              <span className="font-mono font-bold text-rose-700">KIỂM SOÁT TỐT</span>
            </div>
          }
          className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-rose-600"
        />
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
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-ops-brand cursor-pointer shadow-2xs"
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
                          <span className="font-mono text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-medium">
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
                          <span
                            className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-help"
                            title={bill.voidReason ? `Lý do hủy: ${bill.voidReason}` : 'Hóa đơn đã bị hủy'}
                          >
                            <span>ĐÃ HỦY (VOID)</span>
                            {bill.voidReason && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
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
                          {bill.status === 'PAID' ? (
                            <button
                              onClick={() => handleOpenVoidModal(bill.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-md transition-colors"
                              title="Hủy / Hoàn tiền hóa đơn (Yêu cầu PIN Quản lý)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-stone-300 cursor-not-allowed inline-flex" title="Không khả dụng">
                              <Ban className="w-4 h-4 opacity-25" />
                            </span>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Phiếu Hóa Đơn ${selectedBill.id}`}
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
        >
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
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated 80mm Thermal Receipt Preview */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3 font-mono text-xs text-stone-900">
              <div className="text-center pb-2 border-b border-dashed border-stone-300">
                <h4 className="font-ops font-bold text-sm uppercase text-stone-900">BOMBAY PALACE CONNAUGHT</h4>
                <p className="text-xs text-stone-700 font-medium">Fine Dining London & Asian Luxury Cuisine</p>
                <p className="text-xs text-stone-600 font-medium">MST: 0108928374 • Hotline: 1900 6868</p>
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
                {selectedBill.items.map((item) => (
                  <div key={item.name} className="flex justify-between items-baseline text-xs">
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

              {/* Voided Notification Banner */}
              {selectedBill.status === 'VOIDED' && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <Ban className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>HÓA ĐƠN ĐÃ ĐƯỢC DUYỆT HỦY (VOID)</span>
                  </div>
                  {selectedBill.voidReason && (
                    <p className="text-rose-700 font-sans pl-5 font-medium">
                      Lý do hủy: <span className="font-semibold text-rose-900">{selectedBill.voidReason}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-stone-200">
              <button
                onClick={() => {
                  showToast(`Đang gửi phiếu hóa đơn ${selectedBill.id} qua Zalo / SMS cho khách hàng...`);
                }}
                className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-stone-600" />
                <span>Gửi Zalo / Email</span>
              </button>
              <button
                onClick={() => {
                  showToast(`Đang in lại hóa đơn ${selectedBill.id} ra máy in thu ngân...`);
                  setSelectedBill(null);
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu 80mm</span>
              </button>
              <button
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
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
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Xác Thực Hủy Hóa Đơn ${voidBillId}`}
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                <h3 className="font-ops text-sm font-bold text-stone-900">
                  Xác Thực Hủy Hóa Đơn {voidBillId}
                </h3>
              </div>
              <button
                onClick={() => setVoidModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-stone-100 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              Thao tác này sẽ hủy giao dịch, <strong className="text-stone-900 font-bold">hoàn nguyên nguyên vật liệu về kho BOM</strong> và tạo biên bản ghi vết kiểm toán hệ thống:
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Lý do hủy hóa đơn:
                </label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:border-rose-500 cursor-pointer"
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
                      ref={(el) => {
                        pinInputRefs.current[i] = el;
                      }}
                      type="password"
                      maxLength={1}
                      value={voidPin[i]}
                      onChange={(e) => {
                        const val = e.target.value.slice(-1);
                        const next = [...voidPin];
                        next[i] = val;
                        setVoidPin(next);
                        if (val && i < 3) {
                          pinInputRefs.current[i + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !voidPin[i] && i > 0) {
                          pinInputRefs.current[i - 1]?.focus();
                        }
                      }}
                      className="w-11 h-12 text-center text-lg font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-stone-900 transition-all shadow-2xs"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Xác Nhận Hủy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

