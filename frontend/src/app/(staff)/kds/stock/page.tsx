'use client';

import React, { useEffect, useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stockService, calculateYieldAndMax } from '../../../../lib/stockService';
import { StockItemWithStatus } from '../../../../types';
import {
  groupStockItems,
  getPortionDisplay,
  stockStatusLabel,
} from './stock-helpers';

export default function StockOverviewPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [items, setItems] = useState<StockItemWithStatus[]>([]);
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

  const groups = useMemo(() => groupStockItems(items), [items]);

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

  const renderDishCard = (item: StockItemWithStatus, isLarge: boolean = false) => {
    const isOut = item.status === 'out';
    const isLow = item.status === 'low';

    // Tính số ô phần
    const { filled, overflow } = getPortionDisplay(item.portions);

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
        className={`bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between transition-all ${
          isLarge ? 'md:p-6 md:border-[#D14B3A]/30 md:shadow-[0_2px_8px_rgba(209,75,58,0.08)]' : ''
        }`}
      >
        <div>
          {/* Header thẻ: Tên món + Chip trạng thái + Số phần lớn */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3
                  className={`font-bold text-[#141210] leading-snug ${
                    isLarge ? 'text-lg md:text-xl' : 'text-base md:text-lg'
                  }`}
                >
                  {item.name}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isOut
                      ? 'bg-[#D14B3A]/10 text-[#D14B3A] border border-[#D14B3A]/25'
                      : isLow
                      ? 'bg-[#D9A441]/15 text-[#D9A441] border border-[#D9A441]/30'
                      : 'bg-[#5F7F5E]/15 text-[#5F7F5E] border border-[#5F7F5E]/30'
                  }`}
                >
                  {stockStatusLabel(item.status)}
                </span>
              </div>
              {noteText && <p className="text-xs text-[#7A6A58] line-clamp-2">{noteText}</p>}
            </div>

            <div className="text-right shrink-0">
              <span
                className={`font-extrabold text-[#141210] tabular-nums ${
                  isLarge ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
                }`}
              >
                {item.portions}
              </span>
              <span className="text-xs text-[#7A6A58] ml-1">phần</span>
            </div>
          </div>

          {/* Thanh ô phần: Mỗi ô = 1 phần */}
          <div className="my-3.5 pt-2 border-t border-[#E9E4DC]/60">
            <div className="flex items-center justify-between text-[11px] text-[#7A6A58] mb-1.5 font-medium">
              <span>Mỗi ô = 1 phần</span>
              {overflow > 0 && (
                <span className="font-bold text-[#141210] tabular-nums">+{overflow}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isCellFilled = idx < filled;
                return (
                  <span
                    key={idx}
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-[3px] border transition-colors ${
                      isCellFilled
                        ? isOut
                          ? 'bg-[#E9E4DC] border-[#D5CEC4]'
                          : isLow
                          ? 'bg-[#D9A441] border-[#B8852B]'
                          : 'bg-[#5F7F5E] border-[#4A6449]'
                        : 'bg-[#FFFFFF] border-[#E9E4DC]'
                    }`}
                  />
                );
              })}
              {overflow > 0 && (
                <span className="text-xs font-bold text-[#7A6A58] ml-1 tabular-nums">
                  +{overflow}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-[#E9E4DC]">
          {isOut ? (
            <button
              type="button"
              onClick={() => router.push(`/kds/stock/prep?dishId=${item.id}`)}
              className="min-h-[48px] px-4 py-2.5 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-sm transition-all shadow-sm"
            >
              Mở bán lại
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push(`/kds/stock/prep?dishId=${item.id}`)}
                className="min-h-[48px] px-4 py-2.5 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-sm transition-all shadow-sm"
              >
                Nhập thêm phần
              </button>

              <button
                type="button"
                onClick={() => setSoldOutTarget(item)}
                className="min-h-[48px] px-3.5 py-2.5 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F6F4F0] active:scale-95 text-[#2B2118] border border-[#E9E4DC] font-semibold text-sm transition-all"
              >
                Báo hết món
              </button>
            </>
          )}

          <Link
            href={`/kds/waste?dishId=${item.id}`}
            className="min-h-[48px] px-3 py-2 rounded-[8px] bg-transparent hover:bg-[#F6F4F0] text-[#7A6A58] hover:text-[#141210] font-medium text-xs transition-colors flex items-center ml-auto"
          >
            Ghi hủy
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] p-4 md:p-6 pb-24 font-sans select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E9E4DC]">
        <div className="flex items-center gap-3">
          <Link
            href="/chef"
            className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F6F4F0] text-[#2B2118] transition-colors border border-[#E9E4DC] flex items-center justify-center font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            aria-label="Quay lại trang Bếp"
          >
            ← Bếp
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141210]">
              Tồn kho theo món
            </h1>
            <p className="text-xs text-[#7A6A58]">
              K1 · Tổng quan tồn kho & điều phối ca · {items.length} món đang bán
            </p>
          </div>
        </div>

        {/* Nút Kiểm đếm cuối ca trên desktop */}
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.push('/kds/stock/count');
            });
          }}
          className="hidden md:flex min-h-[48px] px-5 py-2.5 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-sm transition-all items-center gap-2 shadow-sm"
        >
          <span>Kiểm đếm cuối ca</span>
        </button>
      </div>

      {/* Nút Kiểm đếm cuối ca full-width trên mobile */}
      <div className="block md:hidden mb-6">
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.push('/kds/stock/count');
            });
          }}
          className="w-full min-h-[48px] py-3 px-4 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Kiểm đếm cuối ca</span>
        </button>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="py-12 text-center text-[#7A6A58] text-sm animate-pulse">
          Đang tải dữ liệu kho bếp...
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 rounded-[8px] bg-[#D14B3A]/10 border border-[#D14B3A]/30 text-[#D14B3A] text-sm">
          {error}
        </div>
      )}

      {/* Danh sách 3 nhóm món theo đúng ảnh mẫu */}
      {!loading && !error && items.length === 0 && (
        <div className="py-12 text-center text-[#7A6A58] text-sm">
          Không có món ăn nào trong kho bếp.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-8">
          {/* Nhóm 1: CẦN XỬ LÝ NGAY */}
          {groups.urgent.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D14B3A]" />
                <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-[#D14B3A]">
                  CẦN XỬ LÝ NGAY · {groups.urgent.length}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.urgent.map((item) => renderDishCard(item, true))}
              </div>
            </section>
          )}

          {/* Nhóm 2: THEO DÕI */}
          {groups.watch.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441]" />
                <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-[#D9A441]">
                  THEO DÕI · {groups.watch.length}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.watch.map((item) => renderDishCard(item, false))}
              </div>
            </section>
          )}

          {/* Nhóm 3: ỔN ĐỊNH */}
          {groups.stable.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5F7F5E]" />
                <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-[#5F7F5E]">
                  ỔN ĐỊNH · {groups.stable.length}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.stable.map((item) => renderDishCard(item, false))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal xác nhận báo hết món (nền sáng) */}
      {soldOutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#141210] mb-2">Xác nhận báo hết món?</h3>
            <p className="text-sm text-[#7A6A58] mb-4">
              Món <span className="font-bold text-[#141210]">{soldOutTarget.name}</span> đang còn{' '}
              <span className="font-bold text-[#D9A441]">{soldOutTarget.portions} phần</span>. Khi báo
              hết, POS và Order khách sẽ bị khóa món này ngay lập tức.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={submittingSoldOut}
                onClick={() => setSoldOutTarget(null)}
                className="min-h-[48px] px-4 py-2 rounded-[8px] bg-[#FFFFFF] border border-[#E9E4DC] text-[#2B2118] hover:bg-[#F6F4F0] text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submittingSoldOut}
                onClick={handleMarkSoldOut}
                className="min-h-[48px] px-4 py-2 rounded-[8px] bg-[#D14B3A] text-white text-sm font-bold active:scale-95 hover:bg-[#B53C2D] transition-colors disabled:opacity-50"
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
