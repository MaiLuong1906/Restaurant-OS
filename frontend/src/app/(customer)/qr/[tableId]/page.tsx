'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { QrCode, ArrowRight, Utensils, Sparkles } from 'lucide-react';

interface PageProps {
  params: Promise<{
    tableId: string;
  }>;
}

export default function TableQrEntryPage({ params }: PageProps) {
  const { tableId } = use(params);
  const router = useRouter();
  const setTable = useCartStore((state) => state.setTable);

  const formattedTableName = tableId.toLowerCase().startsWith('ban')
    ? `Bàn ${tableId.replace(/ban-?/i, '')}`
    : `Bàn ${tableId.replace('-', ' ').toUpperCase()}`;

  useEffect(() => {
    setTable(tableId, formattedTableName);
  }, [tableId, formattedTableName, setTable]);

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] flex flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_8px_30px_rgba(154,64,28,0.1)] border border-[#dcc1b8]/50 flex flex-col items-center">
        <div className="relative mb-5">
          <div className="h-22 w-22 rounded-3xl bg-gradient-to-tr from-[#9a401c] to-[#ba5831] flex items-center justify-center shadow-lg shadow-[#9a401c]/30">
            <QrCode className="h-11 w-11 text-white" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#00873a] text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdbcf] text-xs font-bold text-[#380d00] mb-3">
          <Utensils className="h-3.5 w-3.5 text-[#9a401c]" />
          <span>Phố Cổ Dine • Đã kết nối bàn</span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1e1b1a] mb-2">
          Chào mừng đến với{' '}
          <span className="text-[#9a401c]">{formattedTableName}</span>
        </h1>
        <p className="text-xs text-[#56423c] leading-relaxed mb-6">
          Quý khách vui lòng chọn món ăn trên thực đơn điện tử Phố Cổ. Đơn gọi
          món sẽ được chuyển thẳng tới Bếp &amp; Quầy bar ngay tức thì.
        </p>

        <button
          type="button"
          onClick={() => router.push('/menu')}
          className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#9a401c] hover:bg-[#ba5831] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <span>Khám Phá Thực Đơn Ngay</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
