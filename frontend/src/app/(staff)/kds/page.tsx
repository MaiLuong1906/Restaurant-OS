'use client';

import { useState } from 'react';
import { ChefHat, Clock, Flame, CheckCircle2, RotateCcw, ArrowLeft, Layers } from 'lucide-react';
import Link from 'next/link';

interface KdsItem {
  id: string;
  orderId: string;
  tableNumber: string;
  dishName: string;
  quantity: number;
  modifiers: string[];
  status: 'WAITING' | 'COOKING' | 'READY';
  elapsedMinutes: number;
}

const INITIAL_KDS_ITEMS: KdsItem[] = [
  {
    id: 'kds-1',
    orderId: 'ORD-101',
    tableNumber: 'Bàn 01',
    dishName: 'Phở Bò Đặc Biệt',
    quantity: 2,
    modifiers: ['Nhiều nạm gầu', 'Hành chần riêng'],
    status: 'WAITING',
    elapsedMinutes: 4,
  },
  {
    id: 'kds-2',
    orderId: 'ORD-102',
    tableNumber: 'Bàn 03',
    dishName: 'Bún Chả Hà Nội',
    quantity: 1,
    modifiers: ['Không ớt cay'],
    status: 'WAITING',
    elapsedMinutes: 12,
  },
  {
    id: 'kds-3',
    orderId: 'ORD-103',
    tableNumber: 'Bàn 02',
    dishName: 'Phở Bò Đặc Biệt',
    quantity: 1,
    modifiers: [],
    status: 'COOKING',
    elapsedMinutes: 8,
  },
  {
    id: 'kds-4',
    orderId: 'ORD-100',
    tableNumber: 'Bàn 04',
    dishName: 'Nem Lụi Nướng Sả',
    quantity: 2,
    modifiers: ['Thêm nước chấm'],
    status: 'READY',
    elapsedMinutes: 16,
  },
];

