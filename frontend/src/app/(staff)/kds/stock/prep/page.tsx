'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { stockService, calculateYieldAndMax } from '../../../../../lib/stockService';
import { StockItemWithStatus } from '../../../../../types';
import { validatePrepQuantity } from '../stock-helpers';

function StockPrepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDishId = searchParams.get('dishId');

  const [items, setItems] = useState<StockItemWithStatus[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [rawKg, setRawKg] = useState<number>(100);
  const [preppedKg, setPreppedKg] = useState<number>(72);
  const [addQuantity, setAddQuantity] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    stockService
      .getStockItems()
      .then((data: StockItemWithStatus[]) => {
        if (!active) return;
        setItems(data);
        if (data.length > 0) {
          const match = initialDishId && data.find((d: StockItemWithStatus) => d.id === initialDishId);
          const defaultItem = match || data[0];
          setSelectedId(defaultItem.id);

          if (defaultItem.bom) {
            setRawKg(defaultItem.bom.rawKg);
            setPreppedKg(defaultItem.bom.preppedKg);
          }
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi tải danh sách món');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialDishId]);

  const selectedDish = useMemo(() => {
    return items.find((i) => i.id === selectedId) || null;
  }, [items, selectedId]);

  const handleSelectDish = (dish: StockItemWithStatus) => {
    setSelectedId(dish.id);
    setAddQuantity(1);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (dish.bom) {
      setRawKg(dish.bom.rawKg);
      setPreppedKg(dish.bom.preppedKg);
    }
  };

  // Tính Yield % và Số phần tối đa
  const bomCalculation = useMemo(() => {
    if (!selectedDish?.bom) return null;
    try {
      if (rawKg <= 0 || preppedKg < 0) {
        return { error: 'Số kg phải là số dương hợp lệ', yieldPercent: 0, maxPortions: 0 };
      }
      const calc = calculateYieldAndMax(rawKg, preppedKg, selectedDish.bom.grams);
      return { ...calc, error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : 'Thông số sơ chế không hợp lệ',
        yieldPercent: 0,
        maxPortions: 0,
      };
    }
  }, [selectedDish, rawKg, preppedKg]);

  const maxPortions = bomCalculation?.maxPortions ?? null;

  // Validation
  const validationError = useMemo(() => {
    if (!selectedDish) return 'Chưa chọn món';
    if (bomCalculation?.error) return bomCalculation.error;
    return validatePrepQuantity(selectedDish.portions, addQuantity, maxPortions);
  }, [selectedDish, bomCalculation, addQuantity, maxPortions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDish || validationError) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (selectedDish.bom) {
        await stockService.addPortions(selectedDish.id, addQuantity, preppedKg, rawKg);
      } else {
        await stockService.addPortions(selectedDish.id, addQuantity);
      }

      setSuccessMsg(`Đã nhập thêm ${addQuantity} phần cho món "${selectedDish.name}" thành công!`);
      setTimeout(() => {
        router.push('/kds/stock');
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi nhập thêm phần';
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3] p-4 md:p-6 pb-24 font-sans select-none">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#212C37]">
        <button
          type="button"
          onClick={() => router.push('/kds/stock')}
          className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-lg bg-[#151D24] hover:bg-[#1C2630] active:scale-95 text-[#8B949E] hover:text-[#E6EDF3] transition-colors border border-[#212C37] flex items-center justify-center font-medium"
          aria-label="Quay lại danh sách Tồn kho"
        >
          ← Kho
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#E6EDF3]">
            Nhập phần sơ chế
          </h1>
          <p className="text-xs text-[#8B949E]">K2 — Cập nhật số lượng sau sơ chế đầu/giữa ca</p>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-[#8B949E] text-sm animate-pulse">
          Đang tải thông tin món ăn...
        </div>
      )}

      {!loading && (
        <div className="max-w-2xl mx-auto">
          {/* Dish Selector Chips */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
              Chọn món nhập thêm:
            </label>
            <div className="flex flex-wrap gap-2">
              {items.map((dish) => {
                const isSelected = dish.id === selectedId;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleSelectDish(dish)}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 border ${
                      isSelected
                        ? 'bg-[#10B981] text-[#0B0F14] border-[#10B981] font-bold shadow-lg shadow-[#10B981]/20'
                        : 'bg-[#151D24] text-[#8B949E] border-[#212C37] hover:text-[#E6EDF3]'
                    }`}
                  >
                    <span>{dish.name}</span>
                    <span className="ml-1.5 opacity-80 text-xs">({dish.portions} p)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDish && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dish info card */}
              <div className="bg-[#151D24] p-4 rounded-xl border border-[#212C37] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#E6EDF3]">{selectedDish.name}</h2>
                  <p className="text-xs text-[#8B949E]">
                    Tồn kho hiện tại:{' '}
                    <span className="font-bold text-[#E6EDF3]">{selectedDish.portions} phần</span>
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    selectedDish.status === 'out'
                      ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                      : selectedDish.status === 'low'
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                  }`}
                >
                  {selectedDish.status === 'out'
                    ? 'Hết món'
                    : selectedDish.status === 'low'
                    ? 'Sắp hết'
                    : 'Còn'}
                </span>
              </div>

              {/* BOM Block (nếu có định mức) */}
              {selectedDish.bom ? (
                <div className="bg-[#151D24] p-4 md:p-5 rounded-xl border border-[#212C37] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#212C37]/80">
                    <h3 className="text-sm font-bold text-[#E6EDF3] flex items-center gap-2">
                      <span>🥩</span>
                      <span>Định mức sơ chế (BOM §27 v2)</span>
                    </h3>
                    <span className="text-xs text-[#8B949E]">
                      Định lượng: {selectedDish.bom.grams} g/phần
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8B949E] mb-1.5 font-medium">
                        Kg sống nhập vào:
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={rawKg}
                        onChange={(e) => setRawKg(parseFloat(e.target.value) || 0)}
                        className="w-full min-h-[48px] bg-[#1C2630] border border-[#212C37] rounded-lg px-3 text-[#E6EDF3] text-base font-semibold focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#8B949E] mb-1.5 font-medium">
                        Kg đã lọc (sau sơ chế):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={preppedKg}
                        onChange={(e) => setPreppedKg(parseFloat(e.target.value) || 0)}
                        className="w-full min-h-[48px] bg-[#1C2630] border border-[#212C37] rounded-lg px-3 text-[#E6EDF3] text-base font-semibold focus:outline-none focus:border-[#10B981]"
                      />
                    </div>
                  </div>

                  {/* Calculated metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#1C2630] p-3 rounded-lg border border-[#212C37]">
                      <p className="text-xs text-[#8B949E]">Yield (Tỉ lệ hao hụt)</p>
                      <p className="text-xl font-extrabold text-[#F59E0B]">
                        {bomCalculation?.yieldPercent ?? 0}%
                      </p>
                    </div>

                    <div className="bg-[#1C2630] p-3 rounded-lg border border-[#212C37]">
                      <p className="text-xs text-[#8B949E]">Số phần tối đa</p>
                      <p className="text-xl font-extrabold text-[#10B981]">
                        {bomCalculation?.maxPortions ?? 0} phần
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#151D24] p-4 rounded-xl border border-[#212C37] text-xs text-[#8B949E]">
                  ℹ️ Món chưa có định mức — nhập trực tiếp số phần
                </div>
              )}

              {/* Stepper nhập số phần */}
              <div className="bg-[#151D24] p-4 md:p-5 rounded-xl border border-[#212C37]">
                <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                  Số phần nhập thêm vào kho:
                </label>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={addQuantity <= 1}
                    onClick={() => setAddQuantity((q) => Math.max(1, q - 1))}
                    className="min-h-[48px] min-w-[48px] w-12 h-12 rounded-xl bg-[#1C2630] hover:bg-[#253240] active:scale-95 text-[#E6EDF3] text-xl font-black disabled:opacity-40 disabled:cursor-not-allowed border border-[#212C37] flex items-center justify-center transition-colors"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAddQuantity(isNaN(val) ? 0 : val);
                    }}
                    className="min-h-[48px] w-28 text-center bg-[#1C2630] border border-[#212C37] rounded-xl text-2xl font-black text-[#E6EDF3] focus:outline-none focus:border-[#10B981]"
                  />

                  <button
                    type="button"
                    onClick={() => setAddQuantity((q) => q + 1)}
                    className="min-h-[48px] min-w-[48px] w-12 h-12 rounded-xl bg-[#1C2630] hover:bg-[#253240] active:scale-95 text-[#E6EDF3] text-xl font-black border border-[#212C37] flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Validation message */}
                {validationError && (
                  <p className="mt-3 text-xs md:text-sm text-[#EF4444] text-center font-medium bg-[#EF4444]/10 p-2.5 rounded-lg border border-[#EF4444]/30">
                    ⚠️ {validationError}
                  </p>
                )}
              </div>

              {/* Status alerts */}
              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-sm">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-sm font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || Boolean(validationError)}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#10B981] hover:bg-[#0EA5E9] active:scale-95 text-[#0B0F14] font-black text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#10B981]/10"
              >
                {submitting ? 'Đang lưu vào kho...' : 'Xác nhận nhập phần'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function StockPrepPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] text-[#8B949E] p-6 flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <StockPrepContent />
    </Suspense>
  );
}
