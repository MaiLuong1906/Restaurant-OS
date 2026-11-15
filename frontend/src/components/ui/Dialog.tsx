'use client';

import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Hộp thoại chuẩn v6 — Radix Dialog (kiểu shadcn: Radix primitives + cn + token),
 * thay cho modal tự vẽ bằng div ở v5. Dùng cho modal thanh toán POS và các form ngắn.
 * Radius 8px, bóng nhẹ, nền trắng, chữ ink — không dùng đỏ brand cho khung modal.
 */
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  title,
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & { title?: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ops-ink/50" />
      <RadixDialog.Content
        {...props}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-warm-lg outline-none',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? <RadixDialog.Title className="text-xl font-bold text-ops-ink">{title}</RadixDialog.Title> : <span />}
          <RadixDialog.Close
            aria-label="Đóng"
            className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ops-muted hover:bg-ops-bg hover:text-ops-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
