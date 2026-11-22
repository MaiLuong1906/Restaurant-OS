'use client';

import * as React from 'react';
import {
  AlertCircle,
  Check,
  GitMerge,
  Split,
  Users,
  X,
} from 'lucide-react';
import { CashierTable, CashierTableStatus } from '@/types';
import { computeTablePayable } from '@/stores/usePosStore';
import { formatVND } from '@/lib/utils';

interface SplitMergeModalProps {
  open: boolean;
  onClose: () => void;
  sourceTable: CashierTable;
  allTables: CashierTable[];
  onMergeTables: (sourceTableIds: string[], targetTableId: string) => void;
  onSplitMergedTables: (masterTableId: string, memberTableIds: string[]) => void;
}

const ORIGINAL_STATUS_LABEL: Record<CashierTableStatus, string> = {
  IDLE: 'Bàn trống',
  RESERVED: 'Đã đặt trước',
  OCCUPIED: 'Đang phục vụ',
  LOCKED: 'Đang khóa bill',
  OVERDUE: 'Quá SLA',
  CLEANING: 'Cần dọn',
};

export function SplitMergeModal({
  open,
  onClose,
  sourceTable,
  allTables,
  onMergeTables,
  onSplitMergedTables,
}: SplitMergeModalProps) {
  const masterTable = React.useMemo(() => {
    if (sourceTable.mergedIntoTableId) {
      return allTables.find((t) => t.id === sourceTable.mergedIntoTableId) ?? sourceTable;
    }
    return sourceTable;
  }, [allTables, sourceTable]);

  const mergedMembers = React.useMemo(
    () => masterTable.mergedMemberTables ?? [],
    [masterTable.mergedMemberTables]
  );
  const hasMergedGroup = mergedMembers.length > 0;

  const [mode, setMode] = React.useState<'merge' | 'split'>(hasMergedGroup ? 'split' : 'merge');
  const [selectedMergeIds, setSelectedMergeIds] = React.useState<string[]>([]);
  const [preferredMasterId, setPreferredMasterId] = React.useState<string>(masterTable.id);
  const [selectedSplitIds, setSelectedSplitIds] = React.useState<string[]>([]);

  // Các bàn có thể chọn để gộp thêm vào nhóm (bàn đang phục vụ, quá SLA hoặc bàn trống, chưa thuộc nhóm gộp khác)
  const mergeCandidates = React.useMemo(
    () =>
      allTables.filter(
        (t) =>
          t.id !== masterTable.id &&
          !t.mergedIntoTableId &&
          !(t.mergedMemberTables && t.mergedMemberTables.length > 0) &&
          (t.status === 'OCCUPIED' || t.status === 'OVERDUE' || t.status === 'IDLE')
      ),
    [allTables, masterTable.id]
  );

  React.useEffect(() => {
    if (!open) return;
    setMode(hasMergedGroup ? 'split' : 'merge');
    setSelectedMergeIds([]);
    setPreferredMasterId(masterTable.id);
    if (sourceTable.mergedIntoTableId) {
      setSelectedSplitIds([sourceTable.id]);
    } else {
      setSelectedSplitIds([]);
    }
  }, [open, sourceTable.id, sourceTable.mergedIntoTableId, masterTable.id, hasMergedGroup]);

  // Nếu bàn đang giữ bill chính bị bỏ tick thì tự động quay về masterTable.id
  React.useEffect(() => {
    if (
      preferredMasterId !== masterTable.id &&
      !selectedMergeIds.includes(preferredMasterId)
    ) {
      setPreferredMasterId(masterTable.id);
    }
  }, [preferredMasterId, masterTable.id, selectedMergeIds]);

  if (!open) return null;

  const toggleMergeCandidate = (tableId: string) => {
    setSelectedMergeIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const toggleSplitMember = (tableId: string) => {
    setSelectedSplitIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const selectedMergeTables = mergeCandidates.filter((t) => selectedMergeIds.includes(t.id));
  const masterSelectionPool = hasMergedGroup
    ? [masterTable]
    : [masterTable, ...selectedMergeTables];

  const effectiveTargetTable =
    masterSelectionPool.find((t) => t.id === preferredMasterId) ?? masterTable;

  const effectiveSourceIds = hasMergedGroup
    ? selectedMergeIds
    : [masterTable.id, ...selectedMergeIds].filter((id) => id !== effectiveTargetTable.id);

  const previewMergeTables = [masterTable, ...selectedMergeTables];
  const previewMergeGuests = previewMergeTables.reduce((sum, t) => sum + t.guests, 0);
  const previewMergePayable = previewMergeTables.reduce(
    (sum, t) => sum + computeTablePayable(t),
    0
  );

  // Tính xem trước cho tab Tách Bàn
  const selectedSnapshots = mergedMembers.filter((m) => selectedSplitIds.includes(m.tableId));
  const detachedSubtotal = selectedSnapshots.reduce(
    (sum, snap) =>
      sum + snap.items.reduce((itemSum, it) => itemSum + it.qty * it.unitPrice, 0),
    0
  );
  const masterCurrentSubtotal = masterTable.items.reduce(
    (sum, it) => sum + it.qty * it.unitPrice,
    0
  );
  const remainingMasterSubtotal = Math.max(0, masterCurrentSubtotal - detachedSubtotal);

  const activeOccupiedCandidates = mergeCandidates.filter(
    (t) => t.status === 'OCCUPIED' || t.status === 'OVERDUE'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-warm-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sand-200 bg-cream px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Nghiệp vụ Thu ngân • Gộp / Tách Bàn
            </p>
            <h2 className="text-xl font-extrabold text-ink">
              Tách / Gộp Bàn — {masterTable.label}
              {sourceTable.id !== masterTable.id ? ` (đang chọn ${sourceTable.label})` : ''}
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
            onClick={() => setMode('merge')}
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
              mode === 'merge'
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-sand-300 bg-cream/60 text-ink hover:bg-cream-dark'
            }`}
          >
            <GitMerge className="h-4 w-4" />
            <span>Gộp Bàn (2+ bàn)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
              mode === 'split'
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-sand-300 bg-cream/60 text-ink hover:bg-cream-dark'
            }`}
          >
            <Split className="h-4 w-4" />
            <span>
              Tách Bàn {hasMergedGroup ? `(${mergedMembers.length})` : ''}
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'merge' ? (
            <div className="flex flex-col gap-5">
              {/* Giải thích nghiệp vụ gộp nhiều bàn */}
              <div className="rounded-xl border border-sand-200 bg-cream p-4 text-xs text-ink">
                <p className="font-bold text-ink">
                  Gộp 2 hoặc nhiều bàn phục vụ cùng nhóm khách
                </p>
                <p className="mt-1 leading-relaxed text-muted">
                  Tất cả bàn sau khi gộp{' '}
                  <strong className="text-ink">vẫn giữ trạng thái Đang phục vụ</strong> trên
                  sơ đồ bàn. Nếu gộp nhầm bàn, bạn có thể mở lại tab{' '}
                  <strong className="text-ink">Tách Bàn</strong> để tách riêng từng bàn ra bất kỳ lúc nào.
                </p>
              </div>

              {/* Thông tin bàn hiện tại / nhóm hiện tại */}
              <div className="rounded-xl border border-primary-200 bg-primary-50/40 px-4 py-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-primary-600">
                  {hasMergedGroup ? 'Nhóm đang gộp hiện tại' : 'Bàn đang chọn làm gốc'}
                </span>
                <p className="mt-1 text-sm font-extrabold text-ink">
                  {masterTable.label}
                  {hasMergedGroup
                    ? ` + ${mergedMembers.map((m) => m.label).join(' + ')}`
                    : ''}
                </p>
                <p className="mt-0.5 text-muted">
                  {masterTable.area} • {masterTable.guests} khách • Cần thu hiện tại:{' '}
                  <strong className="ops-nums text-ink">
                    {formatVND(computeTablePayable(masterTable))}
                  </strong>
                </p>
              </div>

              {/* Danh sách chọn nhiều bàn để gộp */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">
                    Chọn 1 hoặc nhiều bàn cần gộp cùng {masterTable.label}:
                  </p>
                  <div className="flex gap-1.5">
                    {activeOccupiedCandidates.length > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMergeIds(activeOccupiedCandidates.map((t) => t.id))
                        }
                        className="min-h-8 cursor-pointer rounded-lg border border-sand-300 bg-white px-2.5 text-[11px] font-bold text-ink hover:bg-cream-dark"
                      >
                        Chọn bàn đang phục vụ ({activeOccupiedCandidates.length})
                      </button>
                    ) : null}
                    {selectedMergeIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedMergeIds([])}
                        className="min-h-8 cursor-pointer rounded-lg border border-sand-300 bg-white px-2.5 text-[11px] font-semibold text-muted hover:text-ink"
                      >
                        Bỏ chọn
                      </button>
                    ) : null}
                  </div>
                </div>

                {mergeCandidates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-sand-300 bg-cream/40 p-5 text-center text-xs text-muted">
                    Không còn bàn hợp lệ nào để gộp thêm.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mergeCandidates.map((t) => {
                      const isChecked = selectedMergeIds.includes(t.id);
                      const tablePayable = computeTablePayable(t);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleMergeCandidate(t.id)}
                          className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                            isChecked
                              ? 'border-primary-500 bg-primary-50/70 ring-1 ring-primary-300'
                              : 'border-sand-200 bg-white hover:bg-cream/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                isChecked
                                  ? 'border-primary-500 bg-primary-500 text-white'
                                  : 'border-sand-400 bg-white'
                              }`}
                            >
                              {isChecked ? <Check className="h-3.5 w-3.5" /> : null}
                            </span>
                            <div>
                              <p className="text-sm font-extrabold text-ink">{t.label}</p>
                              <p className="text-[11px] text-muted">
                                {ORIGINAL_STATUS_LABEL[t.status]} •{' '}
                                {t.guests > 0 ? `${t.guests} khách` : `${t.seats} ghế`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="ops-nums text-xs font-extrabold text-primary-500">
                              {t.items.length > 0 ? formatVND(tablePayable) : '0 ₫'}
                            </p>
                            <p className="text-[11px] text-muted">
                              {t.items.length > 0 ? `${t.items.length} món` : 'Ghép thêm chỗ'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chọn bàn chính giữ bill nếu đang tạo nhóm mới */}
              {!hasMergedGroup && selectedMergeIds.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-bold text-ink">
                    Bàn chính đại diện giữ hóa đơn gộp:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {masterSelectionPool.map((t) => {
                      const isPrimary = effectiveTargetTable.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPreferredMasterId(t.id)}
                          className={`min-h-10 cursor-pointer rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                            isPrimary
                              ? 'border-ink bg-ink text-white'
                              : 'border-sand-300 bg-white text-ink hover:bg-cream-dark'
                          }`}
                        >
                          {t.label}
                          {isPrimary ? ' (Bàn chính)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Preview sau khi gộp */}
              {selectedMergeIds.length > 0 ? (
                <div className="rounded-xl border border-sand-200 bg-cream p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">
                      Nhóm sau khi gộp ({1 + mergedMembers.length + selectedMergeIds.length} bàn)
                    </span>
                    <span className="rounded-md bg-sage-100 px-2 py-0.5 text-[11px] font-bold text-sage-700">
                      Đang phục vụ
                    </span>
                  </div>
                  <p className="mt-1.5 font-extrabold text-ink">
                    Bàn chính: {effectiveTargetTable.label} • Gộp cùng:{' '}
                    {previewMergeTables
                      .filter((t) => t.id !== effectiveTargetTable.id)
                      .map((t) => t.label)
                      .concat(mergedMembers.map((m) => m.label))
                      .join(', ')}
                  </p>
                  <p className="mt-1 text-muted">
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    Tổng {previewMergeGuests} khách • Hóa đơn dự kiến:{' '}
                    <strong className="ops-nums text-primary-500">
                      {formatVND(previewMergePayable)}
                    </strong>
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                disabled={effectiveSourceIds.length === 0}
                onClick={() => {
                  onMergeTables(effectiveSourceIds, effectiveTargetTable.id);
                  onClose();
                }}
                className="min-h-13 w-full cursor-pointer rounded-xl bg-primary-500 text-sm font-bold text-white shadow-warm hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedMergeIds.length > 0
                  ? `Xác nhận Gộp ${1 + selectedMergeIds.length} bàn vào ${effectiveTargetTable.label}`
                  : 'Chọn ít nhất 1 bàn khác để gộp'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {!hasMergedGroup ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-sand-300 bg-cream/50 p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted" />
                  <div>
                    <p className="text-sm font-extrabold text-ink">
                      {masterTable.label} hiện chưa gộp với bàn nào
                    </p>
                    <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
                      Chức năng <strong>Tách Bàn</strong> dùng để tách một hoặc nhiều bàn ra
                      khỏi nhóm các bàn đã được gộp (tránh trường hợp gộp nhầm bàn). Hãy
                      chuyển sang tab <strong>Gộp Bàn</strong> để gộp bàn trước.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('merge')}
                    className="mt-1 min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 text-xs font-bold text-white shadow-warm-sm hover:bg-primary-600"
                  >
                    Chuyển sang tab Gộp Bàn
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-sand-200 bg-cream p-4 text-xs">
                    <p className="font-bold text-ink">
                      Tách bàn khỏi nhóm đang gộp ({masterTable.label})
                    </p>
                    <p className="mt-1 leading-relaxed text-muted">
                      Chọn 1 hoặc nhiều bàn bên dưới để tách ra thành bàn độc lập (khôi phục
                      nguyên trạng món gọi, số khách và trạng thái trước khi gộp).
                    </p>
                  </div>

                  {/* Thẻ bàn chính giữ lại */}
                  <div className="flex items-center justify-between rounded-xl border border-sand-300 bg-sand-100/70 px-4 py-3 text-xs">
                    <div>
                      <span className="font-extrabold text-ink">{masterTable.label}</span>
                      <span className="ml-2 rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                        Bàn chính giữ hóa đơn nhóm
                      </span>
                    </div>
                    <span className="ops-nums font-bold text-ink">
                      Tạm tính nhóm: {formatVND(masterCurrentSubtotal)}
                    </span>
                  </div>

                  {/* Danh sách các bàn đã được gộp để tick chọn tách */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold text-ink">
                        Các bàn đang gộp chung ({mergedMembers.length} bàn):
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSplitIds(
                            selectedSplitIds.length === mergedMembers.length
                              ? []
                              : mergedMembers.map((m) => m.tableId)
                          )
                        }
                        className="min-h-8 cursor-pointer rounded-lg border border-sand-300 bg-white px-2.5 text-[11px] font-bold text-ink hover:bg-cream-dark"
                      >
                        {selectedSplitIds.length === mergedMembers.length
                          ? 'Bỏ chọn tất cả'
                          : `Chọn tách tất cả (${mergedMembers.length})`}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {mergedMembers.map((snap) => {
                        const isChecked = selectedSplitIds.includes(snap.tableId);
                        const snapSubtotal = snap.items.reduce(
                          (sum, it) => sum + it.qty * it.unitPrice,
                          0
                        );
                        return (
                          <button
                            key={snap.tableId}
                            type="button"
                            onClick={() => toggleSplitMember(snap.tableId)}
                            className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                              isChecked
                                ? 'border-primary-500 bg-primary-50/70 ring-1 ring-primary-300'
                                : 'border-sand-200 bg-white hover:bg-cream/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                  isChecked
                                    ? 'border-primary-500 bg-primary-500 text-white'
                                    : 'border-sand-400 bg-white'
                                }`}
                              >
                                {isChecked ? <Check className="h-3.5 w-3.5" /> : null}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-ink">
                                    {snap.label}
                                  </span>
                                  <span className="rounded-md border border-sand-300 bg-cream px-2 py-0.5 text-[10px] font-bold text-brown-800">
                                    Đang phục vụ (đã gộp)
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted">
                                  Khôi phục về: {ORIGINAL_STATUS_LABEL[snap.originalStatus]} •{' '}
                                  {snap.guests} khách • {snap.items.length} món
                                </p>
                              </div>
                            </div>
                            <span className="ops-nums shrink-0 text-sm font-extrabold text-primary-500">
                              {formatVND(snapSubtotal)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Xem trước kết quả tách */}
                  {selectedSnapshots.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-sand-200 bg-cream p-4 text-xs sm:grid-cols-2">
                      <div>
                        <p className="font-bold text-muted">
                          {masterTable.label} còn lại:
                        </p>
                        <p className="ops-nums mt-0.5 text-base font-extrabold text-ink">
                          {formatVND(remainingMasterSubtotal)}
                        </p>
                        <p className="text-[11px] text-muted">
                          {mergedMembers.length - selectedSnapshots.length > 0
                            ? `Vẫn còn gộp ${mergedMembers.length - selectedSnapshots.length} bàn`
                            : 'Trở về bàn đơn bình thường'}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-primary-600">
                          Tách ra ({selectedSnapshots.map((s) => s.label).join(', ')}):
                        </p>
                        <p className="ops-nums mt-0.5 text-base font-extrabold text-primary-500">
                          {formatVND(detachedSubtotal)}
                        </p>
                        <p className="text-[11px] text-muted">
                          Khôi phục món &amp; khách về đúng bàn gốc
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={selectedSplitIds.length === 0}
                    onClick={() => {
                      onSplitMergedTables(masterTable.id, selectedSplitIds);
                      onClose();
                    }}
                    className="min-h-13 w-full cursor-pointer rounded-xl bg-primary-500 text-sm font-bold text-white shadow-warm hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {selectedSplitIds.length > 0
                      ? `Xác nhận Tách ${selectedSplitIds.length} bàn khỏi ${masterTable.label}`
                      : 'Chọn ít nhất 1 bàn đã gộp để tách ra'}
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
