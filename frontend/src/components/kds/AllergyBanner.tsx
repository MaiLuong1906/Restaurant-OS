import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AllergyBannerProps {
  allergy?: string;
}

export function AllergyBanner({ allergy }: AllergyBannerProps) {
  if (!allergy || !allergy.trim()) return null;

  return (
    <div className="bg-[#8C1D2C] text-white px-3 py-1.5 rounded-md flex items-center gap-2 mb-3 shadow-xs">
      <AlertTriangle className="h-4 w-4 shrink-0 text-white" />
      <span className="text-xs font-bold tracking-wide uppercase">
        CẢNH BÁO DỊ ỨNG: {allergy}
      </span>
    </div>
  );
}
