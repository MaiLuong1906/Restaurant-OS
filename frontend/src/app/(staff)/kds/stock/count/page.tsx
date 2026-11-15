'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stockService } from '../../../../../lib/stockService';
import { StockItemWithStatus, RecordStockCountResult } from '../../../../../types';
import {
  computeCountDiff,
  getCountDiffBadge,
  isValidCountedInput,
  hasMissingCountReasons,
  summarizeStockCount,
  CountRow,
} from '../stock-helpers';

export default function StockCountPage() {
  const router = useRouter();

  const [items, setItems] = useState<StockItemWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States kiểm đếm theo từng món
  const [countedMap, setCountedMap] = useState<Record<string, number | string>>({});
  const [reasonsMap, setReasonsMap] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<RecordStockCountResult | null>(null);

  useEffect(() => {
    let active = true;
    stockService
      .getStockItems()
      .then((data: StockItemWithStatus[]) => {
        if (!active) return;
        setItems(data);

        // Điền sẵn số phần hệ thống vào countedMap
        const initialCounted: Record<string, number> = {};
        const initialReasons: Record<string, string> = {};
        for (const item of data) {
          initialCounted[item.id] = item.portions;
          initialReasons[item.id] = '';
        }
        setCountedMap(initialCounted);
        setReasonsMap(initialReasons);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Lỗi tải danh sách món');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Chuyển đổi thành CountRow array để kiểm tra logic
  const countRows: CountRow[] = useMemo(() => {
    return items.map((item) => {
      const rawCount = countedMap[item.id];
      const countedPortions = isValidCountedInput(rawCount) ? Number(rawCount) : 0;
      const diff = computeCountDiff(countedPortions, item.portions);
      const reason = reasonsMap[item.id] || '';

      return {
        dishId: item.id,
        dishName: item.name,
        systemPortions: item.portions,
        countedPortions,
        diff,
        reason,
      };
    });
  }, [items, countedMap, reasonsMap]);

  // Kiểm tra tính hợp lệ
  const hasInvalidInput = useMemo(() => {
    return items.some((item) => !isValidCountedInput(countedMap[item.id]));
  }, [items, countedMap]);

  const hasMissingReason = useMemo(() => {
    return hasMissingCountReasons(countRows);
  }, [countRows]);

  const summary = useMemo(() => {
    return summarizeStockCount(countRows);
  }, [countRows]);

  const isSubmitDisabled =
    submitting || items.length === 0 || hasInvalidInput || hasMissingReason;

  const handleCountChange = (dishId: string, val: string) => {
    setCountedMap((prev) => ({
      ...prev,
      [dishId]: val === '' ? '' : parseInt(val, 10),
    }));
  };

  const handleReasonChange = (dishId: string, val: string) => {
    setReasonsMap((prev) => ({
      ...prev,
      [dishId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setSubmitting(true);
    setError(null);

    const counts: Record<string, number> = {};
    const reasons: Record<string, string> = {};

    for (const row of countRows) {
      counts[row.dishId] = row.countedPortions;
      if (row.diff !== 0) {
        reasons[row.dishId] = row.reason.trim();
      }
    }

    try {
      const res = await stockService.recordStockCount(counts, reasons);
      setSubmitResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi ghi nhận kiểm đếm';
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] p-4 md:p-6 pb-24 font-sans select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#E9E4DC]">
        <div className="flex items-center gap-3">
          <Link
            href="/kds/stock"
            className="min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F6F4F0] active:scale-95 text-[#2B2118] transition-colors border border-[#E9E4DC] flex items-center justify-center font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            aria-label="Quay lại Tồn kho"
          >
            ← Tồn kho
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141210]">
              Kiểm đếm cuối ca
            </h1>
            <p className="text-xs text-[#7A6A58]">
              K3 · Đối chiếu số phần hệ thống & thực tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-[8px] font-semibold bg-[#FFFFFF] border border-[#E9E4DC] text-[#7A6A58] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            Ca tối · Bếp chính
          </span>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-[#7A6A58] text-sm animate-pulse">
          Đang tải dữ liệu kiểm đếm...
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 rounded-[8px] bg-[#D14B3A]/10 border border-[#D14B3A]/30 text-[#D14B3A] text-sm">
          {error}
        </div>
      )}

      {/* Màn hình kết quả thành công */}
      {submitResult && (
        <div className="max-w-xl mx-auto bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-6 text-center space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-fade-in">
          <div className="w-16 h-16 bg-[#5F7F5E]/15 text-[#5F7F5E] rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#141210]">Đã ghi nhận kiểm đếm!</h2>
            <p className="text-sm text-[#7A6A58] mt-1">
              Dữ liệu tồn kho thực tế đã được cập nhật vào hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-[#F6F4F0] rounded-[8px] border border-[#E9E4DC]">
            <div>
              <p className="text-xs text-[#7A6A58]">Tổng số món</p>
              <p className="text-xl font-bold text-[#141210] tabular-nums">{summary.total}</p>
            </div>
            <div>
              <p className="text-xs text-[#7A6A58]">Số món khớp</p>
              <p className="text-xl font-bold text-[#5F7F5E] tabular-nums">{summary.matched}</p>
            </div>
            <div>
              <p className="text-xs text-[#7A6A58]">Chênh lệch</p>
              <p
                className={`text-xl font-bold tabular-nums ${
                  summary.discrepant > 0 ? 'text-[#D9A441]' : 'text-[#7A6A58]'
                }`}
              >
                {summary.discrepant}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/kds/stock')}
            className="w-full min-h-[48px] px-6 py-3.5 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-base transition-all shadow-sm"
          >
            Quay về Tồn kho
          </button>
        </div>
      )}

      {/* Form kiểm đếm */}
      {!loading && !submitResult && items.length === 0 && (
        <div className="py-12 text-center text-[#7A6A58] text-sm">
          Không có món ăn nào trong kho để kiểm đếm.
        </div>
      )}

      {!loading && !submitResult && items.length > 0 && (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          {/* Hộp thông báo nghiệp vụ */}
          <div className="p-4 rounded-[8px] bg-[#FFFFFF] border border-[#E9E4DC] flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <span className="text-2xl">📦</span>
            <p className="text-xs md:text-sm text-[#7A6A58]">
              <span className="font-bold text-[#2B2118]">Phần thừa cuối ca:</span> chuyển sang ca sau nếu còn hạn dùng.
            </p>
          </div>

          {/* Danh sách đối chiếu từng món */}
          <div className="space-y-3">
            {countRows.map((row) => {
              const badge = getCountDiffBadge(row.diff);
              const hasDiff = row.diff !== 0;

              return (
                <div
                  key={row.dishId}
                  className={`p-4 md:p-5 rounded-[8px] border transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${
                    hasDiff
                      ? 'bg-[#FFFFFF] border-[#D9A441]/50'
                      : 'bg-[#FFFFFF] border-[#E9E4DC]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-[#141210]">
                        {row.dishName}
                      </h3>
                      <p className="text-xs text-[#7A6A58]">
                        Số phần hệ thống:{' '}
                        <span className="font-bold text-[#141210] tabular-nums">{row.systemPortions} phần</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`count-${row.dishId}`}
                          className="text-xs font-semibold text-[#7A6A58]"
                        >
                          Thực tế:
                        </label>
                        <input
                          id={`count-${row.dishId}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={countedMap[row.dishId] ?? ''}
                          onChange={(e) => handleCountChange(row.dishId, e.target.value)}
                          className="w-20 min-h-[48px] bg-[#FFFFFF] border border-[#E9E4DC] focus:border-[#8C1D2C] rounded-[8px] px-2 text-center text-lg font-extrabold text-[#141210] tabular-nums focus:outline-none"
                        />
                      </div>

                      {/* Badge chênh lệch */}
                      <span
                        className="text-xs px-3 py-1.5 rounded-full font-bold min-h-[32px] flex items-center justify-center border tabular-nums"
                        style={{
                          backgroundColor: `${badge.color}15`,
                          color: badge.color,
                          borderColor: `${badge.color}35`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Ô nhập lý do bắt buộc khi có chênh lệch */}
                  {hasDiff && (
                    <div className="pt-3 border-t border-[#E9E4DC]">
                      <label className="block text-xs font-semibold text-[#D14B3A] mb-1.5">
                        * Bắt buộc nhập lý do chênh lệch:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Rơi đổ lúc phục vụ, cháy hỏng, hao hụt sơ chế..."
                        value={reasonsMap[row.dishId] || ''}
                        onChange={(e) => handleReasonChange(row.dishId, e.target.value)}
                        className="w-full min-h-[48px] bg-[#F6F4F0] border border-[#E9E4DC] focus:border-[#8C1D2C] rounded-[8px] px-3.5 text-sm text-[#141210] placeholder-[#7A6A58]/60 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cảnh báo khi còn thiếu lý do */}
          {hasMissingReason && (
            <div className="p-3.5 rounded-[8px] bg-[#D14B3A]/10 border border-[#D14B3A]/30 text-[#D14B3A] text-xs md:text-sm font-medium">
              ⚠️ Vui lòng nhập lý do chênh lệch cho tất cả các món phát sinh thừa hoặc thiếu trước khi
              xác nhận.
            </div>
          )}

          {/* Nút xác nhận kiểm đếm */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? 'Đang ghi nhận kiểm đếm...' : 'Xác nhận kiểm đếm'}
          </button>
        </form>
      )}
    </div>
  );
}
