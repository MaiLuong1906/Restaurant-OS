'use client';

import * as React from 'react';

interface SlaTimerProps {
  createdAt: string;
  slaDeadline?: string;
}

export function SlaTimer({ createdAt, slaDeadline }: SlaTimerProps) {
  const [now, setNow] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedSec = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  let chipText = 'Trong hạn';
  let chipClass = 'bg-[#EAF2EB] text-[#5F7F5E] border-[#CFDFCC]';

  if (slaDeadline) {
    const deadlineTime = new Date(slaDeadline).getTime();
    const diffSec = Math.floor((deadlineTime - now) / 1000);

    if (diffSec <= 0) {
      chipText = 'Quá SLA';
      chipClass = 'bg-[#FDEAE6] text-[#D14B3A] border-[#FBE3DE]';
    } else if (diffSec <= 180) {
      // Dưới 3 phút là sắp đến hạn
      chipText = 'Sắp đến hạn';
      chipClass = 'bg-[#FDF3D7] text-[#9A6B12] border-[#D9A441]';
    }
  }

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="font-semibold text-ops-ink">{timeFormatted}</span>
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${chipClass}`}>
        {chipText}
      </span>
    </div>
  );
}
