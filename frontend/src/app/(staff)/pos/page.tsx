'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { formatVND } from '@/lib/utils';
import { CreditCard, QrCode, ArrowLeft, CheckCircle2, UserCheck, Receipt, DollarSign, Box, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { FloorMap2D } from '@/components/pos/FloorMap2D';
import { isWebGLAvailable } from '@/components/3d/isWebGLAvailable';

const FloorMap3D = dynamic(() => import('@/components/3d/FloorMap3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] sm:h-[480px] rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Đang tải sơ đồ bàn 3D...</span>
      </div>
    </div>
  ),
});

interface PosTable {
  id: string;
  number: string;
  capacity: number;
  status: 'IDLE' | 'OCCUPIED' | 'BILLING';
  currentTotal: number;
  itemCount: number;
}

const TABLES_DATA: PosTable[] = [
  { id: '1', number: 'Bàn 01', capacity: 4, status: 'OCCUPIED', currentTotal: 250000, itemCount: 4 },
  { id: '2', number: 'Bàn 02', capacity: 2, status: 'IDLE', currentTotal: 0, itemCount: 0 },
  { id: '3', number: 'Bàn 03', capacity: 6, status: 'BILLING', currentTotal: 580000, itemCount: 8 },
  { id: '4', number: 'Bàn 04', capacity: 4, status: 'OCCUPIED', currentTotal: 175000, itemCount: 3 },
  { id: '5', number: 'Bàn 05', capacity: 8, status: 'IDLE', currentTotal: 0, itemCount: 0 },
  { id: '6', number: 'Bàn 06', capacity: 2, status: 'IDLE', currentTotal: 0, itemCount: 0 },
];

export default function PosCashierPage() {
  const [tables, setTables] = useState<PosTable[]>(TABLES_DATA);
  const [selectedTable, setSelectedTable] = useState<PosTable>(TABLES_DATA[0]);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const isWgl = isWebGLAvailable();
    setWebGlSupported(isWgl);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    if (!isWgl || mediaQuery.matches) {
      setViewMode('2D');
    }
  }, []);

  const handleCheckout = () => {
    setPaidSuccess(true);
    setTimeout(() => {
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTable.id ? { ...t, status: 'IDLE', currentTotal: 0, itemCount: 0 } : t))
      );
      setSelectedTable((prev) => ({ ...prev, status: 'IDLE', currentTotal: 0, itemCount: 0 }));
      setPaidSuccess(false);
    }, 1500);
  };

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
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">QUẦY THU NGÂN POS</h1>
              <p className="text-xs text-slate-400">Sơ đồ bàn ăn & Thanh toán đa kênh</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-slate-400">Bàn trống</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-md bg-amber-500/20 border border-amber-500/40" />
            <span className="text-slate-400">Đang dùng bữa</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-md bg-red-500/20 border border-red-500/40" />
            <span className="text-slate-400">Chờ thanh toán / Trễ SLA</span>
          </div>
        </div>
      </header>

      {/* Main Content: Bàn ăn bên trái | Hóa đơn bên phải */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Table Map (2 cols) */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              <span>Sơ Đồ Bàn Khu Vực Tầng 1</span>
            </h2>

            {webGlSupported && !reduceMotion && (
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('3D')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    viewMode === '3D'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>Sơ đồ 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2D')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    viewMode === '2D'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Lưới 2D</span>
                </button>
              </div>
            )}
          </div>

          {viewMode === '3D' && webGlSupported && !reduceMotion ? (
            <FloorMap3D
              tables={tables}
              selectedTableId={selectedTable.id}
              onSelectTable={(table) => setSelectedTable(table as PosTable)}
            />
          ) : (
            <FloorMap2D
              tables={tables}
              selectedTableId={selectedTable.id}
              onSelectTable={(table) => setSelectedTable(table as PosTable)}
              reduceMotion={reduceMotion}
            />
          )}
        </div>

        {/* Invoice & Payment Panel */}
        <div className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-6 justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Hóa Đơn {selectedTable.number}</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {selectedTable.status}
              </span>
            </div>

            {selectedTable.currentTotal > 0 ? (
              <div className="py-6 space-y-4">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Tạm tính ({selectedTable.itemCount} món):</span>
                  <span className="text-white font-medium">{formatVND(selectedTable.currentTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Thuế VAT (8%):</span>
                  <span className="text-white font-medium">{formatVND(Math.round(selectedTable.currentTotal * 0.08))}</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">Tổng cộng:</span>
                  <span className="text-2xl font-black text-orange-400">
                    {formatVND(Math.round(selectedTable.currentTotal * 1.08))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">
                <p>Bàn này hiện chưa có món gọi</p>
              </div>
            )}
          </div>

          {selectedTable.currentTotal > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              {paidSuccess ? (
                <div className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Đã thanh toán thành công!</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 active:scale-98 transition-transform"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Quét Mã VietQR / MoMo</span>
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Thanh Toán Tiền Mặt</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
