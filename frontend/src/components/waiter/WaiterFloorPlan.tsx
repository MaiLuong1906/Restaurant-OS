'use client';

import * as React from 'react';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Printer,
  GitMerge,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { WaiterTable } from '@/types/waiter';
import { formatVND, cn } from '@/lib/utils';

export function WaiterFloorPlan() {
  const tables = useWaiterStore((s) => s.tables);
  const selectedTableId = useWaiterStore((s) => s.selectedTableId);
  const setSelectedTable = useWaiterStore((s) => s.setSelectedTable);
  const activeZoneFilter = useWaiterStore((s) => s.activeZoneFilter);
  const setZoneFilter = useWaiterStore((s) => s.setZoneFilter);
  const updateTableStatus = useWaiterStore((s) => s.updateTableStatus);
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);
  const showToast = useWaiterStore((s) => s.showToast);

  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  const tableList = React.useMemo(() => Object.values(tables), [tables]);

  // Counts for filters
  const counts = React.useMemo(() => {
    return {
      all: tableList.length,
      serving: tableList.filter((t) => t.status === 'serving').length,
      vacant: tableList.filter((t) => t.status === 'vacant').length,
      billing: tableList.filter((t) => t.status === 'billing').length,
      cleaning: tableList.filter((t) => t.status === 'cleaning').length,
    };
  }, [tableList]);

  // Filtered tables
  const filteredTables = React.useMemo(() => {
    if (activeZoneFilter === 'all') return tableList;
    return tableList.filter((t) => t.status === activeZoneFilter);
  }, [tableList, activeZoneFilter]);

  const selectedTable: WaiterTable = tables[selectedTableId] || tables['04'] || tableList[0];

  const handleSelectTable = (id: string) => {
    setSelectedTable(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSheetOpen(true);
    }
  };

  const allDishes = React.useMemo(() => {
    if (!selectedTable) return [];
    return [...selectedTable.confirmedItems, ...selectedTable.pendingItems];
  }, [selectedTable]);

  const servedCount = allDishes.filter((d) => d.status === 'served').length;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
      {/* LEFT COLUMN: FILTER PILLS & TABLE GRID */}
      <div className="w-full lg:w-[66%] xl:w-[68%] flex flex-col gap-4">
        {/* FILTER PILLS */}
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            onClick={() => setZoneFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs',
              activeZoneFilter === 'all'
                ? 'bg-ops-ink text-white border-ops-ink'
                : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg'
            )}
          >
            <span>Tất cả</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeZoneFilter === 'all' ? 'bg-white/20 text-white' : 'bg-sand-100 text-ops-muted'
              )}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setZoneFilter('serving')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs',
              activeZoneFilter === 'serving'
                ? 'bg-ops-ink text-white border-ops-ink'
                : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-ops-ink" />
            <span>Đang có khách</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeZoneFilter === 'serving' ? 'bg-white/20 text-white' : 'bg-sand-100 text-ops-muted'
              )}
            >
              {counts.serving}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setZoneFilter('vacant')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs',
              activeZoneFilter === 'vacant'
                ? 'bg-ops-ink text-white border-ops-ink'
                : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Bàn trống</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeZoneFilter === 'vacant' ? 'bg-white/20 text-white' : 'bg-sand-100 text-ops-muted'
              )}
            >
              {counts.vacant}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setZoneFilter('billing')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs',
              activeZoneFilter === 'billing'
                ? 'bg-ops-ink text-white border-ops-ink'
                : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Chờ thanh toán</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeZoneFilter === 'billing' ? 'bg-white/20 text-white' : 'bg-sand-100 text-ops-muted'
              )}
            >
              {counts.billing}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setZoneFilter('cleaning')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs',
              activeZoneFilter === 'cleaning'
                ? 'bg-ops-ink text-white border-ops-ink'
                : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-sand-400" />
            <span>Cần dọn</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeZoneFilter === 'cleaning' ? 'bg-white/20 text-white' : 'bg-sand-100 text-ops-muted'
              )}
            >
              {counts.cleaning}
            </span>
          </button>
        </div>

        {/* TABLE CARDS GRID */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-ops-border shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 py-1">
            {filteredTables.map((table) => {
              const isSelected = table.id === selectedTableId;
              const isServing = table.status === 'serving';
              const isBilling = table.status === 'billing';
              const isCleaning = table.status === 'cleaning';
              const isVacant = table.status === 'vacant';

              let borderStyle = 'border-ops-border hover:border-sand-400';
              if (isBilling) borderStyle = 'border-amber-300 hover:border-amber-400';
              if (isSelected) {
                borderStyle = 'border-2 border-ops-brand ring-2 ring-ops-brand/10 shadow-xs';
              }

              const dishCount = table.confirmedItems.length + table.pendingItems.length;

              return (
                <div
                  key={table.id}
                  onClick={() => handleSelectTable(table.id)}
                  className={cn(
                    'group relative flex flex-col justify-between h-[110px] p-3.5 rounded-xl bg-white border cursor-pointer transition-all text-left',
                    borderStyle
                  )}
                >
                  {/* Selected Indicator Badge */}
                  {isSelected ? (
                    <div className="absolute -top-2.5 right-3 bg-ops-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>Đang chọn</span>
                    </div>
                  ) : null}

                  {/* Top: Table Name & Capacity */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-ink">{table.name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-ops-border bg-ops-bg text-ink">
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isServing && 'bg-ops-ink',
                          isVacant && 'bg-emerald-500',
                          isBilling && 'bg-amber-500',
                          isCleaning && 'bg-sand-400'
                        )}
                      />
                      {table.seats} chỗ
                    </span>
                  </div>

                  {/* Bottom: Elapsed Time & Dish Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-ops-border/50 text-xs text-ops-muted">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-sand-500" />
                      {isVacant ? 'Trống' : table.elapsed}
                    </span>
                    <span className="font-bold text-ink text-xs">
                      {isVacant ? '0 món' : `${dishCount} món`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN / PANEL: TABLE DETAILS (DESKTOP) */}
      <div className="hidden lg:flex w-full lg:w-[34%] xl:w-[32%] flex-col gap-4">
        <div className="bg-white rounded-xl p-5 border border-ops-border shadow-xs flex flex-col gap-4 sticky top-20">
          {/* Header with Table ID & Status Pill */}
          <div className="flex items-start justify-between border-b border-ops-border pb-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-ops-brand">
                Chi tiết bàn phục vụ
              </span>
              <h2 className="text-2xl font-black text-ink tracking-tight mt-0.5">
                {selectedTable.name}
              </h2>
              <span className="text-xs text-ops-muted mt-0.5">
                {selectedTable.zone} • {selectedTable.seats} chỗ ngồi
              </span>
            </div>

            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                selectedTable.status === 'serving' && 'border-sand-300 bg-sand-100 text-ink',
                selectedTable.status === 'billing' && 'border-amber-200 bg-amber-50 text-amber-800',
                selectedTable.status === 'cleaning' && 'border-sand-300 bg-ops-bg text-ops-muted',
                selectedTable.status === 'vacant' && 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  selectedTable.status === 'serving' && 'bg-ops-ink',
                  selectedTable.status === 'billing' && 'bg-amber-500',
                  selectedTable.status === 'cleaning' && 'bg-sand-400',
                  selectedTable.status === 'vacant' && 'bg-emerald-500'
                )}
              />
              {selectedTable.statusText}
            </div>
          </div>

          {/* Quick Meta Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-ops-bg/80 p-2.5 rounded-lg border border-ops-border">
              <span className="text-[11px] text-ops-muted block">Nhân viên</span>
              <span className="font-semibold text-ink mt-0.5 block">{selectedTable.server}</span>
            </div>
            <div className="bg-ops-bg/80 p-2.5 rounded-lg border border-ops-border">
              <span className="text-[11px] text-ops-muted block">Thời gian vào</span>
              <span className="font-semibold text-ink mt-0.5 block">
                {selectedTable.timeIn} ({selectedTable.elapsed})
              </span>
            </div>
          </div>

          {/* Quick Status Changer */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-ops-muted uppercase tracking-wider">
              Cập nhật trạng thái bàn
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'serving', label: 'Đang dùng' },
                  { id: 'billing', label: 'Chờ tính tiền' },
                  { id: 'cleaning', label: 'Cần dọn' },
                  { id: 'vacant', label: 'Bàn trống' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    updateTableStatus(selectedTable.id, st.id);
                    showToast(`Đã chuyển ${selectedTable.name} sang "${st.label}"`);
                  }}
                  className={cn(
                    'py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all',
                    selectedTable.status === st.id
                      ? 'bg-ops-brand text-white border-ops-brand shadow-xs'
                      : 'bg-white text-ops-muted border-ops-border hover:bg-ops-bg hover:text-ink'
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Progress */}
          <div className="flex flex-col gap-2 pt-2 border-t border-ops-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-ops-brand" />
                Tiến độ món ({allDishes.length} món)
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
                  allDishes.length === 0
                    ? 'bg-sand-100 text-ops-muted border-sand-200'
                    : servedCount === allDishes.length
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {allDishes.length === 0
                  ? 'Chưa gọi món'
                  : `${servedCount}/${allDishes.length} Đã lên món`}
              </span>
            </div>

            {/* Dishes Mini List */}
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {allDishes.length === 0 ? (
                <div className="p-4 text-center text-xs text-ops-muted border border-dashed border-ops-border rounded-lg bg-ops-bg/40">
                  Chưa có món ăn nào trong order.
                  <br />
                  <span className="text-[11px] text-ops-brand font-medium mt-1 inline-block">
                    Nhấn nút bên dưới để chọn món
                  </span>
                </div>
              ) : (
                allDishes.map((dish) => {
                  const isServed = dish.status === 'served';
                  const isCooking = dish.status === 'cooking';
                  const isSent = dish.status === 'sent';
                  const isPending = dish.status === 'pending';

                  return (
                    <div
                      key={dish.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg text-xs border',
                        isServed && 'bg-emerald-50/50 border-emerald-100',
                        isCooking && 'bg-amber-50/50 border-amber-200/50',
                        isSent && 'bg-blue-50/40 border-blue-200/40',
                        isPending && 'bg-ops-bg border-dashed border-ops-border'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isServed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        ) : isCooking ? (
                          <Clock className="h-4 w-4 text-amber-600 animate-spin flex-shrink-0" />
                        ) : isPending ? (
                          <Sparkles className="h-4 w-4 text-ops-brand flex-shrink-0" />
                        ) : (
                          <Utensils className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className="font-semibold text-ink truncate">{dish.name}</span>
                          <span className="text-[10px] text-ops-muted truncate">
                            SL: {dish.qty} • {dish.statusText}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-ink flex-shrink-0 ml-2">
                        {formatVND(dish.price * dish.qty)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-3 border-t border-ops-border">
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className="w-full py-2.5 px-4 rounded-xl bg-ops-brand hover:bg-ops-brand-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Tạo / Chỉnh sửa Order Bàn {selectedTable.id}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast(`Mở hộp thoại chuyển / gộp cho ${selectedTable.name}`);
                  useWaiterStore.setState({ isTransferModalOpen: true });
                }}
                className="py-2 px-3 rounded-lg border border-ops-border bg-white text-ops-muted hover:text-ink hover:bg-ops-bg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <GitMerge className="h-3.5 w-3.5" />
                <span>Chuyển / Gộp</span>
              </button>

              <button
                type="button"
                onClick={() => showToast(`Đã gửi lệnh in tạm tính ${selectedTable.name} tới quầy thu ngân!`)}
                className="py-2 px-3 rounded-lg border border-ops-border bg-white text-ops-muted hover:text-ink hover:bg-ops-bg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In tạm tính</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR TABLE DETAILS */}
      {mobileSheetOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div
            className="w-full bg-white rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-ops-border pb-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase text-ops-brand tracking-wider">
                  Bàn đang chọn
                </span>
                <h3 className="text-xl font-bold text-ink">{selectedTable.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="p-1 rounded-lg text-ops-muted hover:text-ink hover:bg-ops-bg"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ops-bg p-2 rounded-lg">
                <span className="text-[10px] text-ops-muted block">Trạng thái</span>
                <span className="font-bold text-ink block">{selectedTable.statusText}</span>
              </div>
              <div className="bg-ops-bg p-2 rounded-lg">
                <span className="text-[10px] text-ops-muted block">Món đã gọi</span>
                <span className="font-bold text-ink block">
                  {allDishes.length} món ({servedCount} đã phục vụ)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileSheetOpen(false);
                  setActiveTab('order');
                }}
                className="w-full py-3 rounded-xl bg-ops-brand text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Gọi món cho Bàn {selectedTable.id}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileSheetOpen(false);
                  setActiveTab('tracking');
                  useWaiterStore.getState().setTrackingTableFilter(selectedTable.id);
                }}
                className="w-full py-2.5 rounded-xl border border-ops-border bg-white text-ink font-semibold text-xs flex items-center justify-center gap-2"
              >
                <span>Xem tiến độ bếp Bàn {selectedTable.id}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
