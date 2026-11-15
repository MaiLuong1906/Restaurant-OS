'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { stockService, calculateYieldAndMax } from '../../../../../lib/stockService';
import { StockItemWithStatus } from '../../../../../types';
import { validatePrepQuantity, getPortionDisplay, stockStatusLabel } from '../stock-helpers';

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
  const [addQuantity, setAddQuantity] = useState<number>(10);

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
    setAddQuantity(10);
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

  // Tính số ô phần hiện tại và sau khi nhập
  const currentPortion = selectedDish ? selectedDish.portions : 0;
  const targetPortion = Math.max(0, currentPortion + (addQuantity || 0));
  const currentDisplay = getPortionDisplay(currentPortion);
  const targetDisplay = getPortionDisplay(targetPortion);

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#141210] p-4 md:p-6 pb-24 font-sans select-none">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#E9E4DC]">
        <Link
          href="/kds/stock"
          className="min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F6F4F0] active:scale-95 text-[#2B2118] transition-colors border border-[#E9E4DC] flex items-center justify-center font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          aria-label="Quay lại Tồn kho"
        >
          ← Tồn kho
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141210]">
            Nhập phần sau sơ chế
          </h1>
          <p className="text-xs text-[#7A6A58]">
            K2 · Bếp nhập số phần sau khi sơ chế xong — đầu ca hoặc giữa ca
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-[#7A6A58] text-sm animate-pulse">
          Đang tải thông tin món ăn...
        </div>
      )}

      {!loading && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Card 1: Chọn món */}
          <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <h2 className="text-base font-bold text-[#141210] mb-1">Chọn món</h2>
            <p className="text-xs text-[#7A6A58] mb-3">
              Món nào vừa sơ chế xong thì nhập món đó. Số phần chỉ tăng khi bếp nhập.
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((dish) => {
                const isSelected = dish.id === selectedId;
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => handleSelectDish(dish)}
                    className={`min-h-[48px] px-3.5 py-2 rounded-[8px] text-xs md:text-sm font-semibold transition-all active:scale-95 border ${
                      isSelected
                        ? 'bg-[#8C1D2C] text-[#FFFFFF] border-[#8C1D2C] font-bold shadow-sm'
                        : 'bg-[#FFFFFF] text-[#2B2118] border-[#E9E4DC] hover:bg-[#F6F4F0]'
                    }`}
                  >
                    <span>{dish.name}</span>
                    <span className="ml-1 opacity-75 font-normal tabular-nums">· {dish.portions} phần</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDish && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Card 2: Thẻ món đang chọn */}
              <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-[#141210]">{selectedDish.name}</h2>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          selectedDish.status === 'out'
                            ? 'bg-[#D14B3A]/10 text-[#D14B3A] border border-[#D14B3A]/25'
                            : selectedDish.status === 'low'
                            ? 'bg-[#D9A441]/15 text-[#D9A441] border border-[#D9A441]/30'
                            : 'bg-[#5F7F5E]/15 text-[#5F7F5E] border border-[#5F7F5E]/30'
                        }`}
                      >
                        {stockStatusLabel(selectedDish.status)}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6A58]">
                      Tồn kho hiện tại: <span className="font-bold text-[#141210] tabular-nums">{selectedDish.portions} phần</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl md:text-3xl font-extrabold text-[#141210] tabular-nums">
                      {selectedDish.portions}
                    </span>
                    <span className="text-xs text-[#7A6A58] ml-1">phần</span>
                  </div>
                </div>

                {/* Thanh ô phần hiện tại */}
                <div className="mt-3 pt-2.5 border-t border-[#E9E4DC]/70">
                  <div className="flex items-center justify-between text-[11px] text-[#7A6A58] mb-1 font-medium">
                    <span>Mỗi ô = 1 phần</span>
                    {currentDisplay.overflow > 0 && (
                      <span className="font-bold text-[#141210] tabular-nums">+{currentDisplay.overflow}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const isCellFilled = idx < currentDisplay.filled;
                      return (
                        <span
                          key={idx}
                          className={`w-4 h-4 md:w-5 md:h-5 rounded-[3px] border transition-colors ${
                            isCellFilled
                              ? selectedDish.status === 'out'
                                ? 'bg-[#E9E4DC] border-[#D5CEC4]'
                                : selectedDish.status === 'low'
                                ? 'bg-[#D9A441] border-[#B8852B]'
                                : 'bg-[#5F7F5E] border-[#4A6449]'
                              : 'bg-[#FFFFFF] border-[#E9E4DC]'
                          }`}
                        />
                      );
                    })}
                    {currentDisplay.overflow > 0 && (
                      <span className="text-xs font-bold text-[#7A6A58] ml-1 tabular-nums">
                        +{currentDisplay.overflow}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: BOM Sơ chế (nếu có định mức) hoặc Banner */}
              {selectedDish.bom ? (
                <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-[#141210] mb-0.5">
                      Sơ chế — {selectedDish.name}
                    </h2>
                    <p className="text-xs text-[#7A6A58]">
                      Ghi kg dùng được sau khi lọc — hệ thống tự tính yield và số phần tối đa.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="raw-kg-input" className="block text-xs font-semibold text-[#2B2118] mb-1">
                        Sườn sống đã lọc (kg)
                      </label>
                      <input
                        id="raw-kg-input"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={rawKg}
                        onChange={(e) => setRawKg(parseFloat(e.target.value) || 0)}
                        className="w-full min-h-[48px] bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] px-3.5 text-[#141210] text-base font-bold focus:outline-none focus:border-[#8C1D2C] tabular-nums"
                      />
                    </div>

                    <div>
                      <label htmlFor="prepped-kg-input" className="block text-xs font-semibold text-[#2B2118] mb-1">
                        Sườn đã lọc còn dùng được (kg)
                      </label>
                      <input
                        id="prepped-kg-input"
                        type="number"
                        min="0"
                        step="0.1"
                        value={preppedKg}
                        onChange={(e) => setPreppedKg(parseFloat(e.target.value) || 0)}
                        className="w-full min-h-[48px] bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] px-3.5 text-[#141210] text-base font-bold focus:outline-none focus:border-[#8C1D2C] tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Yield & Max metrics */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-[#F6F4F0] p-3 rounded-[8px] border border-[#E9E4DC] text-center">
                      <div className="text-lg md:text-xl font-extrabold text-[#D9A441] tabular-nums">
                        {bomCalculation?.yieldPercent ?? 0}%
                      </div>
                      <div className="text-[11px] text-[#7A6A58] mt-0.5">Yield thực tế</div>
                    </div>

                    <div className="bg-[#F6F4F0] p-3 rounded-[8px] border border-[#E9E4DC] text-center">
                      <div className="text-lg md:text-xl font-extrabold text-[#141210] tabular-nums">
                        {selectedDish.bom.grams} g
                      </div>
                      <div className="text-[11px] text-[#7A6A58] mt-0.5">Định mức / phần</div>
                    </div>

                    <div className="bg-[#F6F4F0] p-3 rounded-[8px] border border-[#E9E4DC] text-center">
                      <div className="text-lg md:text-xl font-extrabold text-[#5F7F5E] tabular-nums">
                        {bomCalculation?.maxPortions ?? 0}
                      </div>
                      <div className="text-[11px] text-[#7A6A58] mt-0.5">Tối đa (phần)</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center gap-2 text-xs text-[#7A6A58]">
                  <span>ℹ️</span>
                  <span>Món chưa có định mức – nhập trực tiếp số phần</span>
                </div>
              )}

              {/* Card 4: Số phần nhập thêm & Stepper */}
              <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-[8px] p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] space-y-3.5">
                <div>
                  <h2 className="text-base font-bold text-[#141210] mb-0.5">Số phần nhập thêm</h2>
                  <p className="text-xs text-[#7A6A58]">
                    {selectedDish.name} còn <span className="font-bold text-[#141210] tabular-nums">{selectedDish.portions} phần</span>.
                  </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center border border-[#E9E4DC] rounded-[8px] overflow-hidden bg-[#FFFFFF]">
                  <button
                    type="button"
                    disabled={addQuantity <= 1}
                    onClick={() => setAddQuantity((q) => Math.max(1, q - 1))}
                    className="min-h-[52px] min-w-[56px] w-14 bg-[#FFFFFF] hover:bg-[#F6F4F0] active:scale-95 text-[#8C1D2C] text-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    aria-label="Giảm"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={addQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAddQuantity(isNaN(val) ? 0 : val);
                    }}
                    className="flex-1 min-w-0 h-[52px] border-x border-[#E9E4DC] text-center text-xl font-extrabold text-[#141210] tabular-nums focus:outline-none"
                    aria-label="Số phần nhập thêm"
                  />

                  <button
                    type="button"
                    onClick={() => setAddQuantity((q) => q + 1)}
                    className="min-h-[52px] min-w-[56px] w-14 bg-[#FFFFFF] hover:bg-[#F6F4F0] active:scale-95 text-[#8C1D2C] text-2xl font-bold flex items-center justify-center transition-colors"
                    aria-label="Tăng"
                  >
                    +
                  </button>
                </div>

                {/* Phím bấm nhanh */}
                <div className="flex items-center gap-2">
                  {[1, 5, 10, 20].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setAddQuantity((q) => q + step)}
                      className="flex-1 min-h-[48px] py-2 px-3 rounded-[8px] bg-[#FFFFFF] hover:bg-[#F6F4F0] active:scale-95 border border-[#E9E4DC] text-xs md:text-sm font-bold text-[#2B2118] transition-colors tabular-nums"
                    >
                      +{step}
                    </button>
                  ))}
                </div>

                {/* Validation message */}
                {validationError && (
                  <p className="text-xs md:text-sm text-[#D14B3A] font-semibold bg-[#D14B3A]/10 p-3 rounded-[8px] border border-[#D14B3A]/25">
                    ⚠️ {validationError}
                  </p>
                )}

                {/* Result box: Tồn kho sau khi nhập */}
                <div className="bg-[#F6F4F0] border border-[#E9E4DC] rounded-[8px] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-[#7A6A58] font-medium">Sau khi nhập</span>
                    <span className="text-base md:text-lg font-extrabold text-[#141210] tabular-nums">
                      {currentPortion} → {targetPortion} phần
                    </span>
                  </div>

                  {/* Thanh preview ô phần */}
                  <div className="pt-2 border-t border-[#E9E4DC]">
                    <div className="flex items-center justify-between text-[11px] text-[#7A6A58] mb-1">
                      <span>Dự kiến tồn kho: {targetPortion} ô</span>
                      {targetDisplay.overflow > 0 && (
                        <span className="font-bold text-[#141210] tabular-nums">+{targetDisplay.overflow}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const isCellFilled = idx < targetDisplay.filled;
                        return (
                          <span
                            key={idx}
                            className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[2px] border ${
                              isCellFilled ? 'bg-[#5F7F5E] border-[#4A6449]' : 'bg-[#FFFFFF] border-[#E9E4DC]'
                            }`}
                          />
                        );
                      })}
                      {targetDisplay.overflow > 0 && (
                        <span className="text-xs font-bold text-[#7A6A58] ml-1 tabular-nums">
                          +{targetDisplay.overflow}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status alerts */}
              {errorMsg && (
                <div className="p-3.5 rounded-[8px] bg-[#D14B3A]/10 border border-[#D14B3A]/30 text-[#D14B3A] text-sm">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-[8px] bg-[#5F7F5E]/15 border border-[#5F7F5E]/30 text-[#5F7F5E] text-sm font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || Boolean(validationError)}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-[8px] bg-[#8C1D2C] hover:bg-[#6F1623] active:scale-95 text-[#FFFFFF] font-bold text-sm md:text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
        <div className="min-h-screen bg-[#F6F4F0] text-[#7A6A58] p-6 flex items-center justify-center text-sm">
          Đang tải...
        </div>
      }
    >
      <StockPrepContent />
    </Suspense>
  );
}
