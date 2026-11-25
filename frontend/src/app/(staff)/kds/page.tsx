'use client';

import * as React from 'react';
import Link from 'next/link';
import { Ticket, Batch, OrderChangeAlertData } from '@/types';
import { kdsService as mockKdsService } from '@/services/mock';
import {
  ApiKdsService,
  KdsService,
  applyKdsOrderStatusEvent,
  filterActiveTickets,
  sortKdsTickets,
} from '@/services/kds';
import { getStompClient } from '@/lib/stomp';
import { useAuthStore } from '@/stores/useAuthStore';
import { KdsTicketCard } from '@/components/kds/KdsTicketCard';
import { KdsBatchCard } from '@/components/kds/KdsBatchCard';
import { TicketDetailDrawer } from '@/components/kds/TicketDetailDrawer';
import { OrderChangeAlert } from '@/components/kds/OrderChangeAlert';
import { RotateCcw, AlertCircle, RefreshCw, Bell } from 'lucide-react';

const isLiveMode = process.env.NEXT_PUBLIC_KDS_MODE === 'live';
const kdsService: KdsService = isLiveMode ? new ApiKdsService() : mockKdsService;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const PENDING_COMPLETE_KEY = 'kds_pending_complete_ticket';

type PendingCompletePayload =
  | {
      targetType?: 'ticket';
      ticketId: string;
      requestId: string;
    }
  | {
      targetType: 'batch';
      itemIds: string[];
      requestId: string;
    };

function readPendingComplete(): PendingCompletePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_COMPLETE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCompletePayload;
    if (!parsed?.requestId) return null;
    if (parsed.targetType === 'batch' && Array.isArray(parsed.itemIds) && parsed.itemIds.length > 0) {
      return parsed;
    }
    if ('ticketId' in parsed && parsed.ticketId) {
      return parsed;
    }
  } catch {
    // ignore storage parse error
  }
  return null;
}

function writePendingComplete(payload: PendingCompletePayload | null) {
  if (typeof window === 'undefined') return;
  try {
    if (payload) {
      window.sessionStorage.setItem(PENDING_COMPLETE_KEY, JSON.stringify(payload));
    } else {
      window.sessionStorage.removeItem(PENDING_COMPLETE_KEY);
    }
  } catch {
    // ignore storage error
  }
}

