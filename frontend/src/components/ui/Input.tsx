'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Ô nhập liệu dùng chung. Cao tối thiểu 48px, focus ring tông ấm. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? React.useId();
  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'min-h-12 w-full rounded-card border border-sand-300 bg-white px-4 text-base text-ink outline-none placeholder:text-sand-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-sand-100',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-200',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
