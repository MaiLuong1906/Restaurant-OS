'use client';

import * as React from 'react';
import Link from 'next/link';
import { DishAvailability } from '@/types';
import { kdsService } from '@/services/mock';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SoldOutPage() {
  const [dishes, setDishes] = React.useState<DishAvailability[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // FSM views: 'list' | 'confirm' | 'success'
  const [view, setView] = React.useState<'list' | 'confirm' | 'success'>('list');
  const [selectedDish, setSelectedDish] = React.useState<DishAvailability | null>(null);

  // Stepper mở bán lại inline per dish
  const [reopenEditingId, setReopenEditingId] = React.useState<string | null>(null);
  const [reopenQuantities, setReopenQuantities] = React.useState<Record<string, number>>({});
  const [actionPending, setActionPending] = React.useState<boolean>(false);

  const fetchDishes = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kdsService.listDishAvailability();
      setDishes(data);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách món');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const soldOutDishes = dishes.filter((d) => d.status === 'SOLD_OUT');
  const availableDishes = dishes.filter((d) => d.status === 'AVAILABLE');

  // Khởi động trình sửa số lượng khi bấm "Mở bán lại"
  const startReopen = (dish: DishAvailability) => {
    setReopenEditingId(dish.dishId);
    setReopenQuantities((prev) => ({
      ...prev,
      [dish.dishId]: prev[dish.dishId] || dish.lastStock || 1,
    }));
  };

  const handleStepQty = (dishId: string, delta: number) => {
    setReopenQuantities((prev) => {
      const cur = prev[dishId] || 1;
      const next = Math.max(1, Math.min(99, cur + delta));
      return { ...prev, [dishId]: next };
    });
  };

  const handleConfirmReopen = async (dishId: string) => {
    const qty = reopenQuantities[dishId] || 1;
    try {
      setActionPending(true);
      const key = `reopen-${dishId}-${Date.now()}`;
      const updated = await kdsService.reopenDish(dishId, qty, key);
      setDishes((prev) => prev.map((d) => (d.dishId === updated.dishId ? updated : d)));
      setReopenEditingId(null);
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi mở bán lại');
    } finally {
      setActionPending(false);
    }
  };

  // Sang màn A8 xác nhận
  const startSoldOutConfirm = (dish: DishAvailability) => {
    setSelectedDish(dish);
    setView('confirm');
  };

  const handleConfirmSoldOut = async () => {
    if (!selectedDish) return;
    try {
      setActionPending(true);
      const key = `soldout-${selectedDish.dishId}-${Date.now()}`;
      const updated = await kdsService.markSoldOut(selectedDish.dishId, key);
      setDishes((prev) => prev.map((d) => (d.dishId === updated.dishId ? updated : d)));
      setView('success');
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi báo hết món');
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-ops-bg,#F6F4F0)] text-ops-ink flex flex-col font-sans select-none">
      {/* Header bar KDS */}
      <header className="h-16 px-6 bg-white border-b border-ops-border flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/kds"
            className="h-10 px-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 flex items-center gap-1.5 text-sm font-bold text-[#2B2118]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về bếp</span>
          </Link>
          <h1 className="text-xl font-black text-ops-brand tracking-tight">KDS &bull; Quản lý món hết</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-ops-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-ops-brand" />
            <p className="text-sm font-semibold">Đang tải danh sách món...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center max-w-md mx-auto my-12">
            <h2 className="font-bold text-lg mb-1">Đã xảy ra lỗi</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchDishes}
              className="px-4 py-2 bg-ops-brand text-white font-bold rounded-lg text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : view === 'confirm' && selectedDish ? (
          /* ============ A8: Xác nhận hết món ============ */
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setView('list')}
                className="text-sm font-bold text-ops-brand flex items-center gap-1 mb-2 hover:underline"
              >
                &larr; Danh sách hết món
              </button>
              <h2 className="text-2xl font-bold text-[#2B2118]">
                Báo hết món {selectedDish.dishName}?
              </h2>
              <p className="text-xs text-ops-muted mt-1">
                Xác nhận trước khi công bố cho khách và POS
              </p>
            </div>

            <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm space-y-4">
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Món</span>
                <b className="text-ops-ink font-bold">{selectedDish.dishName}</b>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Còn lại</span>
                <b className="text-ops-ink font-mono font-bold">{selectedDish.remainingPortions} phần</b>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Bàn đang chờ món này</span>
                <b className="text-ops-ink font-bold">
                  {selectedDish.waitingTables.length > 0
                    ? selectedDish.waitingTables.map((t) => t.tableName).join(', ')
                    : 'Không có bàn nào'}
                </b>
              </div>
            </div>

            {/* Banner Lưu ý tác động chuẩn A8 */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-danger-800 text-sm font-medium leading-relaxed">
              <strong>Lưu ý:</strong> món này sẽ ẩn khỏi menu khách và POS ngay sau khi xác nhận.
              {selectedDish.waitingTables.length > 0 && (
                <span>
                  {' '}
                  {selectedDish.waitingTables.map((t) => t.tableName).join(', ')} đang chờ món này sẽ giữ
                  nguyên trên ticket — món không bị tự xóa. Phục vụ sẽ được báo để liên hệ khách và đổi món.
                </span>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={actionPending}
                onClick={handleConfirmSoldOut}
                className="w-full h-12 rounded-lg bg-[#D14B3A] hover:bg-red-700 active:scale-98 text-white font-bold text-base shadow-xs transition-transform disabled:opacity-50"
              >
                Xác nhận hết món
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className="w-full h-12 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 active:scale-98 text-[#2B2118] font-bold text-base transition-transform"
              >
                Quay lại
              </button>
            </div>
          </div>
        ) : view === 'success' && selectedDish ? (
          /* ============ A8 Success Screen ============ */
          <div className="space-y-6 text-center">
            <div className="bg-white border border-ops-border rounded-lg p-8 shadow-warm">
              <CheckCircle2 className="h-12 w-12 text-[#8C1D2C] mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-[#2B2118]">
                Đã báo hết món {selectedDish.dishName}
              </h2>
              <p className="text-sm text-ops-muted mt-1">Món đã ẩn khỏi menu khách và POS.</p>
            </div>

            {selectedDish.waitingTables.length > 0 && (
              <div className="bg-white border border-ops-border rounded-lg p-6 text-left shadow-warm space-y-3">
                <h3 className="font-bold text-base text-[#2B2118]">Bàn đang chờ món này</h3>
                <p className="text-xs text-ops-muted">
                  Các bàn này giữ nguyên trên ticket — món không bị tự xóa.
                </p>
                <div className="space-y-2">
                  {selectedDish.waitingTables.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded bg-amber-50 border border-amber-200 text-sm"
                    >
                      <b className="text-amber-950 font-bold">{t.tableName}</b>
                      <span className="text-xs text-amber-800 font-semibold">Chờ phục vụ xử lý</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedDish(null);
                  setView('list');
                }}
                className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base shadow-xs transition-transform"
              >
                Xem danh sách hết món
              </button>
              <Link
                href="/kds"
                className="w-full h-12 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 active:scale-98 text-[#2B2118] font-bold text-base flex items-center justify-center transition-transform"
              >
                Về bếp
              </Link>
            </div>
          </div>
        ) : (
          /* ============ A7: Danh sách hết món ============ */
          <div className="space-y-8">
            {/* Nhóm 1: Đang hết món */}
            <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm">
              <h2 className="text-lg font-bold text-[#2B2118] mb-1">Đang hết món</h2>
              <p className="text-xs text-ops-muted mb-4">
                Bấm &quot;Mở bán lại&quot; và nhập số phần để tiếp tục nhận món
              </p>

              {soldOutDishes.length === 0 ? (
                <div className="py-8 text-center text-ops-muted text-sm border-2 border-dashed border-ops-border rounded-lg">
                  Chưa có món nào hết. Khi bếp báo hết món, món đó sẽ hiện ở đây.
                </div>
              ) : (
                <div className="divide-y divide-ops-border">
                  {soldOutDishes.map((d) => (
                    <div key={d.dishId} className="py-4">
                      {reopenEditingId === d.dishId ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <b className="text-ops-ink font-bold">{d.dishName}</b>
                            <span className="text-xs text-ops-muted">
                              Còn lúc báo hết: {d.lastStock || 1} phần
                            </span>
                          </div>

                          {/* Stepper điều chỉnh số lượng */}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleStepQty(d.dishId, -1)}
                              className="h-12 w-12 rounded-lg border border-ops-border bg-white text-xl font-black text-ops-ink flex items-center justify-center active:scale-95 shadow-xs"
                              aria-label="Giảm số lượng"
                            >
                              &minus;
                            </button>
                            <span className="font-mono text-2xl font-black text-ops-brand min-w-[48px] text-center">
                              {reopenQuantities[d.dishId] || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStepQty(d.dishId, 1)}
                              className="h-12 w-12 rounded-lg border border-ops-border bg-white text-xl font-black text-ops-ink flex items-center justify-center active:scale-95 shadow-xs"
                              aria-label="Tăng số lượng"
                            >
                              &#43;
                            </button>
                            <span className="text-xs font-semibold text-ops-muted">phần</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              disabled={actionPending}
                              onClick={() => handleConfirmReopen(d.dishId)}
                              className="h-10 px-4 rounded-lg bg-ops-brand hover:bg-ops-brand-dark text-white font-bold text-xs"
                            >
                              Xác nhận mở bán
                            </button>
                            <button
                              type="button"
                              onClick={() => setReopenEditingId(null)}
                              className="h-10 px-4 rounded-lg border border-ops-border bg-white text-[#2B2118] font-semibold text-xs"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <b className="text-base font-bold text-ops-ink block">{d.dishName}</b>
                            <span className="text-xs text-ops-muted">
                              Hết từ {d.soldOutAt || '--:--'} &bull; {d.markedBy || 'Đầu bếp'} đánh dấu
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => startReopen(d)}
                            className="h-12 px-5 rounded-lg border-2 border-ops-brand text-ops-brand hover:bg-red-50 font-bold text-sm transition-colors"
                          >
                            Mở bán lại
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nhóm 2: Món còn bán */}
            <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm">
              <h2 className="text-lg font-bold text-[#2B2118] mb-1">Món còn bán</h2>
              <p className="text-xs text-ops-muted mb-4">
                Bấm &quot;Báo hết&quot; để chuyển sang màn xác nhận
              </p>

              <div className="divide-y divide-ops-border">
                {availableDishes.map((d) => (
                  <div key={d.dishId} className="py-4 flex justify-between items-center">
                    <div>
                      <b className="text-base font-bold text-ops-ink block">{d.dishName}</b>
                      <span className="text-xs text-ops-muted">Còn {d.remainingPortions} phần</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startSoldOutConfirm(d)}
                      className="h-12 px-5 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 text-[#2B2118] font-bold text-sm shadow-xs transition-colors"
                    >
                      Báo hết
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
