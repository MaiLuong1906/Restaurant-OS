'use client';

import * as React from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Menu thả xuống chuẩn v6 — Radix DropdownMenu (kiểu shadcn: Radix primitives + cn
 * + token), thay cho nút lặp ở mọi hàng trong bảng nhân viên v5.
 * Dùng cho menu ⋯ mỗi hàng: Xem / Duyệt hủy / Mở két (mục nhạy cảm chỉ hiện ở
 * Chế độ Quản lý, bản thật vẫn kiểm tra quyền ở backend).
 */
export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;

export function DropdownMenuContent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        {...props}
        sideOffset={4}
        align="end"
        className={cn(
          'z-50 min-w-44 overflow-hidden rounded-lg border border-ops-border bg-white p-1 shadow-warm-lg',
          className,
        )}
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
}

export function DropdownMenuItem({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixMenu.Item>) {
  return (
    <RadixMenu.Item
      {...props}
      className={cn(
        'flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold text-ops-ink outline-none hover:bg-ops-bg focus:bg-ops-bg',
        className,
      )}
    >
      {children}
    </RadixMenu.Item>
  );
}
