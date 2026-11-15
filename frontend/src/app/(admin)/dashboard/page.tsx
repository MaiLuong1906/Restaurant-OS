'use client';

import { formatVND } from '@/lib/utils';
import { ArrowLeft, TrendingUp, AlertTriangle, Package, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumThreshold: number;
  costPerUnit: number; // VND
  status: 'SAFE' | 'LOW' | 'CRITICAL';
}

const INVENTORY_DATA: InventoryItem[] = [
  { id: '1', name: 'Thịt Bò Tái Nạm Đắk Lắk', unit: 'kg', currentStock: 4.5, minimumThreshold: 8.0, costPerUnit: 220000, status: 'CRITICAL' },
  { id: '2', name: 'Bánh Phở Tươi', unit: 'kg', currentStock: 12.0, minimumThreshold: 10.0, costPerUnit: 25000, status: 'SAFE' },
  { id: '3', name: 'Hạt Cà Phê Robusta', unit: 'kg', currentStock: 3.2, minimumThreshold: 5.0, costPerUnit: 180000, status: 'LOW' },
  { id: '4', name: 'Mãng Cầu Xiêm Tươi', unit: 'kg', currentStock: 8.0, minimumThreshold: 4.0, costPerUnit: 60000, status: 'SAFE' },
  { id: '5', name: 'Sả Cây Tươi', unit: 'kg', currentStock: 1.5, minimumThreshold: 3.0, costPerUnit: 30000, status: 'LOW' },
];

export default function AdminDashboardPage() {
  const totalRevenueToday = 14250000; // 14.25 triệu VND
  const totalOrdersToday = 84;
  const criticalItems = INVENTORY_DATA.filter((i) => i.status === 'CRITICAL' || i.status === 'LOW');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white">BẢNG QUẢN TRỊ & ĐỊNH LƯỢNG KHO (BOM)</h1>
            <p className="text-xs text-slate-400">Kiểm soát hao hụt & Giám sát vận hành nhà hàng</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Doanh thu hôm nay</p>
              <h3 className="text-xl font-black text-orange-400 mt-1">{formatVND(totalRevenueToday)}</h3>
              <span className="text-[11px] text-emerald-400 font-medium">+14.2% so với hôm qua</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-600/10 text-orange-400 flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Tổng đơn hàng</p>
              <h3 className="text-xl font-black text-white mt-1">{totalOrdersToday} đơn</h3>
              <span className="text-[11px] text-slate-400">Trung bình 170.000 đ/đơn</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Cảnh báo nguyên liệu</p>
              <h3 className="text-xl font-black text-red-400 mt-1">{criticalItems.length} mặt hàng</h3>
              <span className="text-[11px] text-red-400">Cần nhập thêm trước ca tối</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-600/10 text-red-400 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Độ trễ KDS trung bình</p>
              <h3 className="text-xl font-black text-emerald-400 mt-1">28 ms</h3>
              <span className="text-[11px] text-emerald-400">STOMP over WebSocket</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Inventory BOM Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-400" />
              <h2 className="font-bold text-white text-base">Quản Lý Tồn Kho & Tự Động Trừ Nguyên Liệu (BOM)</h2>
            </div>
            <span className="text-xs text-slate-400">Tự động trừ kho mỗi khi đơn KDS chuyển sang READY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Tên nguyên liệu</th>
                  <th className="p-4">Tồn kho hiện tại</th>
                  <th className="p-4">Ngưỡng an toàn</th>
                  <th className="p-4">Giá vốn nhập</th>
                  <th className="p-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {INVENTORY_DATA.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white">{item.name}</td>
                    <td className="p-4 font-bold text-slate-200">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="p-4 text-slate-400">
                      {item.minimumThreshold} {item.unit}
                    </td>
                    <td className="p-4 font-medium text-slate-300">
                      {formatVND(item.costPerUnit)} / {item.unit}
                    </td>
                    <td className="p-4">
                      {item.status === 'CRITICAL' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Báo Động Thiếu
                        </span>
                      )}
                      {item.status === 'LOW' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Cận Ngưỡng
                        </span>
                      )}
                      {item.status === 'SAFE' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          An Toàn
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
