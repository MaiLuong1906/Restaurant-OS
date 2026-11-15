'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { QrCode, ArrowRight, Utensils } from 'lucide-react';

interface PageProps {
  params: Promise<{
    tableId: string;
  }>;
}

export default function TableQrEntryPage({ params }: PageProps) {
  const { tableId } = use(params);
  const router = useRouter();
  const setTable = useCartStore((state) => state.setTable);

  useEffect(() => {
    // Tự động nhận diện bàn ăn từ QR Token / tableId
    const formattedTableName = tableId.replace('-', ' ').toUpperCase();
    setTable(tableId, formattedTableName);
  }, [tableId, setTable]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 via-slate-950 to-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-pulse">
          <QrCode className="h-12 w-12 text-white" />
        </div>
      </div>

      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-medium text-orange-400 mb-3">
        <Utensils className="h-3.5 w-3.5" />
        <span>Bàn đã nhận diện thành công</span>
      </div>

      <h1 className="text-3xl font-black tracking-tight mb-2">
        Chào mừng đến với Bàn <span className="text-orange-400">{tableId.toUpperCase()}</span>
      </h1>
      <p className="text-sm text-slate-400 max-w-sm mb-8">
        Quý khách vui lòng chọn món ăn trên thực đơn điện tử, đơn hàng sẽ được gửi thẳng tới bếp ngay tức thì.
      </p>

      <button
        onClick={() => router.push('/menu')}
        className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-95"
      >
        <span>Khám phá Thực Đơn Ngay</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
