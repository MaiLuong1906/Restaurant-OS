'use client';

import * as React from 'react';
import { Ticket } from '@/types';
import { SlaTimer } from './SlaTimer';
import { AllergyBanner } from './AllergyBanner';
import { Check, Lock } from 'lucide-react';

interface KdsTicketCardProps {
  ticket: Ticket;
  onComplete: (ticketId: string) => void;
  onSelect?: (ticket: Ticket) => void;
  onViewAlert?: (ticketId: string) => void;
  isCompleting?: boolean;
  hasPendingAlert?: boolean;
}

export function KdsTicketCard({
  ticket,
  onComplete,
  onSelect,
  onViewAlert,
  isCompleting,
  hasPendingAlert,
}: KdsTicketCardProps) {
  // Tìm cảnh báo dị ứng chung của ticket nếu có
  const allergy = ticket.items.find((i) => i.allergy)?.allergy;

  const actionableItems = ticket.items.filter((i) => i.status !== 'REJECTED');
  const allReady = actionableItems.every((i) => i.status === 'READY');

  return (
    <div
      onClick={() => onSelect && onSelect(ticket)}
      className={`bg-white rounded-lg border shadow-warm p-4 flex flex-col justify-between transition-all cursor-pointer hover:border-ops-brand/40 ${
        hasPendingAlert ? 'border-danger-400 ring-1 ring-danger-400' : 'border-ops-border'
      }`}
    >
      <div>
        <AllergyBanner allergy={allergy} />

        {hasPendingAlert && (
          <div className="flex items-center justify-between bg-danger-50 text-danger-700 px-3 py-1.5 rounded mb-3 border border-danger-200">
            <span className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> CHỜ XÁC NHẬN
            </span>
            {onViewAlert && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAlert(ticket.id);
                }}
                className="text-xs font-bold underline hover:text-danger-900"
              >
                Xem cảnh báo
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pb-3 border-b border-ops-border mb-3">
          <div>
            <h3 className="font-extrabold text-xl text-ops-ink">{ticket.tableNo}</h3>
            <span className="text-xs text-ops-muted">#{ticket.id}</span>
          </div>
          <SlaTimer createdAt={ticket.createdAt} slaDeadline={ticket.slaDeadline} />
        </div>

        {ticket.customerNotes && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded mb-3 border border-amber-200">
            <strong>Ghi chú:</strong> {ticket.customerNotes}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {ticket.items.map((item) => {
            const isDone = item.status === 'READY' || item.status === 'SERVED';
            const isRejected = item.status === 'REJECTED';

            return (
              <div
                key={item.id}
                className={`flex items-start justify-between text-sm py-1 border-b border-dashed border-ops-border/60 last:border-none ${
                  isDone ? 'opacity-40 line-through' : isRejected ? 'opacity-30 line-through text-danger-500' : ''
                }`}
              >
                <div>
                  <div className="font-bold text-ops-ink flex items-center gap-1.5">
                    <span className="text-ops-brand font-black text-base">{item.quantity}×</span>
                    <span>{item.dishName}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-ops-muted mt-0.5">&bull; {item.notes}</p>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="inline-block text-[11px] font-bold text-danger-600 bg-danger-50 px-1.5 py-0.5 rounded border border-danger-200">
                      ĐÃ HỦY
                    </span>
                  )}
                </div>
                {item.status === 'READY' && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Xong
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={isCompleting || allReady || hasPendingAlert}
        onClick={(e) => {
          e.stopPropagation();
          if (hasPendingAlert) return;
          onComplete(ticket.id);
        }}
        className={`w-full h-12 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all ${
          hasPendingAlert
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
            : 'bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {hasPendingAlert ? (
          <>
            <Lock className="h-5 w-5" />
            <span>Đang khóa (có thay đổi)</span>
          </>
        ) : (
          <>
            <Check className="h-5 w-5" />
            <span>{allReady ? 'Đã hoàn tất' : 'Hoàn tất ticket'}</span>
          </>
        )}
      </button>
    </div>
  );
}
