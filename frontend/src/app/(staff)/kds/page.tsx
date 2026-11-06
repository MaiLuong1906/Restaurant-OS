'use client';

import * as React from 'react';
import { Ticket, Batch } from '@/types';
import { kdsService } from '@/services/mock';
import { KdsTicketCard } from '@/components/kds/KdsTicketCard';
import { KdsBatchCard } from '@/components/kds/KdsBatchCard';
import { RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';

export default function KitchenDisplayScreen() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'ticket' | 'batch'>('ticket');

  // Quản lý Toast và Hoàn tác 5 giây
  const [undoToast, setUndoToast] = React.useState<{
    id: string;
    message: string;
    targetType: 'ticket' | 'batch';
    targetId: string;
    snapshot: Ticket[];
  } | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchTickets = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kdsService.getTickets();
      setTickets(data);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách đơn bếp');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTickets();
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

    // Hiển thị Toast Hoàn tác 5s
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setUndoToast({
      id: crypto.randomUUID(),
      message: `Đã hoàn tất ticket #${ticketId}`,
      targetType: 'ticket',
      targetId: ticketId,
      snapshot,
    });

    undoTimeoutRef.current = setTimeout(async () => {
      try {
        await kdsService.updateTicketStatus(ticketId, 'READY', crypto.randomUUID());
      } catch (err) {
        console.error('Lỗi khi đồng bộ ticket sang READY:', err);
      }
      setUndoToast(null);
    }, 5000);
  };

  // Hoàn tất 1 mẻ kèm Hoàn tác 5s
  const handleCompleteBatch = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    const snapshot = structuredClone(tickets);
    const affectedItemIds = new Set(batch.itemIds);

    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) => (affectedItemIds.has(i.id) ? { ...i, status: 'READY' } : i)),
      }))
    );

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setUndoToast({
      id: crypto.randomUUID(),
      message: `Đã hoàn tất mẻ ${batch.dishName} (${batch.totalQuantity} phần)`,
      targetType: 'batch',
      targetId: batchId,
      snapshot,
    });

    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  // Nút bấm Hoàn tác
  const handleUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (undoToast) {
      setTickets(undoToast.snapshot);
      setUndoToast(null);
    }
  };

  // Lọc các ticket còn việc cần làm (chưa bưng xong hết)
  const activeTickets = tickets.filter((t) =>
    t.items.some((i) => i.status === 'WAITING' || i.status === 'READY')
  );

  return (
    <div className="min-h-screen bg-ops-bg text-ops-ink flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 px-6 bg-white border-b border-ops-border flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-ops-brand tracking-tight">KDS BẾP TRUNG TÂM</h1>
          <span className="text-xs bg-ops-border text-ops-ink px-2.5 py-1 rounded-full font-bold">
            {activeTickets.length} ticket đang chờ
          </span>
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
              onClick={fetchTickets}
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
            {activeTickets.map((ticket) => (
              <KdsTicketCard
                key={ticket.id}
                ticket={ticket}
                onComplete={handleCompleteTicket}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <KdsBatchCard
                key={batch.id}
                batch={batch}
                onComplete={handleCompleteBatch}
              />
            ))}
          </div>
        )}
      </main>

      {/* Toast Hoàn Tác 5 Giây */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141210] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-amber-300 font-bold text-xs rounded transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Hoàn tác (5s)</span>
          </button>
        </div>
      )}
    </div>
  );
}
