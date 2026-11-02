'use client';

import * as React from 'react';
import { AlertTriangle, Bell, BellOff, Check, Clock, Info, Plus, X } from 'lucide-react';
import { KdsLayout } from '@/components/layouts/KdsLayout';
import { Button } from '@/components/ui/Button';
import { DEMO_KDS_ORDERS, type DemoKdsOrder, type KdsStatus, type KdsStation } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

const SLA_SEC = 15 * 60;

const COLUMNS: Array<{ id: KdsStatus; label: string }> = [
  { id: 'waiting', label: 'Chờ nấu' },
  { id: 'cooking', label: 'Đang nấu' },
  { id: 'done', label: 'Xong' },
];

const STATIONS: Array<{ id: 'all' | KdsStation; label: string }> = [
  { id: 'all', label: 'Tất cả trạm' },
  { id: 'grill', label: 'Bếp Nướng' },
  { id: 'hotpot', label: 'Bếp Lẩu' },
];

type OrderState = DemoKdsOrder & {
  elapsedSec: number;
  prevElapsedSec?: number;
  undoUntil?: number;
};

interface TicketLine {
  key: string;
  dish: string;
  label: string;
  qty: number;
  note?: string;
  allergy?: string;
}

interface Ticket {
  key: string;
  status: KdsStatus;
  heading: string;
  subheading?: string;
  lines: TicketLine[];
  maxElapsedSec: number;
  batchTables?: number;
  orders: OrderState[];
  undoUntil?: number;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Trạng thái SLA cho món đang chờ/nấu: <70% bình thường, 70–100% sắp trễ, >100% quá SLA. */
function slaState(sec: number) {
  const percent = Math.round((sec / SLA_SEC) * 100);
  if (percent >= 100) {
    return { key: 'overdue' as const, percent, border: 'border-l-ops-alert', bg: 'bg-kds-overdue-bg', timer: 'text-ops-alert', bar: 'bg-ops-alert', icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" /> };
  }
  if (percent >= 70) {
    return { key: 'soon' as const, percent, border: 'border-l-kds-soon', bg: 'bg-kds-card', timer: 'text-kds-soon', bar: 'bg-kds-soon', icon: <Clock className="h-6 w-6" aria-hidden="true" /> };
  }
  return { key: 'normal' as const, percent, border: 'border-l-table-empty', bg: 'bg-kds-card', timer: 'text-kds-text', bar: 'bg-table-empty', icon: <Check className="h-6 w-6" aria-hidden="true" /> };
}

/** Trạng thái món đã xong (nguội): <3 phút bình thường, 3–5 phút vàng, >5 phút đỏ. */
function coldState(sec: number) {
  if (sec >= 5 * 60) {
    return { border: 'border-l-ops-alert', timer: 'text-ops-alert', icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" /> };
  }
  if (sec >= 3 * 60) {
    return { border: 'border-l-kds-soon', timer: 'text-kds-soon', icon: <Clock className="h-6 w-6" aria-hidden="true" /> };
  }
  return { border: 'border-l-table-empty', timer: 'text-kds-text', icon: <Check className="h-6 w-6" aria-hidden="true" /> };
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch {
    // Trình duyệt chặn âm thanh thì bỏ qua, vẫn còn nháy viền.
  }
}

/**
 * Demo v7.1 — bảng KDS nền sáng đồng bộ với web (bỏ nền tối v7): nền giấy #F5F2EA,
 * card trắng, chữ ink #141210, quá SLA nền đỏ nhạt #FDEAE6, sắp trễ vàng đậm #9A6B12.
 * Demo v7 — bảng KDS viết lại theo spec bếp (đọc từ xa 1–2 m, liếc 2 giây thấy món trễ):
 * - Card (trên → dưới): banner dị ứng đỏ đặc chữ trắng đậm → bàn to 30px + timer
 *   đếm trực tiếp 24px tabular-nums → "SL × tên món" 24px → ghi chú 18px →
 *   thanh tiến độ theo SLA → nút cao ≥64px.
 * - Trạng thái SLA bằng viền trái dày 6px + tint nền + icon (✓ bình thường,
 *   ⏱ sắp trễ, ⚠ quá SLA), KHÔNG chỉ dựa vào màu. Quá SLA: nền đỏ tối, timer nhấp nháy.
 * - Màu nút đúng ngữ nghĩa: Nhận món = xanh dương trung tính, Báo xong = xanh lá.
 *   Đỏ chỉ cho cảnh báo / quá SLA / Hết món.
 * - Trong mỗi cột, ticket trễ nhất lên đầu. Ticket = gộp các món cùng bàn (mặc định)
 *   hoặc cùng món (chế độ "Nhóm theo món" — đây là ý nghĩa thật của "Lô": nấu theo
 *   lô, badge ghi rõ "Nấu theo lô · gộp N bàn" thay cho "Lô xN" khó hiểu.
 * - Cột Xong: đếm thời gian chờ lên trực tiếp, vàng sau 3 phút, đỏ sau 5 phút
 *   (món nguội); không còn chữ hồng; nút Hoàn tác trong 10 giây sau khi báo xong.
 * - Chạm cả card để nhận món (chỉ cột Chờ nấu), vuốt trái để báo xong (cột Đang nấu).
 * - Header: tab trạm kèm số món đang làm + badge đỏ khi có món trễ, thống kê gọn
 *   "Trễ · TB chờ", SLA 15 phút chỉ còn trong tooltip (không còn dòng riêng).
 * - Món mới: âm báo (nếu chuông bật) + nháy viền + badge MỚI. Hết món (86) theo
 *   deep-dive KDS cũ: món 86 gạch ngang + badge HẾT, card hết món nét đứt.
 */
export default function DemoKdsBoardPage() {
  const [station, setStation] = React.useState<'all' | KdsStation>('all');
  const [groupBy, setGroupBy] = React.useState<'table' | 'dish'>('table');
  const [soundOn, setSoundOn] = React.useState(true);
  const [orders, setOrders] = React.useState<OrderState[]>(() =>
    DEMO_KDS_ORDERS.map((o) => ({ ...o, elapsedSec: o.elapsedMin * 60 })),
  );
  const [outOfStock, setOutOfStock] = React.useState<ReadonlySet<string>>(new Set());
  const [blinkKey, setBlinkKey] = React.useState<string | null>(null);
  const [blinkUntil, setBlinkUntil] = React.useState(0);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [touchX, setTouchX] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  // Timer đếm trực tiếp: mỗi giây tăng elapsed của mọi món lên 1 giây.
  React.useEffect(() => {
    const t = setInterval(() => {
      setOrders((prev) => prev.map((o) => ({ ...o, elapsedSec: o.elapsedSec + 1 })));
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const visible = station === 'all' ? orders : orders.filter((o) => o.station === station);
  const active = orders.filter((o) => o.status !== 'done');
  const overdueActive = active.filter((o) => o.elapsedSec > SLA_SEC).length;
  const avgWaitMin = active.length > 0
    ? Math.round(active.reduce((sum, o) => sum + o.elapsedSec, 0) / active.length / 60)
    : 0;

  const stationStats = STATIONS.map((s) => {
    const list = s.id === 'all' ? active : active.filter((o) => o.station === s.id);
    return { ...s, count: list.length, overdue: list.filter((o) => o.elapsedSec > SLA_SEC).length };
  });

  const moveTicket = (ticket: Ticket, next: KdsStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (!ticket.orders.some((t) => t.id === o.id)) return o;
        if (next === 'done') {
          return { ...o, status: 'done', prevElapsedSec: o.elapsedSec, elapsedSec: 0, undoUntil: Date.now() + 10000 };
        }
        return { ...o, status: next, undoUntil: undefined };
      }),
    );
  };

  const undoTicket = (ticket: Ticket) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (!ticket.orders.some((t) => t.id === o.id)) return o;
        return { ...o, status: 'cooking', elapsedSec: o.prevElapsedSec ?? o.elapsedSec, undoUntil: undefined, prevElapsedSec: undefined };
      }),
    );
  };