export default function KitchenDisplayScreen() {
  const [items, setItems] = useState<KdsItem[]>(INITIAL_KDS_ITEMS);
  const [viewMode, setViewMode] = useState<'COLUMNS' | 'BATCH'>('COLUMNS');

  const updateStatus = (itemId: string, newStatus: 'WAITING' | 'COOKING' | 'READY') => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it))
    );
  };

  const waitingItems = items.filter((i) => i.status === 'WAITING');
  const cookingItems = items.filter((i) => i.status === 'COOKING');
  const readyItems = items.filter((i) => i.status === 'READY');

  // Dish Batching Summary: gom các món giống nhau để đầu bếp nấu hàng loạt
  const batchedWaiting = waitingItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.dishName] = (acc[item.dishName] || 0) + item.quantity;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#F1F5F9] flex flex-col font-sans select-none">
      {/* KDS Header */}
      <header className="h-16 px-6 bg-[#121820] border-b border-[#263342] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="h-10 w-10 rounded-xl bg-[#1A222D] border border-[#263342] flex items-center justify-center text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
                <span>MÀN HÌNH BẾP KDS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REALTIME &lt;50ms
                </span>
              </h1>
              <p className="text-xs text-slate-400">Trạm Chế Biến Tổng Bếp Nóng & Bếp Lạnh</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Switch View Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'COLUMNS' ? 'BATCH' : 'COLUMNS')}
            className="h-11 px-4 rounded-xl bg-[#1A222D] border border-[#263342] hover:bg-[#263342] text-xs font-semibold flex items-center space-x-2 text-slate-200 transition-colors"
          >
            <Layers className="h-4 w-4 text-orange-400" />
            <span>{viewMode === 'COLUMNS' ? 'Xem Gom Món (Batching)' : 'Xem Theo Cột Tiến Độ'}</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#1A222D] border border-[#263342]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">STOMP: Connected</span>
          </div>
        </div>
      </header>

      {/* Dish Batching Bar (Gom món nhanh) */}
      <div className="px-6 py-2.5 bg-[#161E28] border-b border-[#263342] flex items-center space-x-3 overflow-x-auto">
        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center space-x-1 flex-shrink-0">
          <Flame className="h-3.5 w-3.5" />
          <span>Tổng chờ nấu:</span>
        </span>
        {Object.entries(batchedWaiting).map(([name, qty]) => (
          <div
            key={name}
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-[#1A222D] border border-[#263342] flex items-center space-x-2 text-xs"
          >
            <span className="font-semibold text-slate-200">{name}:</span>
            <span className="h-5 min-w-[20px] px-1.5 rounded-md bg-orange-600 text-white font-extrabold flex items-center justify-center">
              {qty}
            </span>
          </div>
        ))}
        {Object.keys(batchedWaiting).length === 0 && (
          <span className="text-xs text-slate-500 italic">Không có món tồn đọng trong hàng đợi</span>
        )}
      </div>

      {/* 3 Columns Layout: Chờ nấu | Đang nấu | Sẵn sàng */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Cột 1: Chờ nấu */}
        <div className="flex flex-col rounded-2xl bg-[#121820] border border-[#263342] overflow-hidden">
          <div className="p-4 border-b border-[#263342] bg-[#161E28] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <h2 className="font-bold text-sm text-slate-100">CHỜ NẤU (WAITING)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs">
              {waitingItems.length}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {waitingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#1A222D] border border-[#263342] shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-extrabold text-xs">
                      {item.tableNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center space-x-1 ${
                        item.elapsedMinutes > 10 ? 'text-red-400 animate-pulse' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.elapsedMinutes} phút</span>
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-black text-white">{item.quantity}x</span>
                    <span className="text-base font-bold text-slate-100">{item.dishName}</span>
                  </div>

                  {item.modifiers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.modifiers.map((m, idx) => (
                        <p key={idx} className="text-xs text-amber-300 font-medium">
                          &bull; {m}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Touch Target >= 48px chuẩn Rule 04 */}
                <button
                  onClick={() => updateStatus(item.id, 'COOKING')}
                  className="mt-4 h-12 w-full rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-sm text-white flex items-center justify-center space-x-2 shadow-lg shadow-orange-600/30 active:scale-98 transition-transform"
                >
                  <Flame className="h-5 w-5" />
                  <span>Bắt Đầu Nấu</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 2: Đang nấu */}
        <div className="flex flex-col rounded-2xl bg-[#121820] border border-[#263342] overflow-hidden">
          <div className="p-4 border-b border-[#263342] bg-[#161E28] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="font-bold text-sm text-slate-100">ĐANG NẤU (COOKING)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold text-xs">
              {cookingItems.length}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {cookingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#1A222D] border border-blue-500/40 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-extrabold text-xs">
                      {item.tableNumber}
                    </span>
                    <span className="text-xs font-semibold text-blue-400 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.elapsedMinutes} phút</span>
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-black text-white">{item.quantity}x</span>
                    <span className="text-base font-bold text-slate-100">{item.dishName}</span>
                  </div>

                  {item.modifiers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.modifiers.map((m, idx) => (
                        <p key={idx} className="text-xs text-amber-300 font-medium">
                          &bull; {m}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Touch Target >= 48px */}
                <button
                  onClick={() => updateStatus(item.id, 'READY')}
                  className="mt-4 h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-transform"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Xong & Ra Bàn</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 3: Sẵn sàng phục vụ */}
        <div className="flex flex-col rounded-2xl bg-[#121820] border border-[#263342] overflow-hidden">
          <div className="p-4 border-b border-[#263342] bg-[#161E28] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-sm text-slate-100">SẴN SÀNG (READY)</h2>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              {readyItems.length}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {readyItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#1A222D] border border-emerald-500/40 shadow-lg flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                      {item.tableNumber}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      Sẵn sàng bưng món
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-black text-white">{item.quantity}x</span>
                    <span className="text-base font-bold text-slate-100">{item.dishName}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => updateStatus(item.id, 'COOKING')}
                    className="h-10 px-3 rounded-xl bg-[#263342] hover:bg-[#324357] text-xs font-semibold text-slate-300 flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Nấu lại</span>
                  </button>
                  <button
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="h-10 flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center"
                  >
                    Đã Bưng Xong
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
