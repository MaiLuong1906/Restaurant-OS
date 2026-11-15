'use client';

import * as React from 'react';
import { Batch } from '@/types';
import { SlaTimer } from './SlaTimer';
import { AllergyBanner } from './AllergyBanner';
import { Check } from 'lucide-react';

interface KdsBatchCardProps {
  batch: Batch;
  onComplete: (batchId: string) => void;
  isCompleting?: boolean;
}

export function KdsBatchCard({ batch, onComplete, isCompleting }: KdsBatchCardProps) {
  const isDone = batch.status === 'READY' || batch.status === 'SERVED';

  return (
    <div className="bg-white rounded-lg border border-ops-border shadow-warm p-4 flex flex-col justify-between transition-all">
      <div>
        <AllergyBanner allergy={batch.allergy} />

        <div className="flex items-center justify-between pb-3 border-b border-ops-border mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-ops-brand">{batch.totalQuantity}×</span>
            <h3 className="font-extrabold text-xl text-ops-ink">{batch.dishName}</h3>
          </div>
          <SlaTimer createdAt={batch.items[0]?.createdAt || new Date().toISOString()} slaDeadline={batch.slaDeadline} />
        </div>

        {batch.notes && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded mb-3 border border-amber-200">
            <strong>Ghi chú mẻ:</strong> {batch.notes}
          </p>
        )}

        <div className="mb-4">
          <span className="text-xs uppercase font-bold text-ops-muted tracking-wider block mb-2">
            Gồm các bàn ({batch.items.length} phần):
          </span>
          <div className="space-y-1">
            {batch.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-1 border-b border-dashed border-ops-border/60"
              >
                <span className="font-semibold text-ops-ink">{item.tableNo}</span>
                <span className="text-ops-muted">{item.quantity} phần</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isCompleting || isDone}
        onClick={() => onComplete(batch.id)}
        className="w-full h-12 rounded-lg bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="h-5 w-5" />
        <span>{isDone ? 'Đã hoàn tất mẻ' : 'Hoàn tất mẻ nấu'}</span>
      </button>
    </div>
  );
}
