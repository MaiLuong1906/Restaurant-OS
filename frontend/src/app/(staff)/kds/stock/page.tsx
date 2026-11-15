'use client';

import React, { useEffect, useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stockService, calculateYieldAndMax } from '../../../../lib/stockService';
import { StockItemWithStatus } from '../../../../types';
import {
  StockFilter,
  sortStockItems,
  filterStockItems,
  getStockSummary,
  stockStatusLabel,
} from './stock-helpers';

export default function StockOverviewPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [items, setItems] = useState<StockItemWithStatus[]>([]);
  const [filter, setFilter] = useState<StockFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal xác nhận hết món
  const [soldOutTarget, setSoldOutTarget] = useState<StockItemWithStatus | null>(null);
  const [submittingSoldOut, setSubmittingSoldOut] = useState(false);

  const loadStock = async () => {
    try {
      setError(null);
      const data = await stockService.getStockItems();
      setItems(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu kho bếp';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const summary = useMemo(() => getStockSummary(items), [items]);

  const displayedItems = useMemo(() => {
    const filtered = filterStockItems(items, filter);
    return sortStockItems(filtered);
  }, [items, filter]);

  const handleMarkSoldOut = async () => {
    if (!soldOutTarget) return;
    setSubmittingSoldOut(true);
    try {
      await stockService.markSoldOut(soldOutTarget.id);
      setSoldOutTarget(null);
      await loadStock();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi báo hết món';
      alert(msg);
    } finally {
      setSubmittingSoldOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3] p-4 md:p-6 pb-24 font-sans select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#212C37]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/chef')}
            className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-lg bg-[#151D24] hover:bg-[#1C2630] active:scale-95 text-[#8B949E] hover:text-[#E6EDF3] transition-colors border border-[#212C37] flex items-center justify-center font-medium"
            aria-label="Quay lại trang Bếp"
          >
            ← Bếp
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#E6EDF3]">
              Tồn kho theo món
            </h1>
            <p className="text-xs text-[#8B949E]">K1 — Tổng quan tồn kho & điều phối ca</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.push('/kds/stock/count');
            });
          }}
          className="min-h-[48px] px-4 py-2 rounded-lg bg-[#1C2630] hover:bg-[#253240] active:scale-95 text-[#F59E0B] border border-[#F59E0B]/30 hover:border-[#F59E0B] font-semibold text-sm transition-all flex items-center gap-2"
        >
          <span>📋</span>
          <span>Kiểm đếm cuối ca</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-[#151D24] p-3 md:p-4 rounded-xl border border-[#212C37]">
          <p className="text-xs md:text-sm text-[#8B949E] mb-1">Món đang bán</p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#10B981]">{summary.total}</p>
        </div>
        <div className="bg-[#151D24] p-3 md:p-4 rounded-xl border border-[#212C37]">
          <p className="text-xs md:text-sm text-[#8B949E] mb-1">Sắp hết (≤ 3)</p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#F59E0B]">{summary.lowCount}</p>
        </div>
        <div className="bg-[#151D24] p-3 md:p-4 rounded-xl border border-[#212C37]">
          <p className="text-xs md:text-sm text-[#8B949E] mb-1">Hết món</p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#EF4444]">{summary.outCount}</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-[48px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
            filter === 'all'
              ? 'bg-[#E6EDF3] text-[#0B0F14]'
              : 'bg-[#151D24] text-[#8B949E] hover:text-[#E6EDF3] border border-[#212C37]'
          }`}
        >
          Tất cả ({summary.total})
        </button>
        <button
          type="button"
          onClick={() => setFilter('low')}
          className={`min-h-[48px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
            filter === 'low'
              ? 'bg-[#F59E0B] text-[#0B0F14]'
              : 'bg-[#151D24] text-[#8B949E] hover:text-[#E6EDF3] border border-[#212C37]'
          }`}
        >
          Sắp hết (≤ 3 phần) ({summary.lowCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('out')}
          className={`min-h-[48px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
            filter === 'out'
              ? 'bg-[#EF4444] text-[#FFFFFF]'
              : 'bg-[#151D24] text-[#8B949E] hover:text-[#E6EDF3] border border-[#212C37]'
          }`}
        >
          Hết món ({summary.outCount})
        </button>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="py-12 text-center text-[#8B949E] text-sm animate-pulse">
          Đang tải dữ liệu kho bếp...
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm">
          {error}
        </div>
      )}

      {/* Dish List */}
      {!loading && !error && displayedItems.length === 0 && (
        <div className="py-12 text-center text-[#8B949E] text-sm">
          Không có món ăn nào trong bộ lọc này.
        </div>
      )}

      {!loading && !error && displayedItems.length > 0 && (
        <div className="space-y-3">
          {displayedItems.map((item) => {
            const isOut = item.status === 'out';
            const isLow = item.status === 'low';

            // Ghi chú định mức BOM nếu có
            let noteText = item.meta?.note || '';
            if (item.bom) {
              const { yieldPercent } = calculateYieldAndMax(
                item.bom.rawKg,
                item.bom.preppedKg,
                item.bom.grams
              );
              noteText = `Sườn đã lọc ${item.bom.preppedKg} kg · Yield ${yieldPercent}% · ${item.bom.grams} g/phần`;
            }

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isOut
                    ? 'bg-[#151D24]/60 border-[#EF4444]/40'
                    : isLow
                    ? 'bg-[#151D24] border-[#F59E0B]/40'
                    : 'bg-[#151D24] border-[#212C37]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base md:text-lg text-[#E6EDF3]">{item.name}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isOut
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                            : isLow
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                            : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                        }`}
                      >
                        {stockStatusLabel(item.status)}
                      </span>
                    </div>

                    {noteText && <p className="text-xs text-[#8B949E] mt-1">{noteText}</p>}
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-[#E6EDF3]">{item.portions}</span>
                    <span className="text-xs text-[#8B949E] ml-1">phần</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#212C37]/60">
                  {isOut ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/kds/stock/prep?dishId=${item.id}`)}
                      className="min-h-[48px] px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#0EA5E9] active:scale-95 text-[#0B0F14] font-bold text-sm transition-all"
                    >
                      Mở bán lại
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => router.push(`/kds/stock/prep?dishId=${item.id}`)}
                        className="min-h-[48px] px-4 py-2 rounded-lg bg-[#1C2630] hover:bg-[#253240] active:scale-95 text-[#E6EDF3] border border-[#212C37] font-semibold text-sm transition-all"
                      >
                        Nhập thêm phần
                      </button>

                      <button
                        type="button"
                        onClick={() => setSoldOutTarget(item)}
                        className="min-h-[48px] px-4 py-2 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 active:scale-95 text-[#EF4444] border border-[#EF4444]/30 font-semibold text-sm transition-all"
                      >
                        Báo hết món
                      </button>
                    </>
                  )}

                  <Link
                    href={`/kds/waste?dishId=${item.id}`}
                    className="min-h-[48px] px-3 py-2 rounded-lg bg-transparent hover:bg-[#1C2630] text-[#8B949E] hover:text-[#E6EDF3] font-medium text-xs transition-colors flex items-center ml-auto"
                  >
                    Ghi hủy
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal xác nhận báo hết món */}
      {soldOutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#151D24] border border-[#212C37] rounded-xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#E6EDF3] mb-2">Xác nhận báo hết món?</h3>
            <p className="text-sm text-[#8B949E] mb-4">
              Món <span className="font-bold text-[#E6EDF3]">{soldOutTarget.name}</span> đang còn{' '}
              <span className="font-bold text-[#F59E0B]">{soldOutTarget.portions} phần</span>. Khi báo
              hết, POS và Order khách sẽ bị khóa món này ngay lập tức.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={submittingSoldOut}
                onClick={() => setSoldOutTarget(null)}
                className="min-h-[48px] px-4 py-2 rounded-lg bg-[#1C2630] text-[#8B949E] hover:text-[#E6EDF3] text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submittingSoldOut}
                onClick={handleMarkSoldOut}
                className="min-h-[48px] px-4 py-2 rounded-lg bg-[#EF4444] text-white text-sm font-bold active:scale-95 hover:bg-[#DC2626] transition-colors disabled:opacity-50"
              >
                {submittingSoldOut ? 'Đang cập nhật...' : 'Xác nhận hết món'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
