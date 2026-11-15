'use client';

import * as React from 'react';
import { AlertTriangle, Check, Circle, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { TopBar } from '@/components/ui/TopBar';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import {
  DEMO_TABLES,
  DEMO_TABLE_ITEMS,
  type DemoTable,
  type DemoTableItem,
  type TableArea,
  type TableItemStatus,
  type TableStatus,
} from '@/lib/demo-data';
import { cn, formatVND } from '@/lib/utils';

/**
 * Demo v5 — sơ đồ bàn POS, app vận hành ≠ website.
 * Trang website /restaurant-website KHÔNG đổi. Trang này dùng font-ops + token ops-*:
 * - Tiêu đề lớn không in hoa, số dùng .ops-nums, gạch chân dùng vàng đồng.
 * - Đỏ chỉ dành cho nút Thanh toán + cảnh báo quá SLA; các nút còn lại viền đỏ rượu
 *   (ops-outline), kể cả "Tách hóa đơn" — không còn nút trông như text thường.
 * - Trạng thái KHÔNG chỉ dựa vào màu: chấm + ký hiệu + chữ in hoa + thời gian ngồi
 *   + nhân viên phụ trách + số món đang chờ.
 * - Bàn to/nhỏ theo số chỗ ngồi (bàn 6–8 chỗ chiếm 2 cột), nền tint nhẹ theo trạng thái.
 * - Kéo-thả: chế độ thường = chuyển bàn (toast), chế độ "Chỉnh sơ đồ" = sắp xếp lại
 *   thứ tự bàn trong demo (chưa lưu layout thật). Nhấn giữ trên mobile chưa làm —
 *   xem README mục "Chưa làm".
 * - Realtime bản thật dùng WebSocket/polling; ở demo, nút "Giả lập cập nhật
 *   realtime" mô phỏng một bàn vừa có khách, kèm nháy viền để nhận biết thay đổi.
 * Sơ đồ dùng CSS grid — KHÔNG dùng Three.js. Dữ liệu mẫu, chưa nối API.
 */

type StatusFilter = 'all' | TableStatus;
type AreaFilter = 'Tất cả' | TableArea;

const STATUS_META: Record<TableStatus, { label: string; dot: string; tint: string; icon: React.ReactNode }> = {
  empty: { label: 'Bàn trống', dot: 'bg-table-empty', tint: 'bg-ops-tint-empty', icon: <Circle className="h-4 w-4" aria-hidden="true" /> },
  inuse: { label: 'Đang dùng', dot: 'bg-table-inuse', tint: 'bg-ops-tint-inuse', icon: <UtensilsCrossed className="h-4 w-4" aria-hidden="true" /> },
  overdue: { label: 'Quá SLA', dot: 'bg-ops-alert', tint: 'bg-ops-tint-overdue', icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" /> },
  cleaning: { label: 'Cần dọn', dot: 'bg-table-cleaning', tint: 'bg-ops-tint-cleaning', icon: <Sparkles className="h-4 w-4" aria-hidden="true" /> },
};

const ITEM_STATUS: Record<TableItemStatus, { label: string; dot: string }> = {
  waiting: { label: 'Chờ', dot: 'bg-ops-muted' },
  cooking: { label: 'Đang làm', dot: 'bg-ops-ink' },
  served: { label: 'Đã ra', dot: 'bg-table-empty' },
};

interface ToastState {
  message: string;
  undo?: () => void;
}

export default function DemoPosPage() {
  const [tables, setTables] = React.useState<DemoTable[]>(DEMO_TABLES);
  const [order, setOrder] = React.useState<string[]>(DEMO_TABLES.map((t) => t.id));
  const [items, setItems] = React.useState<Record<string, DemoTableItem[]>>(DEMO_TABLE_ITEMS);
  const [selectedId, setSelectedId] = React.useState<string>('t4');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [areaFilter, setAreaFilter] = React.useState<AreaFilter>('Tất cả');
  const [query, setQuery] = React.useState('');
  const [editMode, setEditMode] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [blinkId, setBlinkId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [method, setMethod] = React.useState('Tiền mặt');
  const [paid, setPaid] = React.useState('');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const tableById = new Map(tables.map((t) => [t.id, t]));
  const ordered = order.map((id) => tableById.get(id)).filter((t): t is DemoTable => Boolean(t));
  const selected = tableById.get(selectedId) ?? ordered[0];
  const selectedItems = selected ? (items[selected.id] ?? []) : [];
  const waitingCount = (id: string) => (items[id] ?? []).filter((i) => i.status !== 'served').length;

  const counts = (['empty', 'inuse', 'overdue', 'cleaning'] as TableStatus[]).reduce(
    (acc, s) => {
      acc[s] = tables.filter((t) => t.status === s && (areaFilter === 'Tất cả' || t.area === areaFilter)).length;
      return acc;
    },
    {} as Record<TableStatus, number>,
  );

  const filtered = ordered.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (areaFilter !== 'Tất cả' && t.area !== areaFilter) return false;
    if (query && !t.label.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  React.useEffect(() => {
    if (!blinkId) return;
    const timer = setTimeout(() => setBlinkId(null), 3000);
    return () => clearTimeout(timer);
  }, [blinkId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key.toLowerCase() === 'n') {
        setToast({ message: 'Đơn mới (demo) — chưa tạo đơn thật.' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = tableById.get(draggedId);
    const to = tableById.get(targetId);
    if (!from || !to) return;
    if (editMode) {
      setOrder((prev) => {
        const next = [...prev];
        const a = next.indexOf(draggedId);
        const b = next.indexOf(targetId);
        next[a] = targetId;
        next[b] = draggedId;
        return next;
      });
      setToast({ message: 'Đã sắp xếp lại sơ đồ.' });
    } else {
      setSelectedId(targetId);
      setDrawerOpen(true);
      setToast({
        message: `Đã chuyển ${from.label} sang ${to.label} (demo).`,
        undo: () => setSelectedId(draggedId),
      });
    }
    setDraggedId(null);
  };

  const cancelFirstWaitingItem = () => {
    if (!selected) return;
    const list = items[selected.id] ?? [];
    const idx = list.findIndex((i) => i.status === 'waiting');
    if (idx === -1) {
      setToast({ message: 'Bàn này không còn món đang chờ để hủy.' });
      return;
    }
    const removed = list[idx];
    setItems((prev) => ({ ...prev, [selected.id]: prev[selected.id].filter((_, i) => i !== idx) }));
    setToast({
      message: `Đã hủy món ${removed.name} — Hoàn tác trong 5 giây.`,
      undo: () => setItems((prev) => ({ ...prev, [selected.id]: [...(prev[selected.id] ?? []), removed] })),
    });
  };

  const cancelOrder = () => {
    if (!selected) return;
    const old = items[selected.id] ?? [];
    setItems((prev) => ({ ...prev, [selected.id]: [] }));
    setToast({
      message: `Đã hủy đơn ${selected.label} — Hoàn tác trong 5 giây.`,
      undo: () => setItems((prev) => ({ ...prev, [selected.id]: old })),
    });
  };

  const simulateRealtime = () => {
    setTables((prev) => prev.map((t) => (t.id === 't7' ? { ...t, status: 'inuse', guests: 2, seatedMin: 1, staff: 'Lan', total: 95000 } : t)));
    setItems((prev) => ({ ...prev, t7: [{ id: 't7i1', name: 'Trà Sen Long Nhãn', qty: 2, status: 'waiting' }] }));
    setBlinkId('t7');
    setSelectedId('t7');
    setToast({ message: 'Bàn 07 vừa có khách (mô phỏng realtime — bản thật dùng WebSocket/polling).' });
  };

  const confirmPayment = () => {
    if (!selected) return;
    setTables((prev) => prev.map((t) => (t.id === selected.id ? { ...t, status: 'cleaning', guests: 0, total: 0, seatedMin: 0, staff: '' } : t)));
    setItems((prev) => ({ ...prev, [selected.id]: [] }));
    setPaymentOpen(false);
    setPaid('');
    setToast({ message: `Đã thanh toán ${selected.label} bằng ${method}. Bàn chuyển sang Cần dọn.` });
  };

  const paidNum = Number(paid.replace(/[^0-9]/g, '')) || 0;
  const change = selected ? paidNum - selected.total : 0;

  const rail = selected ? (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ops-muted">Chi tiết đơn</p>
        <h2 className="mt-2 text-3xl font-bold text-ops-ink">{selected.label}</h2>
      </div>

      <div>
        <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
          <p className="text-sm font-semibold">Trạng thái</p>
          <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
            <span className={cn('h-2 w-2 rounded-full', STATUS_META[selected.status].dot, selected.status === 'overdue' && 'animate-blink')} aria-hidden="true" />
            {STATUS_META[selected.status].label}
          </span>
        </div>
        <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
          <p className="text-sm font-semibold">Phục vụ</p>
          <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
          <p className="shrink-0 text-sm font-bold">{selected.staff || '—'}</p>
        </div>
        <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
          <p className="text-sm font-semibold">Thời gian ngồi</p>
          <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
          <p className="ops-nums shrink-0 text-sm font-bold">{selected.seatedMin > 0 ? `${selected.seatedMin} phút` : '—'}</p>
        </div>
        <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
          <p className="text-sm font-semibold">Món đang chờ</p>
          <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
          <p className="ops-nums shrink-0 text-sm font-bold">{waitingCount(selected.id)} món</p>
        </div>
        <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
          <p className="text-sm font-semibold">Số khách</p>
          <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
          <p className="ops-nums shrink-0 text-lg font-bold">{selected.guests}</p>
        </div>
        <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
          <p className="text-sm font-semibold">Tạm tính</p>
          <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
          <p className="ops-nums shrink-0 text-lg font-bold">{formatVND(selected.total)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ops-muted">Danh sách món</h3>
        {selectedItems.length === 0 ? (
          <p className="mt-3 border border-dashed border-ops-border bg-ops-bg p-4 text-sm text-ops-muted">
            Bàn này chưa có món nào. Bàn trống thì nhân viên quét QR để gọi món, bàn cần dọn thì chờ dọn xong.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col">
            {selectedItems.map((item) => (
              <li key={item.id} className="flex items-baseline gap-3 border-b border-ops-border py-3 last:border-b-0">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', ITEM_STATUS[item.status].dot)} aria-hidden="true" />
                <span className="flex-1 text-sm font-semibold">{item.name}</span>
                <span className="ops-nums text-sm text-ops-muted">× {item.qty}</span>
                <span className="w-20 shrink-0 text-right text-xs font-semibold text-ops-muted">{ITEM_STATUS[item.status].label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button size="md" variant="ops-outline" className="w-full" onClick={() => setToast({ message: `Gộp ${selected.label} (demo) — chọn bàn đích ở sơ đồ hoặc kéo-thả bàn.` })}>Gộp bàn</Button>
        <Button size="md" variant="ops-outline" className="w-full" onClick={() => setToast({ message: `Chuyển ${selected.label} (demo) — kéo bàn này sang bàn đích trên sơ đồ.` })}>Chuyển bàn</Button>
        <Button size="md" variant="ops-outline" className="w-full" onClick={() => setToast({ message: 'Tách hóa đơn (demo) — chưa tách thật.' })}>Tách hóa đơn</Button>
        <Button size="lg" variant="ops" className="w-full" onClick={() => setPaymentOpen(true)}>Thanh toán</Button>
        <Button size="md" variant="danger" className="w-full" onClick={cancelFirstWaitingItem}>Hủy món đang chờ</Button>
        <button type="button" onClick={cancelOrder} className="flex min-h-12 w-full cursor-pointer items-center justify-center border border-ops-alert px-4 text-sm font-semibold text-ops-alert transition-colors hover:bg-ops-tint-overdue">
          Hủy đơn
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-ops-bg font-ops text-ops-ink">
      <TopBar
        left={
          <span className="flex items-center gap-2">
            <span className="text-base font-bold">Thu ngân — Sơ đồ bàn</span>
            <span className="border border-ops-border bg-ops-bg px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ops-muted">Demo</span>
          </span>
        }
        right={
          <span className="flex items-center gap-2">
            <span className="ops-nums hidden text-sm font-semibold text-ops-muted md:block">Két: 14.850.000 ₫</span>
            <button type="button" onClick={simulateRealtime} className="min-h-11 cursor-pointer border border-ops-border bg-white px-3 text-sm font-semibold hover:bg-ops-bg">
              Giả lập cập nhật realtime
            </button>
          </span>
        }
        className="border-ops-border bg-white text-ops-ink"
      />

      <main className="flex flex-1 flex-col lg:flex-row">
        <section className="min-w-0 flex-1 p-4 md:p-6">
          <p className="text-sm text-ops-muted">Trang chủ / Thu ngân / Sơ đồ bàn</p>
          <h1 className="mt-2 text-4xl font-bold">Sơ đồ bàn</h1>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc trạng thái">
              <button type="button" role="tab" aria-selected={statusFilter === 'all'} onClick={() => setStatusFilter('all')} className={cn('min-h-12 cursor-pointer border px-4 text-sm font-semibold', statusFilter === 'all' ? 'border-ops-ink bg-ops-ink text-white' : 'border-ops-border bg-white text-ops-muted hover:text-ops-ink')}>
                Tất cả ({tables.length})
              </button>
              {(['empty', 'inuse', 'overdue', 'cleaning'] as TableStatus[]).map((s) => (
                <button key={s} type="button" role="tab" aria-selected={statusFilter === s} onClick={() => setStatusFilter(s)} className={cn('flex min-h-12 cursor-pointer items-center gap-2 border px-4 text-sm font-semibold', statusFilter === s ? 'border-ops-ink bg-ops-ink text-white' : 'border-ops-border bg-white text-ops-muted hover:text-ops-ink')}>
                  <span className={cn('h-2 w-2 rounded-full', STATUS_META[s].dot)} aria-hidden="true" />
                  {STATUS_META[s].label} ({counts[s]})
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Chọn khu vực">
              {(['Tất cả', 'Tầng 1', 'Tầng 2', 'Sân vườn'] as AreaFilter[]).map((area) => (
                <button key={area} type="button" role="tab" aria-selected={areaFilter === area} onClick={() => setAreaFilter(area)} className={cn('min-h-11 cursor-pointer border-b-2 px-3 text-sm font-semibold', areaFilter === area ? 'border-ops-ink text-ops-ink' : 'border-transparent text-ops-muted hover:text-ops-ink')}>
                  {area}
                </button>
              ))}
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm bàn… (phím /)"
                className="min-h-12 flex-1 rounded-lg border border-ops-border bg-white px-4 text-sm outline-none placeholder:text-ops-muted focus:border-ops-ink"
              />
              <button type="button" onClick={() => setEditMode((v) => !v)} className={cn('min-h-12 cursor-pointer border px-4 text-sm font-semibold', editMode ? 'border-ops-ink bg-ops-ink text-white' : 'border-ops-border bg-white text-ops-muted hover:text-ops-ink')}>
                {editMode ? (<span className="flex items-center gap-1">Đang chỉnh sơ đồ <Check className="h-4 w-4" aria-hidden="true" /></span>) : 'Chỉnh sơ đồ'}
              </button>
            </div>
            {editMode ? (
              <p className="border border-dashed border-ops-border bg-white p-3 text-sm text-ops-muted">
                Chế độ chỉnh sơ đồ: kéo một bàn sang bàn khác để đổi vị trí. Tắt chế độ này thì kéo-thả sẽ là chuyển bàn.
              </p>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 border border-dashed border-ops-border bg-white p-8 text-center text-sm text-ops-muted">
              Không có bàn nào khớp bộ lọc — thử chọn khu vực hoặc trạng thái khác, hoặc xóa từ tìm kiếm.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((table) => {
                const meta = STATUS_META[table.status];
                const isSelected = table.id === selectedId;
                return (
                  <button
                    key={table.id}
                    type="button"
                    draggable
                    onDragStart={() => setDraggedId(table.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(table.id)}
                    onClick={() => {
                      setSelectedId(table.id);
                      setDrawerOpen(true);
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-lg border p-4 text-left transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ops-ink',
                      meta.tint,
                      table.seats >= 6 ? 'col-span-2 min-h-40' : 'min-h-32',
                      isSelected ? 'border-2 border-ops-ink' : 'border-ops-border hover:border-ops-muted',
                      blinkId === table.id && 'ring-2 ring-ops-alert',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-ops-border bg-white" aria-hidden="true">{meta.icon}</span>
                      <span className="ops-nums text-xl font-bold">{table.label}</span>
                    </span>
                    <span className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wide', table.status === 'overdue' ? 'text-ops-alert' : 'text-ops-muted')}>
                      <span className={cn('h-2 w-2 rounded-full', meta.dot, table.status === 'overdue' && 'animate-blink')} aria-hidden="true" />
                      {meta.label}
                    </span>
                    <span className={cn('ops-nums text-sm', table.status === 'overdue' ? 'font-bold text-ops-alert' : 'text-ops-muted')}>
                      {table.guests > 0
                        ? (table.status === 'overdue' ? `Quá SLA · Đã ngồi ${table.seatedMin} phút` : `Đã ngồi ${table.seatedMin} phút`)
                        : (table.status === 'cleaning' ? 'Chờ dọn xong' : 'Chưa có khách')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-ops-border pt-4">
            {(Object.keys(STATUS_META) as TableStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ops-muted">
                <span className={cn('h-2 w-2 rounded-full', STATUS_META[s].dot)} aria-hidden="true" />
                {STATUS_META[s].label}
              </span>
            ))}
          </div>
          <button type="button" onClick={() => setDrawerOpen(true)} className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-lg border border-ops-ink bg-white px-4 text-sm font-bold text-ops-ink lg:hidden">
            Xem chi tiết {selected?.label ?? 'bàn đã chọn'}
          </button>
        </section>

        {drawerOpen ? (
          <button type="button" aria-label="Đóng chi tiết bàn" onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-30 cursor-pointer bg-ops-ink/50 lg:hidden" />
        ) : null}
        <aside className={cn(
          'fixed inset-y-0 right-0 z-40 w-[92%] max-w-md overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:translate-x-0 lg:p-6 lg:shadow-none',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}>
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="font-bold">Chi tiết bàn</span>
            <button type="button" aria-label="Đóng" onClick={() => setDrawerOpen(false)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center"><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>
          {rail}
        </aside>
      </main>

      {selected ? (
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent title="Xác nhận thanh toán">
            <div>
              <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
                <p className="text-sm font-semibold">Bàn</p>
                <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
                <p className="text-sm font-bold">{selected.label}</p>
              </div>
              <div className="flex items-baseline gap-4 border-b border-ops-border py-3">
                <p className="text-sm font-semibold">Tổng tiền</p>
                <span className="mx-1 flex-1 border-b border-dotted border-ops-border" aria-hidden="true" />
                <p className="ops-nums text-lg font-bold">{formatVND(selected.total)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm font-semibold">Phương thức</p>
              <div className="flex gap-2">
                {['Tiền mặt', 'Thẻ', 'QR'].map((m) => (
                  <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m} className={cn('min-h-12 flex-1 cursor-pointer rounded-lg border px-3 text-sm font-semibold', method === m ? 'border-ops-ink bg-ops-ink text-white' : 'border-ops-border bg-white text-ops-muted hover:text-ops-ink')}>
                    {m}
                  </button>
                ))}
              </div>
              <label className="mt-2 text-sm font-semibold" htmlFor="pos-paid">Khách đưa (đồng)</label>
              <input
                id="pos-paid"
                inputMode="numeric"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder={String(selected.total)}
                className="ops-nums min-h-12 w-full rounded-lg border border-ops-border px-4 text-right outline-none focus:border-ops-ink"
              />
              <p className="ops-nums text-right text-sm font-semibold">
                {paidNum === 0 ? 'Nhập số tiền khách đưa để tính tiền thừa.' : change >= 0 ? `Tiền thừa: ${formatVND(change)}` : `Còn thiếu: ${formatVND(-change)}`}
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" variant="ops" className="w-full" onClick={confirmPayment}>Xác nhận thanh toán</Button>
              <Button size="md" variant="ghost" className="w-full" onClick={() => setPaymentOpen(false)}>Hủy</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-between gap-4 rounded-lg bg-ops-ink px-4 py-3 text-white shadow-xl" role="status">
          <p className="text-sm">{toast.message}</p>
          <span className="flex shrink-0 gap-3">
            {toast.undo ? (
              <button type="button" onClick={() => { toast.undo?.(); setToast(null); }} className="min-h-11 cursor-pointer px-2 text-sm font-bold underline underline-offset-4">Hoàn tác</button>
            ) : null}
            <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center"><X className="h-5 w-5" aria-hidden="true" /></button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
