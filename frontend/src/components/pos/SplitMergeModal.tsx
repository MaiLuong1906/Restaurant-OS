'use client';

import * as React from 'react';
import { Check, GitMerge, Scissors, Users, X } from 'lucide-react';
import { CashierTable, PaymentMethodType } from '@/types';
import { computeTablePayable, computeTableSubtotal } from '@/stores/usePosStore';
import { formatVND } from '@/lib/utils';

interface SplitMergeModalProps {
  open: boolean;
  onClose: () => void;
  sourceTable: CashierTable;
  allTables: CashierTable[];
  onSplitEqual: (tableId: string, numParts: number) => void;
  onSplitByItems: (tableId: string, itemIdsGroupA: string[]) => void;
  onMarkSplitPaid: (tableId: string, partId: string, method: PaymentMethodType) => void;
  onClearSplit: (tableId: string) => void;
  onMergeTables: (sourceTableId: string, targetTableId: string) => void;
}

export function SplitMergeModal({
  open,
  onClose,
  sourceTable,
  allTables,
  onSplitEqual,
  onSplitByItems,
  onMarkSplitPaid,
  onClearSplit,
  onMergeTables,
}: SplitMergeModalProps) {
  const [mode, setMode] = React.useState<'split' | 'merge'>('split');
  const [splitMethod, setSplitMethod] = React.useState<'equal' | 'items'>('equal');
  const [numParts, setNumParts] = React.useState<number>(2);
  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [targetTableId, setTargetTableId] = React.useState<string>('');

  const mergeCandidates = React.useMemo(
    () =>
      allTables.filter(
        (t) =>
          t.id !== sourceTable.id &&
          (t.status === 'OCCUPIED' || t.status === 'OVERDUE' || t.status === 'IDLE')
      ),
    [allTables, sourceTable.id]
  );

  React.useEffect(() => {
    if (mergeCandidates.length > 0 && !mergeCandidates.some((t) => t.id === targetTableId)) {
      const occupiedCandidate = mergeCandidates.find((t) => t.status !== 'IDLE');
      setTargetTableId((occupiedCandidate ?? mergeCandidates[0]).id);
    }
  }, [mergeCandidates, targetTableId]);

  if (!open) return null;

  const sourcePayable = computeTablePayable(sourceTable);
  const targetTable = allTables.find((t) => t.id === targetTableId);
  const targetPayable = targetTable ? computeTablePayable(targetTable) : 0;
  const combinedPreviewTotal = sourcePayable + targetPayable;

  const toggleItemSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-warm-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sand-200 bg-cream px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Use Case • Split / Merge Invoices
            </p>
            <h2 className="text-xl font-extrabold text-ink">
              Tách / Gộp Hóa Đơn — {sourceTable.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-sand-300 bg-white text-ink hover:bg-cream-dark"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 border-b border-sand-200 bg-white px-6 py-3">
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
              mode === 'split'
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-sand-300 bg-cream/60 text-ink hover:bg-cream-dark'
            }`}
          >
            <Scissors className="h-4 w-4" />
            <span>Tách Hóa Đơn (Split Invoice)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('merge')}
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
              mode === 'merge'
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-sand-300 bg-cream/60 text-ink hover:bg-cream-dark'
            }`}
          >
            <GitMerge className="h-4 w-4" />
            <span>Gộp Hóa Đơn & Bàn (Merge)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'split' ? (
            <div className="flex flex-col gap-5">
              {/* Tổng cần thu */}
              <div className="flex items-center justify-between rounded-xl border border-sand-200 bg-cream p-4">
                <div>
                  <p className="text-xs font-medium text-muted">
                    Tổng cần thanh toán của {sourceTable.label} (đã tính VAT 8%, trừ cọc/KM)
                  </p>
                  <p className="ops-nums mt-0.5 text-2xl font-extrabold text-primary-500">
                    {formatVND(sourcePayable)}
                  </p>
                </div>
                {sourceTable.splits ? (
                  <button
                    type="button"
                    onClick={() => onClearSplit(sourceTable.id)}
                    className="cursor-pointer rounded-lg border border-sand-300 bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-cream-dark"
                  >
                    Hủy tách • Về 1 bill
                  </button>
                ) : null}
              </div>

              {/* Chọn kiểu tách */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMethod('equal')}
                  className={`flex-1 cursor-pointer rounded-xl border py-2.5 text-xs font-bold ${
                    splitMethod === 'equal'
                      ? 'border-ink bg-ink text-white'
                      : 'border-sand-300 bg-white text-ink'
                  }`}
                >
                  Chia đều theo đầu người
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod('items')}
                  className={`flex-1 cursor-pointer rounded-xl border py-2.5 text-xs font-bold ${
                    splitMethod === 'items'
                      ? 'border-ink bg-ink text-white'
                      : 'border-sand-300 bg-white text-ink'
                  }`}
                >
                  Tách riêng theo món (Ai gọi nấy trả)
                </button>
              </div>

              {splitMethod === 'equal' ? (
                <div className="rounded-xl border border-sand-200 bg-cream/40 p-4">
                  <p className="mb-2.5 text-xs font-bold text-ink">
                    Chọn số phần muốn chia đều (Số nguyên VND chuẩn xác):
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNumParts(n)}
                        className={`ops-nums min-h-12 cursor-pointer rounded-xl border text-sm font-bold ${
                          numParts === n
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-sand-300 bg-white text-ink hover:bg-cream'
                        }`}
                      >
                        Chia {n} phần
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>Mỗi phần dự kiến:</span>
                    <strong className="ops-nums text-sm text-ink">
                      ~ {formatVND(Math.floor(sourcePayable / numParts))} / phần
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSplitEqual(sourceTable.id, numParts)}
                    className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white hover:opacity-90"
                  >
                    <Users className="h-4 w-4" />
                    <span>Áp dụng tách {numParts} phần bằng nhau</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-sand-200 bg-cream/40 p-4">
                  <p className="mb-2.5 text-xs font-bold text-ink">
                    Tick chọn các món muốn tách sang Hóa đơn phụ A:
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {sourceTable.items.map((item) => {
                      const checked = selectedItemIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs ${
                            checked
                              ? 'border-primary-500 bg-primary-50/40'
                              : 'border-sand-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleItemSelect(item.id)}
                              className="h-4 w-4 accent-[#8C1D2C]"
                            />
                            <span className="font-bold text-ink">
                              {item.name} ×{item.qty}
                            </span>
                          </div>
                          <span className="ops-nums font-bold text-ink">
                            {formatVND(item.qty * item.unitPrice)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={selectedItemIds.length === 0}
                    onClick={() => onSplitByItems(sourceTable.id, selectedItemIds)}
                    className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white disabled:opacity-40"
                  >
                    <Scissors className="h-4 w-4" />
                    <span>Tách các món đã chọn thành 2 phiếu thu</span>
                  </button>
                </div>
              )}

              {/* Danh sách các phần đã tách (UNPAID / PAID) */}
              {sourceTable.splits && sourceTable.splits.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    Trạng thái thu từng phần (Bill chỉ đóng khi tất cả phần đều PAID)
                  </p>
                  {sourceTable.splits.map((part) => (
                    <div
                      key={part.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-200 bg-white p-3.5"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">{part.label}</p>
                        <p className="ops-nums text-base font-extrabold text-primary-500">
                          {formatVND(part.amount)}
                        </p>
                      </div>
                      {part.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sage-100 px-3 py-1.5 text-xs font-bold text-sage-700">
                          <Check className="h-4 w-4" />
                          <span>ĐÃ THU (PAID)</span>
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onMarkSplitPaid(sourceTable.id, part.id, 'CASH')}
                            className="min-h-10 cursor-pointer rounded-lg border border-sand-300 bg-cream px-3 text-xs font-bold text-ink hover:bg-cream-dark"
                          >
                            Thu Tiền mặt
                          </button>
                          <button
                            type="button"
                            onClick={() => onMarkSplitPaid(sourceTable.id, part.id, 'VIETQR')}
                            className="min-h-10 cursor-pointer rounded-lg bg-primary-500 px-3 text-xs font-bold text-white hover:bg-primary-600"
                          >
                            Thu VietQR
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            /* Tab 2: Merge Invoices */
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-bold text-ink">
                  Chọn bàn đích để gộp hóa đơn từ <strong>{sourceTable.label}</strong> sang:
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {mergeCandidates.map((cand) => {
                    const isPicked = cand.id === targetTableId;
                    const candSub = computeTableSubtotal(cand);
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => setTargetTableId(cand.id)}
                        className={`flex min-h-20 cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                          isPicked
                            ? 'border-2 border-primary-500 bg-cream shadow-warm'
                            : 'border-sand-200 bg-white hover:border-ink'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="ops-nums text-sm font-extrabold text-ink">
                            {cand.label}
                          </span>
                          <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[10px] font-bold text-brown-700">
                            {cand.status === 'IDLE' ? 'Trống' : `${cand.items.length} món`}
                          </span>
                        </div>
                        <span className="ops-nums text-xs font-semibold text-muted">
                          {candSub > 0 ? formatVND(candSub) : '0 ₫'} • {cand.area}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bước xem trước (Preview) theo chuẩn Deep-Dive */}
              {targetTable ? (
                <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                    Xem trước giao dịch Gộp Hóa Đơn (@Transactional)
                  </p>
                  <p className="ops-nums mt-1.5 text-base font-extrabold text-ink">
                    Gộp {sourceTable.label} ({formatVND(sourcePayable)}) + {targetTable.label} (
                    {formatVND(targetPayable)}) &rarr; Tổng bill mới:{' '}
                    <span className="text-primary-500">{formatVND(combinedPreviewTotal)}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    • Tổng số khách sau gộp: {sourceTable.guests + targetTable.guests} khách •{' '}
                    {sourceTable.label} sẽ chuyển sang trạng thái Cần dọn.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                disabled={!targetTableId}
                onClick={() => {
                  onMergeTables(sourceTable.id, targetTableId);
                  onClose();
                }}
                className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-base font-bold text-white shadow-warm transition-colors hover:bg-primary-600 disabled:opacity-40"
              >
                <GitMerge className="h-5 w-5" />
                <span>
                  Xác nhận Gộp {sourceTable.label} vào {targetTable?.label ?? ''}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

