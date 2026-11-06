'use client';

import * as React from 'react';
import { Ticket } from '@/types';
import { SlaTimer } from './SlaTimer';
import { AllergyBanner } from './AllergyBanner';
import { Check } from 'lucide-react';

interface KdsTicketCardProps {
  ticket: Ticket;
  onComplete: (ticketId: string) => void;
  onSelect?: (ticket: Ticket) => void;
  isCompleting?: boolean;
}

export function KdsTicketCard({ ticket, onComplete, onSelect, isCompleting }: KdsTicketCardProps) {
  // Tìm cảnh báo dị ứng chung của ticket nếu có
  const allergy = ticket.items.find((i) => i.allergy)?.allergy;

  const actionableItems = ticket.items.filter((i) => i.status !== 'REJECTED');
  const allReady = actionableItems.every((i) => i.status === 'READY');

  return (
    <div
      onClick={() => onSelect && onSelect(ticket)}
      className="bg-white rounded-lg border border-ops-border shadow-warm p-4 flex flex-col justify-between transition-all cursor-pointer hover:border-ops-brand/40"
    >
      <div>
        <AllergyBanner allergy={allergy} />

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
        disabled={isCompleting || allReady}
        onClick={(e) => {
          e.stopPropagation();
          onComplete(ticket.id);
        }}
        className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="h-5 w-5" />
        <span>{allReady ? 'Đã hoàn tất' : 'Hoàn tất ticket'}</span>
      </button>
    </div>
  );
}
