'use client';

import * as React from 'react';
import Link from 'next/link';
import { WasteDishOption, WasteTodayStats, WasteReason } from '@/types';
import { kdsService } from '@/services/mock';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowLeft, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

const REASONS: WasteReason[] = [
  'Nấu hỏng',
  'Nguyên liệu hết hạn',
  'Rơi vỡ',
  'Khách trả lại',
  'Lý do khác',
];

export default function KdsWastePage() {
  const staffUser = useAuthStore((s) => s.staffUser);

  // Kiểm tra quyền Bếp trưởng
  // Lưu ý bảo mật: UI chỉ chặn trải nghiệm, API backend bắt buộc enforce server-side
  const isChef = React.useMemo(() => {
    if (!staffUser) return true; // Mặc định trong tablet bếp KDS nếu chưa đăng nhập staff user
    const role = (staffUser.role || '').toUpperCase();
    return role === 'HEAD_CHEF' || role === 'CHEF' || role.includes('CHEF');
  }, [staffUser]);

  const [dishOptions, setDishOptions] = React.useState<WasteDishOption[]>([]);
  const [stats, setStats] = React.useState<WasteTodayStats>({ logCount: 0, portionCount: 0 });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // FSM views: 'form' | 'confirm' | 'success'
  const [view, setView] = React.useState<'form' | 'confirm' | 'success'>('form');

  // Form state
  const [selectedDishId, setSelectedDishId] = React.useState<string>('');
  const [quantity, setQuantity] = React.useState<number>(1);
  const [reason, setReason] = React.useState<WasteReason>('Nấu hỏng');
  const [note, setNote] = React.useState<string>('');
  const [noteError, setNoteError] = React.useState<string | null>(null);

  // Snapshot riêng cho A10 xác nhận
  const [snapshot, setSnapshot] = React.useState<{
    dishId: string;
    dishName: string;
    quantity: number;
    reason: WasteReason;
    note: string;
    recorderName: string;
    recorderRole: string;
    recordedAt: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [options, todayStats] = await Promise.all([
        kdsService.getWasteDishOptions(),
        kdsService.getWasteTodayStats(),
      ]);
      setDishOptions(options);
      setStats(todayStats);

      // Mặc định chọn món đầu tiên còn hàng
      const firstAvailable = options.find((d) => d.stockQuantity > 0) || options[0];
      if (firstAvailable) {
        setSelectedDishId(firstAvailable.dishId);
        setQuantity(1);
      }
    } catch (err) {
      setError((err as Error).message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const currentDish = dishOptions.find((d) => d.dishId === selectedDishId) || null;
  const isOutOfStock = !currentDish || currentDish.stockQuantity === 0;

  const handleDishChange = (dishId: string) => {
    setSelectedDishId(dishId);
    const dish = dishOptions.find((d) => d.dishId === dishId);
    if (!dish || dish.stockQuantity === 0) {
      setQuantity(0);
    } else {
      setQuantity(1);
    }
  };

  const handleStepQuantity = (delta: number) => {
    if (isOutOfStock || !currentDish) return;
    setQuantity((prev) => Math.max(1, Math.min(currentDish.stockQuantity, prev + delta)));
  };

  const handleGoToConfirm = () => {
    if (!currentDish || isOutOfStock) return;
    if (reason === 'Lý do khác' && !note.trim()) {
      setNoteError('Vui lòng ghi rõ lý do khi chọn "Lý do khác".');
      return;
    }
    setNoteError(null);

    setSnapshot({
      dishId: currentDish.dishId,
      dishName: currentDish.dishName,
      quantity,
      reason,
      note: note.trim(),
      recorderName: staffUser?.fullName || 'Bếp trưởng Minh',
      recorderRole: 'Bếp trưởng',
      recordedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });

    setView('confirm');
  };

  const handleConfirmWaste = async () => {
    if (!snapshot || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const idempotencyKey = `waste-${snapshot.dishId}-${Date.now()}`;
      await kdsService.createWasteLog({
        dishId: snapshot.dishId,
        quantity: snapshot.quantity,
        reason: snapshot.reason,
        note: snapshot.note,
        recordedById: staffUser?.id || 'usr-head-chef',
        recordedByName: snapshot.recorderName,
        recordedByRole: 'HEAD_CHEF',
        idempotencyKey,
      });

      // Cập nhật lại số liệu
      const [options, todayStats] = await Promise.all([
        kdsService.getWasteDishOptions(),
        kdsService.getWasteTodayStats(),
      ]);
      setDishOptions(options);
      setStats(todayStats);

      setView('success');
    } catch (err) {
      setError((err as Error).message || 'Lỗi khi ghi hủy món');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSnapshot(null);
    setNote('');
    setNoteError(null);
    const firstAvailable = dishOptions.find((d) => d.stockQuantity > 0) || dishOptions[0];
    if (firstAvailable) {
      setSelectedDishId(firstAvailable.dishId);
      setQuantity(1);
    }
    setView('form');
  };

  // Màn hình chặn quyền nếu không phải Bếp trưởng
  if (!isChef) {
    return (
      <div className="min-h-screen bg-[var(--color-ops-bg,#F6F4F0)] text-ops-ink flex flex-col font-sans">
        <header className="h-16 px-6 bg-white border-b border-ops-border flex items-center shadow-xs">
          <Link
            href="/kds"
            className="h-10 px-3 rounded-lg border border-ops-border bg-white flex items-center gap-1.5 text-sm font-bold text-[#2B2118]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại bếp</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-ops-border rounded-lg shadow-warm p-8 text-center space-y-4">
            <Lock className="h-12 w-12 text-ops-muted mx-auto" />
            <h2 className="text-xl font-bold text-[#2B2118]">Chỉ Bếp trưởng mới ghi hủy món</h2>
            <p className="text-sm text-ops-muted">
              Bạn đang đăng nhập với vai trò Nhân viên/Đầu bếp. Nếu cần ghi hủy món hoặc nguyên liệu, vui lòng báo Bếp trưởng thực hiện.
            </p>
            <Link
              href="/kds"
              className="inline-flex w-full h-12 rounded-lg bg-ops-brand text-white font-bold items-center justify-center"
            >
              Quay lại bếp
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-ops-bg,#F6F4F0)] text-ops-ink flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 px-6 bg-white border-b border-ops-border flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/kds"
            className="h-10 px-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 flex items-center gap-1.5 text-sm font-bold text-[#2B2118]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về bếp</span>
          </Link>
          <h1 className="text-xl font-black text-ops-brand tracking-tight">KDS &bull; Ghi hủy món</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-ops-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-ops-brand" />
            <p className="text-sm font-semibold">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center my-8">
            <h2 className="font-bold text-lg mb-1">Đã xảy ra lỗi</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 bg-ops-brand text-white font-bold rounded-lg text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : view === 'confirm' && snapshot ? (
          /* ============ A10: Xác nhận ghi hủy ============ */
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setView('form')}
                className="text-sm font-bold text-ops-brand flex items-center gap-1 mb-2 hover:underline"
              >
                &larr; Quay lại sửa
              </button>
              <h2 className="text-2xl font-bold text-[#2B2118]">Xác nhận ghi hủy</h2>
              <p className="text-xs text-ops-muted mt-1">Kiểm tra lại trước khi ghi vào nhật ký</p>
            </div>

            <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm space-y-3">
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Món</span>
                <b className="text-ops-ink font-bold">{snapshot.dishName}</b>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Số lượng</span>
                <b className="text-ops-ink font-mono font-bold">{snapshot.quantity} phần</b>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Lý do</span>
                <b className="text-ops-ink font-bold">{snapshot.reason}</b>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Ghi chú</span>
                <b className="text-ops-ink font-normal">{snapshot.note || 'Không có'}</b>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-ops-border text-sm">
                <span className="text-ops-muted">Người ghi</span>
                <b className="text-ops-ink font-bold">{snapshot.recorderName}</b>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-ops-muted">Giờ ghi</span>
                <b className="text-ops-ink font-mono">{snapshot.recordedAt}</b>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmWaste}
                className="w-full h-12 rounded-lg bg-[#D14B3A] hover:bg-red-700 active:scale-98 text-white font-bold text-base shadow-xs transition-transform disabled:opacity-50"
              >
                {isSubmitting ? 'Đang ghi...' : 'Xác nhận ghi hủy'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setView('form')}
                className="w-full h-12 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 active:scale-98 text-[#2B2118] font-bold text-base transition-transform"
              >
                Quay lại sửa
              </button>
            </div>
          </div>
        ) : view === 'success' && snapshot ? (
          /* ============ A10 Success Screen ============ */
          <div className="space-y-6 text-center">
            <div className="bg-white border border-ops-border rounded-lg p-8 shadow-warm">
              <CheckCircle2 className="h-12 w-12 text-[#8C1D2C] mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-[#2B2118]">Đã ghi hủy món</h2>
              <p className="text-base text-ops-ink font-bold mt-1">
                {snapshot.dishName} &bull; {snapshot.quantity} phần &bull; {snapshot.reason}
              </p>
              <p className="text-xs text-ops-muted mt-2">
                {snapshot.recorderName} &bull; {snapshot.recordedAt} &bull; Đã trừ kho.
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                Hôm nay đã ghi hủy: {stats.logCount} lượt &bull; {stats.portionCount} phần.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base shadow-xs transition-transform"
              >
                Ghi hủy món khác
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
          /* ============ A9 Form Screen ============ */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2B2118]">Ghi hủy món</h2>
              <p className="text-xs text-ops-muted mt-1">
                Chỉ Bếp trưởng ghi hủy — món hủy sẽ trừ kho và ghi vào nhật ký
              </p>
              <p className="text-xs text-ops-brand font-semibold mt-2">
                Đang ghi với vai trò: <strong>Bếp trưởng</strong>
              </p>
            </div>

            {/* Thống kê hôm nay */}
            <div className="bg-white border border-ops-border rounded-lg p-4 shadow-warm flex justify-between items-center text-sm">
              <span className="text-ops-muted">Hôm nay đã ghi hủy:</span>
              <b className="text-ops-ink font-bold font-mono">
                {stats.logCount} lượt &bull; {stats.portionCount} phần
              </b>
            </div>

            <div className="bg-white border border-ops-border rounded-lg p-6 shadow-warm space-y-5">
              {/* Chọn món */}
              <div>
                <label htmlFor="waste-dish-select" className="block text-sm font-bold text-ops-ink mb-1.5">
                  Món
                </label>
                <select
                  id="waste-dish-select"
                  value={selectedDishId}
                  onChange={(e) => handleDishChange(e.target.value)}
                  className="w-full h-12 px-3 rounded-lg border border-ops-border bg-white text-ops-ink text-sm font-semibold focus:outline-none focus:border-ops-brand"
                >
                  {dishOptions.map((d) => (
                    <option key={d.dishId} value={d.dishId} disabled={d.stockQuantity === 0}>
                      {d.dishName} {d.stockQuantity === 0 ? '(đang hết)' : `(còn ${d.stockQuantity} phần)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stepper số lượng */}
              <div>
                <span className="block text-sm font-bold text-ops-ink mb-1.5">Số lượng</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 1}
                    onClick={() => handleStepQuantity(-1)}
                    className="h-12 w-12 rounded-lg border border-ops-border bg-white text-xl font-black text-ops-ink flex items-center justify-center active:scale-98 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Giảm số lượng"
                  >
                    &minus;
                  </button>
                  <span className="font-mono text-2xl font-black text-ops-brand min-w-[48px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock || !currentDish || quantity >= currentDish.stockQuantity}
                    onClick={() => handleStepQuantity(1)}
                    className="h-12 w-12 rounded-lg border border-ops-border bg-white text-xl font-black text-ops-ink flex items-center justify-center active:scale-98 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Tăng số lượng"
                  >
                    &#43;
                  </button>
                  <span className="text-xs font-semibold text-ops-muted">phần</span>
                </div>
                <p className="text-xs text-ops-muted mt-1.5">
                  {isOutOfStock
                    ? 'Món đang hết — không còn phần nào để ghi hủy.'
                    : `Tối đa ${currentDish?.stockQuantity} phần (theo tồn kho).`}
                </p>
              </div>

              {/* Lý do ghi hủy */}
              <div>
                <span className="block text-sm font-bold text-ops-ink mb-2">Lý do</span>
                <div className="space-y-2">
                  {REASONS.map((r) => {
                    const isSelected = reason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setReason(r);
                          if (r !== 'Lý do khác') setNoteError(null);
                        }}
                        className={`w-full min-h-[52px] p-3 rounded-lg border text-sm font-semibold flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'border-ops-brand bg-red-50/40 text-ops-brand ring-1 ring-ops-brand'
                            : 'border-ops-border bg-white text-ops-ink hover:bg-neutral-50'
                        }`}
                      >
                        <span>{r}</span>
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-ops-brand' : 'border-ops-border'
                          }`}
                        >
                          {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-ops-brand" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label htmlFor="waste-note-input" className="block text-sm font-bold text-ops-ink mb-1.5">
                  {reason === 'Lý do khác' ? 'Ghi chú (bắt buộc)' : 'Ghi chú (không bắt buộc)'}
                </label>
                <textarea
                  id="waste-note-input"
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (noteError) setNoteError(null);
                  }}
                  placeholder="Ví dụ: Nấu quá lửa, khách đổi món..."
                  className="w-full p-3 rounded-lg border border-ops-border bg-white text-sm text-ops-ink focus:outline-none focus:border-ops-brand resize-none"
                />
                {noteError && <p className="text-xs text-danger-600 font-bold mt-1">{noteError}</p>}
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleGoToConfirm}
                className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base shadow-xs transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Xem lại và xác nhận
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