function flushPendingCompleteKeepalive(): Promise<void> | null {
  const pending = readPendingComplete();
  if (!pending) return null;
  writePendingComplete(null);

  if (!isLiveMode) {
    if (pending.targetType === 'batch') {
      return kdsService.completeBatch(pending.itemIds, pending.requestId).then(() => undefined).catch(() => undefined);
    }
    return kdsService.updateTicketStatus(pending.ticketId, 'READY', pending.requestId).then(() => undefined).catch(() => undefined);
  }

  const token = useAuthStore.getState().getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': pending.requestId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (pending.targetType === 'batch') {
    return fetch(`${API_BASE_URL}/kds/batches/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemIds: pending.itemIds }),
      keepalive: true,
    })
      .then(() => undefined)
      .catch(() => undefined);
  }

  return fetch(`${API_BASE_URL}/kds/tickets/${pending.ticketId}/complete`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({}),
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

export default function KitchenDisplayScreen() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [alerts, setAlerts] = React.useState<OrderChangeAlertData[]>([]);
  const [activeAlertId, setActiveAlertId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'ticket' | 'batch'>('ticket');
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [completingBatchId, setCompletingBatchId] = React.useState<string | null>(null);

  // Quản lý Toast và Hoàn tác 5 giây
  const [undoToast, setUndoToast] = React.useState<{
    id: string;
    message: string;
    targetType: 'ticket' | 'batch';
    targetId: string;
    snapshot: Ticket[];
  } | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchTickets = React.useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const [ticketsData, alertsData] = await Promise.all([
        kdsService.getTickets(),
        kdsService.getPendingOrderChanges(),
      ]);
      setTickets(ticketsData);
      setAlerts(alertsData);
      if (alertsData.length > 0) {
        setActiveAlertId(alertsData[0].id);
      }
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách đơn bếp');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    const init = async () => {
      const pendingFlush = flushPendingCompleteKeepalive();
      if (pendingFlush) {
        await pendingFlush;
      }
      await fetchTickets();
    };
    init();

    // Flush thao tác Hoàn tất đang chờ trong 5s khi reload / đóng tab / ẩn trang
    const handleBeforeUnload = () => {
      flushPendingCompleteKeepalive();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingCompleteKeepalive();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Live mode: subscribe trực tiếp STOMP /topic/kds/orders + giữ poll REST K1 mỗi 10s làm fallback
    // (Thống nhất hẳn sang useKdsStore vẫn để sprint sau)
    let intervalId: NodeJS.Timeout | null = null;
    let stompSub: { unsubscribe: () => void } | null = null;
    const client = isLiveMode ? getStompClient() : null;
    const prevOnConnect = client?.onConnect;

    if (isLiveMode && client) {
      const subscribeOrders = () => {
        stompSub?.unsubscribe();
        stompSub = client.subscribe('/topic/kds/orders', (message: { body: string }) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload?.action === 'UPDATE_STATUS' && payload?.data?.id && payload?.data?.status) {
              setTickets((prev) =>
                applyKdsOrderStatusEvent(prev, payload.data.id, payload.data.status)
              );
            } else if (payload?.action === 'CREATE_ITEM') {
              fetchTickets(true);
            }
          } catch (e) {
            console.error('[KDS STOMP] Parse message error:', e);
          }
        });
      };

      client.onConnect = (frame) => {
        if (prevOnConnect) prevOnConnect(frame);
        subscribeOrders();
      };

      if (client.connected) {
        subscribeOrders();
      } else if (!client.active) {
        client.activate();
      }

      intervalId = setInterval(() => {
        fetchTickets(true);
      }, 10000);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
      stompSub?.unsubscribe();
      if (client && prevOnConnect !== undefined) {
        client.onConnect = prevOnConnect;
      }
    };
  }, [fetchTickets]);

  // Thuật toán gom món thành mẻ (Batch Cooking)
  const batches: Batch[] = React.useMemo(() => {
    const map = new Map<string, Batch>();

    tickets.forEach((ticket) => {
      ticket.items.forEach((item) => {
        // Chỉ gom các món WAITING
        if (item.status !== 'WAITING') return;

        // Luật gộp: Cùng món + cùng ghi chú + cùng dị ứng (dị ứng không gộp với không dị ứng)
        const allergyKey = item.allergy?.trim() || 'NO_ALLERGY';
        const noteKey = item.notes?.trim() || 'NO_NOTE';
        const key = `${item.dishId}_${allergyKey}_${noteKey}`;

        if (!map.has(key)) {
          map.set(key, {
            id: `batch-${key}`,
            dishId: item.dishId,
            dishName: item.dishName,
            totalQuantity: 0,
            notes: item.notes,
            allergy: item.allergy,
            status: 'WAITING',
            slaDeadline: item.slaDeadline,
            itemIds: [],
            items: [],
          });
        }

        const b = map.get(key)!;
        b.totalQuantity += item.quantity;
        b.itemIds.push(item.id);
        b.items.push(item);

        // Lấy SLA gấp nhất
        if (item.slaDeadline && (!b.slaDeadline || item.slaDeadline < b.slaDeadline)) {
          b.slaDeadline = item.slaDeadline;
        }
      });
    });

    return Array.from(map.values());
  }, [tickets]);

  // Hoàn tất 1 ticket kèm Hoàn tác 5s
  const handleCompleteTicket = (ticketId: string) => {
    const snapshot = structuredClone(tickets);
    const requestId = crypto.randomUUID();

    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'READY',
              items: t.items.map((i) => (i.status === 'WAITING' ? { ...i, status: 'READY' } : i)),
            }
          : t
      )
    );

    // Nếu trước đó có ticket khác đang chờ 5s thì flush ngay trước khi ghi đè
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      flushPendingCompleteKeepalive();
    }

    writePendingComplete({ ticketId, requestId });

    setUndoToast({
      id: requestId,
      message: `Đã hoàn tất ticket #${ticketId}`,
      targetType: 'ticket',
      targetId: ticketId,
      snapshot,
    });

    undoTimeoutRef.current = setTimeout(async () => {
      const stillPending = readPendingComplete();
      setUndoToast(null);
      if (!stillPending || stillPending.requestId !== requestId) return;
      writePendingComplete(null);
      try {
        const updatedTicket = await kdsService.updateTicketStatus(ticketId, 'READY', requestId);
        setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
      } catch (err) {
        console.error('Lỗi khi đồng bộ ticket sang READY:', err);
        setTickets(snapshot);
        setError((err as Error).message || 'Không thể hoàn tất ticket');
      }
    }, 5000);
  };

  // Báo sự cố 1 món (K4 REJECTED) kèm lý do bắt buộc 5-200 ký tự
  const handleReportIncident = async (ticketId: string, itemId: string, reason: string) => {
    const updatedTicket = await kdsService.updateItemStatus(
      ticketId,
      itemId,
      'REJECTED',
      crypto.randomUUID(),
      reason
    );
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  // Hoàn tất 1 mẻ kèm Hoàn tác 5s
  const handleCompleteBatch = (batchId: string) => {
    if (completingBatchId === batchId) return;
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    const snapshot = structuredClone(tickets);
    const affectedItemIds = new Set(batch.itemIds);
    const requestId = crypto.randomUUID();

    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) => (affectedItemIds.has(i.id) ? { ...i, status: 'READY' } : i)),
      }))
    );

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      if (isLiveMode) {
        flushPendingCompleteKeepalive();
      }
    }

    if (isLiveMode) {
      writePendingComplete({ targetType: 'batch', itemIds: batch.itemIds, requestId });
    }

    setUndoToast({
      id: requestId,
      message: `Đã hoàn tất mẻ ${batch.dishName} (${batch.totalQuantity} phần)`,
      targetType: 'batch',
      targetId: batchId,
      snapshot,
    });

    undoTimeoutRef.current = setTimeout(async () => {
      if (!isLiveMode) {
        setUndoToast(null);
        return;
      }

      const stillPending = readPendingComplete();
      setUndoToast(null);
      if (!stillPending || stillPending.requestId !== requestId) return;
      writePendingComplete(null);

      setCompletingBatchId(batchId);
      try {
        const updatedTickets = await kdsService.completeBatch(batch.itemIds, requestId);
        const updatedById = new Map(updatedTickets.map((t) => [t.id, t]));
        setTickets((prev) => prev.map((t) => updatedById.get(t.id) ?? t));
      } catch (err) {
        console.error('Lỗi khi hoàn tất mẻ nấu:', err);
        setTickets(snapshot);
        setError((err as Error).message || 'Không thể hoàn tất mẻ nấu');
      } finally {
        setCompletingBatchId(null);
      }
    }, 5000);
  };

  // Xử lý xác nhận cảnh báo hủy/sửa
  const handleConfirmAlert = async (alertId: string) => {
    try {
      const { ticket } = await kdsService.acknowledgeOrderChange(alertId);
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setActiveAlertId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeferAlert = (alertId: string) => {
    kdsService.deferOrderChange(alertId);
    setActiveAlertId(null);
  };

  // Nút bấm Hoàn tác
  const handleUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    writePendingComplete(null);
    if (undoToast) {
      setTickets(undoToast.snapshot);
      setUndoToast(null);
    }
  };

  // Lọc các ticket còn việc cần làm (chưa bưng xong hết) và sắp xếp: dị ứng lên đầu, quá hạn/gần SLA lên trước
  const activeTickets = React.useMemo(() => {
    return sortKdsTickets(filterActiveTickets(tickets));
  }, [tickets]);

  const pendingAlert = alerts.find((a) => a.id === activeAlertId) || null;

  return (
    <div className="min-h-screen bg-ops-bg text-ops-ink flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 px-6 bg-white border-b border-ops-border flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-ops-brand tracking-tight">KDS BẾP TRUNG TÂM</h1>
          <span className="text-xs bg-ops-border text-ops-ink px-2.5 py-1 rounded-full font-bold">
            {activeTickets.length} ticket đang chờ
          </span>

          {/* Nút Chuông cảnh báo */}
          <button
            type="button"
            onClick={() => {
              if (alerts.length > 0) {
                setActiveAlertId(alerts[0].id);
              }
            }}
            className="relative p-2 rounded-lg border border-ops-border hover:bg-neutral-100 text-[#2B2118] flex items-center gap-1.5 text-xs font-bold"
            aria-label="Cảnh báo thay đổi đơn"
          >
            <Bell className="h-4 w-4" />
            <span>Cảnh báo</span>
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-danger-600 text-white text-[11px] font-black flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Nút Refresh tay */}
          <button
            type="button"
            onClick={() => fetchTickets()}
            className="min-h-[48px] h-12 px-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 text-[#2B2118] flex items-center gap-1.5 text-xs font-bold transition-colors"
            aria-label="Làm mới danh sách ticket"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          {/* Đường vào K1 Kho bếp */}
          <Link
            href="/kds/stock"
            className="min-h-[48px] h-12 px-3.5 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 text-[#2B2118] flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <span>Kho</span>
          </Link>

          {/* Đường vào A7 Hết món */}
          <Link
            href="/kds/sold-out"
            className="min-h-[48px] h-12 px-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 text-[#2B2118] flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <span>Hết món</span>
          </Link>

          {/* Đường vào A9 Ghi hủy */}
          <Link
            href="/kds/waste"
            className="min-h-[48px] h-12 px-3 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 text-[#2B2118] flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <span>Ghi hủy</span>
          </Link>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-ops-bg p-1 rounded-lg border border-ops-border text-sm">
          <button
            type="button"
            onClick={() => setViewMode('ticket')}
            className={`px-4 py-1.5 rounded-md font-bold transition-all ${
              viewMode === 'ticket' ? 'bg-white shadow-xs text-ops-brand' : 'text-ops-muted hover:text-ops-ink'
            }`}
          >
            Theo ticket
          </button>
          <button
            type="button"
            onClick={() => setViewMode('batch')}
            className={`px-4 py-1.5 rounded-md font-bold transition-all ${
              viewMode === 'batch' ? 'bg-white shadow-xs text-ops-brand' : 'text-ops-muted hover:text-ops-ink'
            }`}
          >
            Theo mẻ nấu ({batches.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-ops-muted">
            <RefreshCw className="h-8 w-8 animate-spin text-ops-brand" />
            <p className="text-sm font-semibold">Đang nạp dữ liệu đơn bếp...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center max-w-md mx-auto my-12">
            <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-2" />
            <h2 className="font-bold text-lg mb-1">Đã xảy ra sự cố</h2>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchTickets()}
              className="px-4 py-2 bg-ops-brand text-white font-bold rounded-lg text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-ops-muted border-2 border-dashed border-ops-border rounded-xl">
            <p className="text-lg font-bold">Bếp đang trống!</p>
            <p className="text-sm">Hiện tại không có đơn gọi món nào cần chế biến.</p>
          </div>
        ) : viewMode === 'ticket' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTickets.map((ticket) => {
              const hasAlert = alerts.some((a) => a.ticketId === ticket.id && !a.acknowledged);
              return (
                <KdsTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  hasPendingAlert={hasAlert}
                  onViewAlert={(tId) => {
                    const alert = alerts.find((a) => a.ticketId === tId && !a.acknowledged);
                    if (alert) setActiveAlertId(alert.id);
                  }}
                  onSelect={(t) => setSelectedTicketId(t.id)}
                  onComplete={handleCompleteTicket}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <KdsBatchCard
                key={batch.id}
                batch={batch}
                isCompleting={completingBatchId === batch.id}
                onComplete={handleCompleteBatch}
              />
            ))}
          </div>
        )}
      </main>

      {/* Toast Hoàn Tác 5 Giây */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141210] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          <span className="text-sm font-medium">{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-amber-300 font-bold text-xs rounded transition-all active:scale-98"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Hoàn tác (5s)</span>
          </button>
        </div>
      )}

      {/* A5 Ticket Detail Drawer */}
      <TicketDetailDrawer
        ticket={tickets.find((t) => t.id === selectedTicketId) || null}
        open={Boolean(selectedTicketId)}
        hasPendingAlert={alerts.some((a) => a.ticketId === selectedTicketId && !a.acknowledged)}
        onClose={() => setSelectedTicketId(null)}
        onComplete={(ticketId) => {
          handleCompleteTicket(ticketId);
          setSelectedTicketId(null);
        }}
        onReportIncident={handleReportIncident}
      />

      {/* A6 Order Change Alert Modal */}
      <OrderChangeAlert
        alert={pendingAlert}
        open={Boolean(pendingAlert)}
        onConfirm={handleConfirmAlert}
        onDefer={handleDeferAlert}
      />
    </div>
  );
}