  const toggle86 = (dish: string) => {
    setOutOfStock((prev) => {
      const next = new Set(prev);
      if (next.has(dish)) {
        next.delete(dish);
        setNotice(`Đã mở lại bán: ${dish}.`);
      } else {
        next.add(dish);
        setNotice(`Đã báo hết món: ${dish} — thu ngân / phục vụ ngừng bán món này (demo).`);
      }
      return next;
    });
  };

  const simulateNew = () => {
    const order: OrderState = {
      id: `new-${Date.now()}`,
      table: 'Bàn 05',
      dish: 'Phở Bò Thăn Áp Chảo',
      quantity: 1,
      status: 'waiting',
      elapsedMin: 0,
      overdue: false,
      station: 'hotpot',
      elapsedSec: 0,
    };
    setOrders((prev) => [...prev, order]);
    setBlinkKey('waiting|Bàn 05');
    setBlinkUntil(Date.now() + 3000);
    if (soundOn) playBeep();
  };

  const ticketsFor = (status: KdsStatus): Ticket[] => {
    const list = visible.filter((o) => o.status === status);
    const groups = new Map<string, OrderState[]>();
    for (const o of list) {
      const key = groupBy === 'table' ? `${status}|${o.table}` : `${status}|${o.dish}`;
      const arr = groups.get(key) ?? [];
      arr.push(o);
      groups.set(key, arr);
    }
    const tickets: Ticket[] = [...groups.entries()].map(([key, groupOrders]) => {
      const maxElapsedSec = Math.max(...groupOrders.map((o) => o.elapsedSec));
      const undoUntil = Math.max(...groupOrders.map((o) => o.undoUntil ?? 0));
      if (groupBy === 'table') {
        return {
          key,
          status,
          heading: groupOrders[0].table,
          lines: groupOrders.map((o) => ({ key: o.id, dish: o.dish, label: o.dish, qty: o.quantity, note: o.note, allergy: o.allergy })),
          maxElapsedSec,
          batchTables: Math.max(...groupOrders.map((o) => o.batchTables ?? 0)) || undefined,
          orders: groupOrders,
          undoUntil: undoUntil > 0 ? undoUntil : undefined,
        };
      }
      const totalQty = groupOrders.reduce((sum, o) => sum + o.quantity, 0);
      const tables = [...new Set(groupOrders.map((o) => o.table))];
      return {
        key,
        status,
        heading: groupOrders[0].dish,
        subheading: `Tổng ${totalQty} phần · ${tables.length} bàn`,
        lines: groupOrders.map((o) => ({ key: o.id, dish: o.dish, label: o.table, qty: o.quantity, note: o.note, allergy: o.allergy })),
        maxElapsedSec,
        batchTables: tables.length > 1 ? tables.length : undefined,
        orders: groupOrders,
        undoUntil: undoUntil > 0 ? undoUntil : undefined,
      };
    });
    // Trễ nhất lên đầu (cột Xong: món chờ lâu nhất — nguội nhất — lên đầu).
    tickets.sort((a, b) => b.maxElapsedSec - a.maxElapsedSec);
    return tickets;
  };

