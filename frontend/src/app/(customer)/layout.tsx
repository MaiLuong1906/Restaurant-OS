'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-2 duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      {children}
    </div>
  );
}
