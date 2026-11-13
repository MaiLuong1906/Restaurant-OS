'use client';

import * as React from 'react';
import {
  PlusCircle,
  Lock,
  X,
  Search,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface PettyCashItem {
  id: string;
  time: string;
  purpose: string;
  spender: string;
  amount: number;
  approvedBy: string;
  receiptStatus: string;
}

export default function AdminCashPage() {
  const [pettyCashModalOpen, setPettyCashModalOpen] = React.useState(false);
  const [shiftCloseModalOpen, setShiftCloseModalOpen] = React.useState(false);

  // Form states
  const [pettyReason, setPettyReason] = React.useState('');
  const [pettyAmount, setPettyAmount] = React.useState('');
  const [pettySpender, setPettySpender] = React.useState('Nguyễn Văn Tuấn (Bếp trưởng)');

  // Shift Close state
  const [actualCashCount, setActualCashCount] = React.useState('16150000');
  const [shiftNote, setShiftNote] = React.useState('Tiền mặt bàn giao đầy đủ vào két an toàn tầng 1');
  const [isShiftClosed, setIsShiftClosed] = React.useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = React.useState('');
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Base financial variables
  const openingFloat = 2000000; // Tiền đầu ca
  const cashSales = 15000000; // Doanh thu tiền mặt thu được trong ca

  const [pettyItems, setPettyItems] = React.useState<PettyCashItem[]>([
    {
      id: '#EXP-0881',
      time: '18:15',
      purpose: 'Mua đá viên tinh khiết bổ sung khẩn cấp (Bar)',
      spender: 'Mai Thị Hoa (FOH)',
      amount: 150000,
      approvedBy: 'Trần Thị Mai (QL Ca)',
      receiptStatus: 'Đã đính kèm hóa đơn',
    },
    {
      id: '#EXP-0882',
      time: '19:40',
      purpose: 'Mua rau ngò rí và ớt chỉ thiên tươi chợ Connaught',
      spender: 'Nguyễn Văn Tuấn (Bếp trưởng)',
      amount: 700000,
      approvedBy: 'Trần Thị Mai (QL Ca)',
      receiptStatus: 'Hóa đơn bán lẻ',
    },
  ]);

  const totalPettyCash = pettyItems.reduce((sum, item) => sum + item.amount, 0);
  const expectedCashOnHand = openingFloat + cashSales - totalPettyCash;
  const actualNum = Number(actualCashCount) || 0;
  const discrepancy = actualNum - expectedCashOnHand;

  const handlePettySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(pettyAmount) || 0;
    if (!pettyReason || amountNum <= 0) {
      showToast('Vui lòng nhập lý do và số tiền chi hợp lệ');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newItem: PettyCashItem = {
      id: `#EXP-088${pettyItems.length + 1}`,
      time: timeStr,
      purpose: pettyReason,
      spender: pettySpender,
      amount: amountNum,
      approvedBy: 'Quản Lý Ca',
      receiptStatus: 'Đã ký phiếu chi',
    };

    setPettyItems([newItem, ...pettyItems]);
    showToast(`Đã lập phiếu chi ${formatVND(amountNum)} thành công! Quỹ két tự động cập nhật.`);
    setPettyCashModalOpen(false);
    setPettyReason('');
    setPettyAmount('');
  };

  const handleShiftCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsShiftClosed(true);
    setShiftCloseModalOpen(false);
    showToast('Đã chốt két ca trực, niêm phong doanh thu và in biên bản bàn giao thành công!');
  };

  const filteredItems = pettyItems.filter(
    (item) =>
      item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.spender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ops-ink text-white px-4 py-2.5 rounded-lg shadow-lg border border-ops-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Kiểm Đếm Két Tiền & Chốt Ca
            </h1>
            <p className="text-sm font-medium text-stone-600">
              Đối soát tiền mặt đầu ca, doanh thu tiền mặt, quỹ chi khẩn cấp và biên bản chốt két ca trực
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setPettyCashModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 rounded-lg shadow-2xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-ops-brand" />
              <span>+ Lập Phiếu Chi Két (Petty Cash)</span>
            </button>
            <button
              onClick={() => {
                if (isShiftClosed) {
                  showToast('Ca trực này đã được chốt và ký số bàn giao!');
                } else {
                  setShiftCloseModalOpen(true);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                isShiftClosed
                  ? 'bg-emerald-700 text-white'
                  : 'bg-ops-brand hover:bg-ops-brand-dark text-white'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>{isShiftClosed ? 'ĐÃ CHỐT & BÀN GIAO KÉT' : 'Biên Bản Chốt Ca Trực'}</span>
            </button>
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cash Breakdown Formula (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="font-mono text-xs text-stone-700 uppercase font-bold tracking-wider block">
                    CA TRỰC HIỆN TẠI
                  </span>
                  <span className="font-mono text-xs font-extrabold text-stone-900">SHIFT-20241107-02 (Ca Tối)</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    isShiftClosed
                      ? 'bg-stone-100 text-stone-700 border-stone-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isShiftClosed ? 'bg-stone-500' : 'bg-emerald-600 animate-pulse'}`} />
                  {isShiftClosed ? 'ĐÃ KẾT CA' : 'Đang hoạt động'}
                </span>
              </div>

              {/* 3-Line Cash Audit Formula */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-900 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <span className="font-sans font-semibold text-stone-800">Tiền mặt mở két đầu ca:</span>
                  </div>
                  <span className="font-bold text-stone-900">{formatVND(openingFloat)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                    <span className="font-sans font-semibold text-stone-800">Thực thu tiền mặt trong ca:</span>
                  </div>
                  <span className="font-bold text-emerald-700">+{formatVND(cashSales)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                      -
                    </span>
                    <span className="font-sans font-semibold text-stone-800">Tổng phiếu chi khẩn cấp (Petty Cash):</span>
                  </div>
                  <span className="font-bold text-rose-700">-{formatVND(totalPettyCash)}</span>
                </div>
              </div>

              {/* Total Balance Card */}
              <div className="p-4 rounded-xl bg-ops-brand text-white shadow-xs space-y-1">
                <span className="font-mono text-xs uppercase tracking-wider text-rose-100 font-bold block">
                  TIỀN MẶT LÝ THUYẾT TRONG KÉT HIỆN TẠI
                </span>
                <div className="font-mono text-3xl font-extrabold tracking-tight">
                  {formatVND(expectedCashOnHand)}
                </div>
                <span className="text-xs text-rose-100 font-medium block pt-1">
                  Thu ngân chịu trách nhiệm kiểm đếm và đối soát số dư này khi chốt ca.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Petty Cash Ledger (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h2 className="font-ops text-base font-bold text-stone-900">Sổ Quỹ Chi Khẩn Cấp (Petty Cash)</h2>
                <p className="text-xs font-semibold text-stone-600">Ghi nhận các khoản chi phát sinh trong ca trực</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm phiếu chi, người chi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand w-48 sm:w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-stone-100 border-y border-stone-200 text-stone-700 font-mono text-xs uppercase">
                    <th className="py-3 px-3 font-bold">Mã &amp; Giờ</th>
                    <th className="py-3 px-3 font-bold">Lý Do Chi &amp; Người Nhận</th>
                    <th className="py-3 px-3 font-bold">Duyệt Bởi</th>
                    <th className="py-3 px-3 text-right font-bold">Số Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-stone-900 block">{item.id}</span>
                        <span className="font-mono text-xs text-stone-500 font-medium">{item.time}</span>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-stone-900 block font-bold">{item.purpose}</strong>
                        <span className="text-xs text-stone-600 font-medium">{item.spender}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold">
                          {item.approvedBy}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-700 text-sm">
                        -{formatVND(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Lập Phiếu Chi Két */}
      {pettyCashModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Lập Phiếu Chi Két (Petty Cash)</h3>
              </div>
              <button
                onClick={() => setPettyCashModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePettySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Mục Đích Chi Tiền Mặt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mua thêm đá viên tinh khiết quầy Bar"
                  value={pettyReason}
                  onChange={(e) => setPettyReason(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-medium"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Số Tiền Chi (VND) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="Ví dụ: 150000"
                  value={pettyAmount}
                  onChange={(e) => setPettyAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Người Nhận Tiền & Bộ Phận
                </label>
                <select
                  value={pettySpender}
                  onChange={(e) => setPettySpender(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand"
                >
                  <option value="Nguyễn Văn Tuấn (Bếp trưởng)">Nguyễn Văn Tuấn (Bếp trưởng - BOH)</option>
                  <option value="Mai Thị Hoa (FOH Lead)">Mai Thị Hoa (FOH Lead)</option>
                  <option value="Lê Văn An (Phụ bếp)">Lê Văn An (Phụ bếp - BOH)</option>
                  <option value="Đỗ Thu Thảo (Thu ngân)">Đỗ Thu Thảo (Thu ngân)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setPettyCashModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Lưu & Trừ Két
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Biên Bản Chốt Ca Trực */}
      {shiftCloseModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Biên Bản Kiểm Két Chốt Ca</h3>
              </div>
              <button
                onClick={() => setShiftCloseModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShiftCloseSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-ops-bg rounded-lg space-y-1 font-mono">
                <div className="flex justify-between text-ops-muted">
                  <span>Số dư sổ sách dự kiến:</span>
                  <strong className="text-ops-ink">{formatVND(expectedCashOnHand)}</strong>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Số Tiền Thực Tế Đếm Được Tại Két (VND) *
                </label>
                <input
                  type="number"
                  required
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold text-base"
                />
              </div>

              <div
                className={`p-3 rounded-lg border font-mono text-xs flex justify-between items-center ${
                  discrepancy === 0
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : discrepancy < 0
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <span>Chênh lệch kiểm đếm:</span>
                <strong className="text-sm">
                  {discrepancy === 0
                    ? '0 ₫ (Khớp 100%)'
                    : `${discrepancy > 0 ? '+' : ''}${formatVND(discrepancy)}`}
                </strong>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Ghi Chú Bàn Giao Niêm Phong
                </label>
                <textarea
                  rows={2}
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setShiftCloseModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Ký Số & Chốt Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