  return (
    <KdsLayout
      title="KDS Bếp"
      stationFilter={
        <div className="flex gap-1" role="tablist" aria-label="Chọn trạm">
          {stationStats.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={station === s.id}
              onClick={() => setStation(s.id)}
              className={cn(
                'flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold',
                station === s.id ? 'bg-ink text-white' : 'text-kds-muted hover:text-kds-text',
              )}
            >
              {s.label} ({s.count})
              {s.overdue > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ops-alert px-1 text-xs font-bold text-white" title={`${s.overdue} món trễ`}>
                  {s.overdue}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      }
      soundToggle={
        <Button variant="ghost" size="sm" className="shrink-0 text-kds-text hover:bg-sand-100" aria-label={soundOn ? 'Tắt âm báo' : 'Bật âm báo'} title={soundOn ? 'Âm báo: bật' : 'Âm báo: tắt'} onClick={() => setSoundOn((v) => !v)}>
          {soundOn ? <Bell className="h-5 w-5" aria-hidden="true" /> : <BellOff className="h-5 w-5" aria-hidden="true" />}
        </Button>
      }
      clock={<span className="hidden shrink-0 text-sm font-semibold tabular-nums sm:block">19:42</span>}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-base font-bold text-kds-text" title="SLA bếp: 15 phút">
            <span className="flex items-center gap-2">
              Trễ: <span className="text-ops-alert">{overdueActive}</span>
              <span className="text-kds-muted">·</span>
              TB chờ: <span className="tabular-nums">{avgWaitMin} phút</span>
              <Info className="h-4 w-4 text-kds-muted" aria-hidden="true" />
            </span>
          </p>
          <div className="flex gap-1" role="tablist" aria-label="Cách gộp ticket">
            {([
              { id: 'table' as const, label: 'Nhóm theo bàn' },
              { id: 'dish' as const, label: 'Nhóm theo món' },
            ]).map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={groupBy === g.id}
                onClick={() => setGroupBy(g.id)}
                className={cn(
                  'min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold',
                  groupBy === g.id ? 'border-ink bg-ink text-white' : 'border-kds-border text-kds-muted hover:text-kds-text',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={simulateNew}
            className="flex min-h-11 cursor-pointer items-center gap-1 rounded-lg border border-kds-border bg-white px-3 text-sm font-semibold text-kds-text hover:bg-sand-100"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Món mới (demo)
          </button>
        </div>

        {notice ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-kds-border bg-kds-card px-4 py-3 text-sm font-semibold text-kds-text" role="status">
            <span>{notice}</span>
            <button type="button" aria-label="Đóng thông báo" onClick={() => setNotice(null)} className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const tickets = ticketsFor(col.id);
            const dishCount = tickets.reduce((sum, t) => sum + t.orders.length, 0);
            return (
              <section key={col.id} aria-label={col.label} className="flex flex-col gap-4 md:max-h-[calc(100vh-260px)] md:overflow-y-auto md:pr-2">
                <h2 className="text-base font-bold uppercase tracking-wide text-kds-muted">
                  {col.label} ({tickets.length} ticket · {dishCount} món)
                </h2>
                <div className="flex flex-col gap-6">
                  {tickets.map((ticket) => {
                    const allergies = [...new Set(ticket.lines.map((l) => l.allergy).filter((a): a is string => Boolean(a)))];
                    const all86 = ticket.lines.every((l) => outOfStock.has(l.dish));
                    const isNew = blinkKey === ticket.key && now < blinkUntil;
                    if (col.id === 'done') {
                      const cold = coldState(ticket.maxElapsedSec);
                      const undoLeft = ticket.undoUntil ? Math.max(0, Math.ceil((ticket.undoUntil - now) / 1000)) : 0;
                      return (
                        <article key={ticket.key} className={cn('overflow-hidden rounded-lg border border-kds-border border-l-[6px] bg-kds-card shadow-warm-sm', cold.border)}>
                          {allergies.length > 0 ? (
                            <div className="flex items-center gap-2 bg-ops-alert px-6 py-3">
                              <AlertTriangle className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                              <p className="text-lg font-bold uppercase text-white">{allergies.join(' · ')}</p>
                            </div>
                          ) : null}
                          <div className="flex flex-col gap-4 p-6">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-3xl font-extrabold">{ticket.heading}</p>
                              {ticket.batchTables ? (
                                <span className="shrink-0 rounded-lg border border-kds-border px-2 py-1 text-xs font-semibold text-kds-muted">
                                  Nấu theo lô · gộp {ticket.batchTables} bàn
                                </span>
                              ) : null}
                            </div>
                            {ticket.subheading ? <p className="text-sm font-semibold text-kds-muted">{ticket.subheading}</p> : null}
                            <div className={cn('flex items-center gap-2 text-2xl font-bold tabular-nums', cold.timer)}>
                              {cold.icon}
                              Đã xong {formatTime(ticket.maxElapsedSec)}
                            </div>
                            {ticket.lines.map((line) => {
                              const soldOut = outOfStock.has(line.dish);
                              return (
                                <div key={line.key} className="flex flex-col gap-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className={cn('text-2xl font-bold', soldOut && 'text-kds-muted line-through')}>
                                      {groupBy === 'table' ? `${line.qty} × ${line.label}` : `${line.label} × ${line.qty}`}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggle86(line.dish); }}
                                      className="min-h-8 shrink-0 cursor-pointer rounded-lg border border-kds-border px-2 text-xs font-bold text-kds-muted hover:text-kds-text"
                                    >
                                      {soldOut ? 'Mở lại' : '86'}
                                    </button>
                                  </div>
                                  {soldOut ? <p className="text-sm font-bold text-ops-alert">HẾT MÓN</p> : null}
                                  {line.note ? <p className="text-lg text-kds-muted">Ghi chú: {line.note}</p> : null}
                                </div>
                              );
                            })}
                            {undoLeft > 0 ? (
                              <button
                                type="button"
                                onClick={() => undoTicket(ticket)}
                                className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-kds-border px-4 text-sm font-bold text-kds-text hover:bg-sand-100"
                              >
                                Hoàn tác ({undoLeft}s)
                              </button>
                            ) : (
                              <p className="py-2 text-center text-sm font-semibold text-kds-muted">Chờ phục vụ</p>
                            )}
                          </div>
                        </article>
                      );
                    }

                    const sla = slaState(ticket.maxElapsedSec);
                    return (
                      <article
                        key={ticket.key}
                        onClick={() => { if (col.id === 'waiting') moveTicket(ticket, 'cooking'); }}
                        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
                        onTouchEnd={(e) => {
                          if (touchX === null) return;
                          const dx = e.changedTouches[0].clientX - touchX;
                          setTouchX(null);
                          if (dx < -60 && col.id === 'cooking') moveTicket(ticket, 'done');
                        }}
                        className={cn(
                          'overflow-hidden rounded-lg border border-kds-border border-l-[6px] shadow-warm-sm',
                          sla.border,
                          sla.bg,
                          all86 && 'border-dashed',
                          isNew && 'ring-2 ring-white',
                          col.id === 'waiting' && 'cursor-pointer',
                        )}
                      >
                        {allergies.length > 0 ? (
                          <div className="flex items-center gap-2 bg-ops-alert px-6 py-3">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                            <p className="text-lg font-bold uppercase text-white">{allergies.join(' · ')}</p>
                          </div>
                        ) : null}
                        <div className="flex flex-col gap-4 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-3xl font-extrabold">{ticket.heading}</p>
                            <span className="flex shrink-0 items-center gap-2">
                              {isNew ? <span className="rounded-lg bg-ink px-2 py-1 text-xs font-bold text-white">MỚI</span> : null}
                              {all86 ? <span className="rounded-lg bg-ops-alert px-2 py-1 text-xs font-bold text-white">HẾT MÓN</span> : null}
                              {ticket.batchTables ? (
                                <span className="rounded-lg border border-kds-border px-2 py-1 text-xs font-semibold text-kds-muted">
                                  Nấu theo lô · gộp {ticket.batchTables} bàn
                                </span>
                              ) : null}
                            </span>
                          </div>
                          {ticket.subheading ? <p className="text-sm font-semibold text-kds-muted">{ticket.subheading}</p> : null}
                          <div className={cn('flex items-center gap-2 text-2xl font-bold tabular-nums', sla.timer, sla.key === 'overdue' && 'animate-blink')}>
                            {sla.icon}
                            {formatTime(ticket.maxElapsedSec)}
                            <span className="text-base font-semibold">· {sla.percent}% SLA</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-3 flex-1 overflow-hidden rounded-full bg-kds-border">
                              <div className={cn('h-full rounded-full', sla.bar)} style={{ width: `${Math.min(sla.percent, 100)}%` }} />
                            </div>
                            <span className="tabular-nums text-sm font-bold text-kds-muted">{sla.percent}%</span>
                          </div>
                          {ticket.lines.map((line) => {
                            const soldOut = outOfStock.has(line.dish);
                            return (
                              <div key={line.key} className="flex flex-col gap-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className={cn('text-2xl font-bold', soldOut && 'text-kds-muted line-through')}>
                                    {groupBy === 'table' ? `${line.qty} × ${line.label}` : `${line.label} × ${line.qty}`}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggle86(line.dish); }}
                                    className="min-h-8 shrink-0 cursor-pointer rounded-lg border border-kds-border px-2 text-xs font-bold text-kds-muted hover:text-kds-text"
                                  >
                                    {soldOut ? 'Mở lại' : '86'}
                                  </button>
                                </div>
                                {soldOut ? <p className="text-sm font-bold text-ops-alert">HẾT MÓN</p> : null}
                                {line.note ? <p className="text-lg text-kds-muted">Ghi chú: {line.note}</p> : null}
                              </div>
                            );
                          })}
                          <div className="flex flex-col gap-2">
                            {col.id === 'waiting' ? (
                              <Button size="kds" variant="kds-action" className="w-full" disabled={all86} onClick={(e) => { e.stopPropagation(); moveTicket(ticket, 'cooking'); }}>
                                Nhận món
                              </Button>
                            ) : null}
                            {col.id === 'cooking' ? (
                              <Button size="kds" variant="kds-success" className="w-full" disabled={all86} onClick={(e) => { e.stopPropagation(); moveTicket(ticket, 'done'); }}>
                                Báo xong
                              </Button>
                            ) : null}
                            <p className="text-center text-xs text-kds-muted">
                              {col.id === 'waiting' ? 'Chạm vào card để nhận món' : 'Vuốt trái để báo xong · hoặc bấm nút'}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </KdsLayout>
  );
}
