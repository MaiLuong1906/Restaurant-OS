'use client';

import * as React from 'react';
import { GitMerge, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { cn } from '@/lib/utils';

export function WaiterTransferModal() {
  const isTransferModalOpen = useWaiterStore((s) => s.isTransferModalOpen);
  const selectedTableId = useWaiterStore((s) => s.selectedTableId);
  const tables = useWaiterStore((s) => s.tables);
  const transferTable = useWaiterStore((s) => s.transferTable);
  const mergeTable = useWaiterStore((s) => s.mergeTable);
  const showToast = useWaiterStore((s) => s.showToast);

  const [activeMode, setActiveMode] = React.useState<'transfer' | 'merge'>('transfer');
  const [targetTableId, setTargetTableId] = React.useState<string>('02');

  const tableList = React.useMemo(() => Object.values(tables), [tables]);
  const sourceTable = tables[selectedTableId];

  // Eligible target tables (excluding current table)
  const candidateTables = React.useMemo(() => {
    return tableList.filter((t) => t.id !== selectedTableId);
  }, [tableList, selectedTableId]);

  if (!isTransferModalOpen) return null;

  const handleClose = () => {
    useWaiterStore.setState({ isTransferModalOpen: false });
  };

  const handleConfirm = () => {
    if (activeMode === 'transfer') {
      transferTable(selectedTableId, targetTableId);
      showToast(`Đã chuyển toàn bộ order từ ${sourceTable?.name} sang Bàn ${targetTableId}!`);
    } else {
      mergeTable(selectedTableId, targetTableId);
      showToast(`Đã gộp đơn từ ${sourceTable?.name} vào Bàn ${targetTableId} thành công!`);
    }
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-ops-border animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ops-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ops-brand-light text-ops-brand">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-ink">
                Chuyển / Gộp bàn ({sourceTable?.name})
              </h3>
              <p className="text-[11px] text-ops-muted">Điều chuyển vị trí hoặc sáp nhập đơn ăn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-ops-muted hover:text-ink hover:bg-ops-bg transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch: Transfer vs Merge */}
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 p-1 bg-ops-bg rounded-xl border border-ops-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveMode('transfer')}
              className={cn(
                'py-2 rounded-lg transition-all',
                activeMode === 'transfer'
                  ? 'bg-white text-ink shadow-xs border border-ops-border'
                  : 'text-ops-muted hover:text-ink'
              )}
            >
              Chuyển bàn
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('merge')}
              className={cn(
                'py-2 rounded-lg transition-all',
                activeMode === 'merge'
                  ? 'bg-white text-ink shadow-xs border border-ops-border'
                  : 'text-ops-muted hover:text-ink'
              )}
            >
              Gộp bàn
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-ops-muted">
              {activeMode === 'transfer'
                ? 'Chọn bàn muốn chuyển tới (bàn đích):'
                : 'Chọn bàn muốn gộp chung order:'}
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {candidateTables.map((t) => {
                const isSelected = targetTableId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetTableId(t.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5',
                      isSelected
                        ? 'border-ops-brand bg-ops-brand-light text-ops-brand font-bold ring-2 ring-ops-brand/20'
                        : 'border-ops-border bg-white text-ink hover:bg-ops-bg'
                    )}
                  >
                    <span className="text-xs font-bold">{t.name}</span>
                    <span className="text-[10px] text-ops-muted">
                      {t.status === 'vacant' ? 'Bàn trống' : t.statusText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-ops-bg border border-ops-border text-[11px] text-ops-muted">
            <AlertCircle className="h-4 w-4 text-ops-brand flex-shrink-0 mt-0.5" />
            <span>
              {activeMode === 'transfer'
                ? `Toàn bộ ${sourceTable?.confirmedItems.length} món và trạng thái từ ${sourceTable?.name} sẽ được chuyển qua Bàn ${targetTableId}. Bàn cũ sẽ được chuyển sang Bàn trống.`
                : `Các món của ${sourceTable?.name} sẽ được cộng dồn vào Bàn ${targetTableId}.`}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-ops-border bg-ops-bg px-5 py-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-ops-border bg-white px-4 py-2 text-xs font-semibold text-ops-muted hover:bg-ops-bg hover:text-ink"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-ops-brand hover:bg-ops-brand-dark px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            <span>Xác nhận thực hiện</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
