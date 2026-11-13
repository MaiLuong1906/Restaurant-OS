'use client';

import * as React from 'react';
import {
  Truck,
  CheckSquare,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { INITIAL_STOCK, StockItem } from '@/services/mock';
import { AdminToast, useAdminToast, KpiCard } from '@/components/admin';

export default function AdminInventoryPage() {
  const [stockItems, setStockItems] = React.useState<StockItem[]>(INITIAL_STOCK);
  const [poModalOpen, setPoModalOpen] = React.useState(false);
  const [auditModalOpen, setAuditModalOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<'all' | 'cold' | 'chill' | 'dry' | 'wine'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const { toastMsg, showToast } = useAdminToast(3000);

  // Inbound PO Form State
  const [poForm, setPoForm] = React.useState({
    poCode: 'PO-20241107-04',
    sku: 'RAW-WAGYU-A4',
    qty: '10',
    temp: '-18.5',
    scaleDiscrepancy: '-0.1',
    supplier: 'MeatWorld UK Import Ltd',
  });

  // Audit Form State
  const [auditForm, setAuditForm] = React.useState({
    sku: 'WINE-MARGAUX-15',
    physicalCount: '4',
    reason: 'Đã tìm thấy 1 chai trong tủ trữ VIP Maharaja',
  });

  // Modal a11y: Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPoModalOpen(false);
        setAuditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInboundPoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addQty = Number(poForm.qty) || 0;
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.sku === poForm.sku) {
          const nextStock = Number((item.actualStock + addQty).toFixed(2));
          const nextTotal = Math.round(nextStock * item.costPrice);
          const nextStatus = nextStock >= item.safetyStock ? 'SAFE' : 'LOW';
          return {
            ...item,
            actualStock: nextStock,
            totalValue: nextTotal,
            status: nextStatus,
          };
        }
        return item;
      })
    );
    showToast(`Đã nghiệm thu nhập kho thành công đơn ${poForm.poCode}! Tồn kho tự động tăng thêm +${addQty}.`);
    setPoModalOpen(false);
  };

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCount = Number(auditForm.physicalCount) || 0;
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.sku === auditForm.sku) {
          const nextTotal = Math.round(newCount * item.costPrice);
          const nextStatus = newCount >= item.safetyStock ? 'SAFE' : newCount <= 2 ? 'CRITICAL' : 'LOW';
          return {
            ...item,
            actualStock: newCount,
            totalValue: nextTotal,
            status: nextStatus,
          };
        }
        return item;
      })
    );
    showToast(`Đã xác nhận kiểm kê 4 mắt cho ${auditForm.sku}! Tồn kho đã được điều chỉnh về ${newCount}.`);
    setAuditModalOpen(false);
  };

  const totalInventoryValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = stockItems.filter((i) => i.status === 'LOW' || i.status === 'CRITICAL').length;

  const filteredItems = stockItems.filter((item) => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="w-full">
      {/* Toast Alert */}
      <AdminToast message={toastMsg} />

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1720px] mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Tồn Kho Nguyên Vật Liệu &amp; Nhập PO
            </h1>
            <p className="text-sm font-medium text-stone-600">
              Kiểm soát số lượng tồn kho theo thời gian thực, nghiệm thu đơn nhập và kiểm kê định kỳ
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setAuditModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 rounded-lg shadow-2xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <CheckSquare className="h-4 w-4 text-stone-600" />
              <span>Biên Bản Kiểm Kê (4 Mắt)</span>
            </button>
            <button
              onClick={() => setPoModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ops-brand hover:bg-ops-brand-dark text-white rounded-lg shadow-xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Truck className="h-4 w-4" />
              <span>+ Nghiệm Thu Hàng Nhập (PO)</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Tổng Giá Trị Kho Tồn"
            value={formatVND(totalInventoryValue)}
            subtext="Định giá theo phương pháp FIFO"
          />
          <KpiCard
            title="Cảnh Báo Chạm Ngưỡng An Toàn"
            value={<span className="text-rose-700">{lowStockCount} Mặt hàng</span>}
            badge={{ text: 'PO khẩn', variant: 'danger' }}
            subtext={<span className="text-rose-800 font-bold">Cần bổ sung đơn PO khẩn</span>}
          />
          <KpiCard
            title="Vòng Quay Tồn Kho (ITR)"
            value="4.2 Lượt / Tháng"
            badge={{ text: 'Tốt', variant: 'success' }}
            subtext={<span className="text-emerald-700 font-bold">Tốc độ luân chuyển tốt</span>}
          />
          <KpiCard
            title="Sai Số Kiểm Kê Định Kỳ"
            value={<span className="text-emerald-700">0.08%</span>}
            badge={{ text: 'Chuẩn', variant: 'neutral' }}
            subtext="Dưới ngưỡng trần cho phép (0.5%)"
          />
        </div>

        {/* Filters & Table Container */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'all', label: 'Tất Cả' },
                  { id: 'cold', label: 'Kho Đông (-18°C)' },
                  { id: 'chill', label: 'Kho Mát (0-4°C)' },
                  { id: 'dry', label: 'Kho Khô' },
                  { id: 'wine', label: 'Hầm Rượu Vang' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm SKU, tên nguyên liệu, vị trí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-sans text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-ops-brand w-56 sm:w-64"
              />
            </div>
          </div>

          {/* Stock Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-stone-100 border-y border-stone-200 text-stone-700 font-mono text-xs uppercase">
                  <th className="py-3 px-3 font-bold">Mặt Hàng &amp; Quy Cách</th>
                  <th className="py-3 px-3 font-bold border-r border-stone-200">Vị Trí Lưu Kho</th>
                  <th className="py-3 px-3 text-right font-bold border-r border-stone-200">Tồn Thực Tế</th>
                  <th className="py-3 px-3 text-right font-bold border-r border-stone-200">Mức An Toàn</th>
                  <th className="py-3 px-3 text-right font-bold border-r border-stone-200">Đơn Giá Nhập</th>
                  <th className="py-3 px-3 text-right font-bold border-r border-stone-200">Tổng Giá Trị</th>
                  <th className="py-3 px-3 text-center font-bold">Trạng Thái</th>
                  <th className="py-3 px-3 text-center font-bold">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-border font-mono">
                {filteredItems.map((item) => (
                  <tr key={item.sku} className="hover:bg-ops-bg transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-ops-border shrink-0"
                        />
                        <div>
                          <strong className="text-ops-ink block">{item.name}</strong>
                          <span className="text-[11px] text-ops-muted">{item.specs}</span>
                          <span className="font-mono text-[10px] text-ops-brand font-semibold block pt-0.5">
                            {item.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-ops-muted border-r border-stone-200/60">{item.location}</td>
                    <td className="py-3 px-3 text-right font-bold text-ops-ink text-sm border-r border-stone-200/60">
                      {item.actualStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right text-stone-600 font-medium border-r border-stone-200/60">
                      {item.safetyStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right text-stone-700 font-semibold border-r border-stone-200/60">
                      {formatVND(item.costPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-stone-900 border-r border-stone-200/60">
                      {formatVND(item.totalValue)}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold border inline-block ${
                          item.status === 'SAFE'
                            ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
                            : item.status === 'LOW'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold animate-pulse'
                        }`}
                      >
                        {item.status === 'SAFE' ? 'AN TOÀN' : item.status === 'LOW' ? 'SẮP HẾT' : 'BÁO ĐỘNG'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setPoForm((prev) => ({ ...prev, sku: item.sku }));
                          setPoModalOpen(true);
                        }}
                        title={`Tạo đơn nhập hàng cho ${item.name}`}
                        className="p-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white border border-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Nghiệm Thu Nhập Kho (Inbound PO) */}
      {poModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nghiệm Thu Hàng Nhập Kho"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Nghiệm Thu Hàng Nhập Kho (PO)</h3>
              </div>
              <button
                onClick={() => setPoModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInboundPoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Mã Đơn Đặt Hàng PO *
                </label>
                <input
                  type="text"
                  required
                  value={poForm.poCode}
                  onChange={(e) => setPoForm({ ...poForm, poCode: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Mặt Hàng Nhập Kho
                </label>
                <select
                  value={poForm.sku}
                  onChange={(e) => setPoForm({ ...poForm, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                >
                  {stockItems.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Số Lượng Thực Nhận *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={poForm.qty}
                    onChange={(e) => setPoForm({ ...poForm, qty: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                    Nhiệt Độ Thùng Xe Lạnh (°C)
                  </label>
                  <input
                    type="text"
                    value={poForm.temp}
                    onChange={(e) => setPoForm({ ...poForm, temp: e.target.value })}
                    className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Nhà Cung Cấp
                </label>
                <input
                  type="text"
                  value={poForm.supplier}
                  onChange={(e) => setPoForm({ ...poForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setPoModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Xác Nhận & Tăng Tồn Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Biên Bản Kiểm Kê (4 Mắt) */}
      {auditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Biên Bản Kiểm Kê Định Kỳ"
          className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-ops-brand" />
                <h3 className="font-sans text-base font-bold text-ops-ink">Biên Bản Kiểm Kê Định Kỳ (4 Mắt)</h3>
              </div>
              <button
                onClick={() => setAuditModalOpen(false)}
                aria-label="Đóng modal"
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Mặt Hàng Cần Điều Chỉnh Số Lượng
                </label>
                <select
                  value={auditForm.sku}
                  onChange={(e) => setAuditForm({ ...auditForm, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold"
                >
                  {stockItems.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.name} (Tồn máy: {item.actualStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Số Lượng Đếm Thực Tế Trong Kho *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={auditForm.physicalCount}
                  onChange={(e) => setAuditForm({ ...auditForm, physicalCount: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Lý Do Sai Lệch &amp; Ghi Chú Hai Bên Ký Nháy *
                </label>
                <textarea
                  required
                  rows={2}
                  value={auditForm.reason}
                  onChange={(e) => setAuditForm({ ...auditForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg text-ops-ink focus:outline-none focus:border-ops-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
                <button
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-ops-border text-ops-muted text-xs font-mono uppercase rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Ký Duyệt & Đồng Bộ Tồn Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
