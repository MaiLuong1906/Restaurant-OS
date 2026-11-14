'use client';

import * as React from 'react';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowLeft,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import { useWaiterStore } from '@/stores/useWaiterStore';
import { WaiterOrderItem } from '@/types/waiter';
import { cn } from '@/lib/utils';

export function WaiterOrderTracking() {
  const tables = useWaiterStore((s) => s.tables);
  const setSelectedTable = useWaiterStore((s) => s.setSelectedTable);
  const trackingTableFilter = useWaiterStore((s) => s.trackingTableFilter);
  const setTrackingTableFilter = useWaiterStore((s) => s.setTrackingTableFilter);
  const allergyAlerts = useWaiterStore((s) => s.allergyAlerts);
  const isSoundAlertEnabled = useWaiterStore((s) => s.isSoundAlertEnabled);
  const toggleSoundAlert = useWaiterStore((s) => s.toggleSoundAlert);
  const confirmItemServed = useWaiterStore((s) => s.confirmItemServed);
  const pingKitchenItem = useWaiterStore((s) => s.pingKitchenItem);
  const setActiveTab = useWaiterStore((s) => s.setActiveTab);
  const showToast = useWaiterStore((s) => s.showToast);

  const tableList = React.useMemo(() => Object.values(tables), [tables]);

  // Aggregate all items across tables or for a specific filtered table
  const filteredDishes = React.useMemo(() => {
    const list: WaiterOrderItem[] = [];
    tableList.forEach((table) => {
      // If a specific table is filtered, only include that table
      if (trackingTableFilter !== 'all' && table.id !== trackingTableFilter) {
        return;
      }
      table.confirmedItems.forEach((item) => {
        list.push(item);
      });
    });
    return list;
  }, [tableList, trackingTableFilter]);

  // 4 Kanban Columns
  const pendingItems = filteredDishes.filter((d) => d.status === 'sent' || d.status === 'pending');
  const cookingItems = filteredDishes.filter((d) => d.status === 'cooking');
  const readyItems = filteredDishes.filter((d) => d.status === 'ready');
  const delayedItems = filteredDishes.filter((d) => d.status === 'delayed');

  // Filter allergy alerts by tracking table filter
  const filteredAllergies = React.useMemo(() => {
    if (trackingTableFilter === 'all') return allergyAlerts;
    return allergyAlerts.filter((a) => a.tableId === trackingTableFilter);
  }, [allergyAlerts, trackingTableFilter]);

  const handleSelectTableFilter = (tableIdOrAll: string) => {
    setTrackingTableFilter(tableIdOrAll);
    if (tableIdOrAll !== 'all') {
      setSelectedTable(tableIdOrAll);
      showToast(`Đồng bộ tiến độ món cho Bàn ${tableIdOrAll}`);
    } else {
      showToast('Hiển thị tiến độ món của tất cả các bàn');
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header: Title, Sound & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-ops-border shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('floor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ops-border bg-ops-bg hover:bg-white text-xs font-semibold text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-ops-brand" />
            <span>Sơ đồ bàn</span>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-ink">
                Tiến Độ Chế Biến & Điều Phối Lên Món
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                KDS Realtime
              </span>
            </div>
            <span className="text-[11px] text-ops-muted">
              Giám sát trực tiếp các trạm Bếp 1, Bếp 2 & Quầy Bar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const enabled = toggleSoundAlert();
              showToast(enabled ? 'Đã bật âm thanh cảnh báo KDS' : 'Đã tắt âm báo');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ops-border bg-white hover:bg-ops-bg text-xs font-semibold text-ink transition-colors shadow-xs"
          >
            {isSoundAlertEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-ops-brand" />
                <span>Âm báo: Bật</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-ops-muted" />
                <span>Âm báo: Tắt</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => showToast('Đang kết nối lại trạm KDS... Dữ liệu đã đồng bộ mới nhất')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ops-brand hover:bg-ops-brand-dark text-white text-xs font-bold transition-colors shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Đồng bộ KDS</span>
          </button>
        </div>
      </div>

      {/* TABLE FILTER PILLS (Crucial for Table Switching!) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-3 rounded-xl border border-ops-border shadow-xs no-scrollbar">
        <span className="text-xs font-bold text-ops-muted uppercase tracking-wider whitespace-nowrap pl-1">
          Lọc theo bàn:
        </span>

        <button
          type="button"
          onClick={() => handleSelectTableFilter('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shadow-xs',
            trackingTableFilter === 'all'
              ? 'bg-ops-brand text-white'
              : 'bg-ops-bg text-ops-muted hover:bg-sand-200 hover:text-ink'
          )}
        >
          Tất cả các bàn
        </button>

        {tableList.map((t) => {
          const isFilterActive = trackingTableFilter === t.id;
          const dishCount = t.confirmedItems.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTableFilter(t.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-xs',
                isFilterActive
                  ? 'bg-ops-brand text-white'
                  : 'bg-ops-bg text-ops-muted hover:bg-sand-200 hover:text-ink'
              )}
            >
              <span>{t.name}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isFilterActive ? 'bg-white/20 text-white' : 'bg-sand-200 text-ops-muted'
                )}
              >
                {dishCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4 KANBAN COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {/* COLUMN 1: CHỜ TIẾP NHẬN */}
        <div className="flex flex-col gap-3 rounded-xl bg-ops-bg p-3.5 border border-ops-border">
          <div className="flex items-center justify-between border-b border-ops-border/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sand-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Chờ tiếp nhận</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-ops-muted border border-ops-border">
              {pendingItems.length} món
            </span>
          </div>

          <div className="flex flex-col gap-2.5 min-h-[140px]">
            {pendingItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-ops-muted bg-white/60 rounded-lg border border-dashed border-ops-border">
                Không có món nào chờ tiếp nhận.
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-ops-border shadow-xs flex flex-col gap-2 text-left"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded bg-ops-brand-light text-ops-brand text-[11px] font-bold">
                      Bàn {item.tableId}
                    </span>
                    <span className="text-[11px] text-ops-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.waitMinutes || 1}p
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-ink">
                      {item.qty}x {item.name}
                    </span>
                    <span className="text-[11px] text-ops-muted mt-0.5">{item.station}</span>
                    {item.note ? (
                      <span className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded mt-1">
                        Ghi chú: {item.note}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: BẾP ĐANG NẤU */}
        <div className="flex flex-col gap-3 rounded-xl bg-ops-bg p-3.5 border border-ops-border">
          <div className="flex items-center justify-between border-b border-ops-border/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Bếp đang nấu</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {cookingItems.length} món
            </span>
          </div>

          <div className="flex flex-col gap-2.5 min-h-[140px]">
            {cookingItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-ops-muted bg-white/60 rounded-lg border border-dashed border-ops-border">
                Không có món nào đang nấu.
              </div>
            ) : (
              cookingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-xs flex flex-col gap-2 text-left"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded bg-ops-brand-light text-ops-brand text-[11px] font-bold">
                      Bàn {item.tableId}
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 animate-spin" />
                      {item.waitMinutes || 6}p
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-ink">
                      {item.qty}x {item.name}
                    </span>
                    <span className="text-[11px] text-ops-muted mt-0.5">{item.station}</span>
                    {item.note ? (
                      <span className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded mt-1">
                        Ghi chú: {item.note}
                      </span>
                    ) : null}
                  </div>
                  <div className="pt-2 border-t border-ops-border/50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        pingKitchenItem(item.tableId, item.id);
                        showToast(`Đã hối bếp cho ${item.name} (Bàn ${item.tableId})!`);
                      }}
                      className="px-2.5 py-1 rounded bg-ops-bg hover:bg-sand-200 text-ink text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <BellRing className="h-3 w-3 text-ops-brand" />
                      <span>Hối bếp</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: SẴN SÀNG LÊN MÓN */}
        <div className="flex flex-col gap-3 rounded-xl bg-ops-bg p-3.5 border border-ops-border">
          <div className="flex items-center justify-between border-b border-ops-border/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Sẵn sàng lên món</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {readyItems.length} món
            </span>
          </div>

          <div className="flex flex-col gap-2.5 min-h-[140px]">
            {readyItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-ops-muted bg-white/60 rounded-lg border border-dashed border-ops-border">
                Chưa có món nào sẵn sàng để lên bàn.
              </div>
            ) : (
              readyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs flex flex-col gap-2 text-left"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                      Bàn {item.tableId}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Xong {item.waitMinutes || 2}p trước
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-ink">
                      {item.qty}x {item.name}
                    </span>
                    <span className="text-[11px] text-ops-muted mt-0.5">{item.station}</span>
                  </div>
                  <div className="pt-2 border-t border-ops-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        confirmItemServed(item.tableId, item.id);
                        showToast(`Đã xác nhận phục vụ ${item.name} cho Bàn ${item.tableId}!`);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Xác nhận lên món</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 4: CẢNH BÁO TRỄ SLA */}
        <div className="flex flex-col gap-3 rounded-xl bg-ops-bg p-3.5 border border-ops-border">
          <div className="flex items-center justify-between border-b border-ops-border/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-ops-alert animate-ping" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ops-alert">Quá hạn SLA</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-ops-alert border border-rose-200">
              {delayedItems.length} món
            </span>
          </div>

          <div className="flex flex-col gap-2.5 min-h-[140px]">
            {delayedItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-ops-muted bg-white/60 rounded-lg border border-dashed border-ops-border">
                Không có món nào bị trễ SLA.
              </div>
            ) : (
              delayedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-rose-300 shadow-xs flex flex-col gap-2 text-left"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-ops-alert text-[11px] font-bold">
                      Bàn {item.tableId}
                    </span>
                    <span className="text-[11px] text-ops-alert font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Trễ {item.waitMinutes || 20}p
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-ink">
                      {item.qty}x {item.name}
                    </span>
                    <span className="text-[11px] text-ops-muted mt-0.5">{item.station}</span>
                    <span className="text-[10px] text-ops-alert font-semibold mt-1">
                      ⚠️ Quá hạn thời gian cam kết của trạm
                    </span>
                  </div>
                  <div className="pt-2 border-t border-ops-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        pingKitchenItem(item.tableId, item.id);
                        showToast(`⚡ ĐÃ BẮN TÍN HIỆU HỐI BẾP KHẨN CẤP: ${item.name} (Bàn ${item.tableId})!`);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-ops-alert hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Flame className="h-4 w-4" />
                      <span>Hối bếp khẩn cấp</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ALLERGY & SPECIAL REQUESTS SECTION */}
      <div className="flex flex-col gap-3 bg-white p-4 sm:p-5 rounded-xl border border-ops-border shadow-xs">
        <div className="flex items-center justify-between border-b border-ops-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-ops-alert" />
            <h3 className="text-sm sm:text-base font-bold text-ink">
              Cảnh Báo Dị Ứng & Yêu Cầu Đặc Biệt ({filteredAllergies.length})
            </h3>
          </div>
          <span className="text-xs text-ops-muted font-medium">
            Đồng bộ trực tiếp với màn hình trạm trưởng KDS
          </span>
        </div>

        {filteredAllergies.length === 0 ? (
          <div className="p-4 text-center text-xs text-ops-muted bg-ops-bg rounded-lg">
            Không có lưu ý dị ứng nào cho bàn đang chọn.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredAllergies.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl border border-ops-border bg-ops-bg/40 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded bg-ops-brand-light text-ops-brand text-xs font-bold">
                    Bàn {alert.tableId}
                  </span>
                  <span className="text-[11px] text-ops-muted">{alert.time}</span>
                </div>

                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-xs font-bold text-ink">{alert.title}</span>
                  <p className="text-[11px] text-ops-muted leading-relaxed">{alert.details}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-ops-border text-[11px]">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{alert.stationRecipient}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast(`Chi tiết yêu cầu: ${alert.title}`)}
                    className="text-ops-brand font-bold hover:underline ml-2"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
