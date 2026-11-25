'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { customerMenuService, TableInfoDto } from '@/services/customerMenuService';
import {
  QrCode,
  ArrowRight,
  Utensils,
  Sparkles,
  AlertCircle,
  Users,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function TableQrEntryContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const rawTableId = params?.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : (rawTableId ?? '');
  const token = searchParams.get('token') ?? undefined;

  const router = useRouter();
  const setTable = useCartStore((state) => state.setTable);

  const [tableInfo, setTableInfo] = useState<TableInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  // 3D Tilt calculation strictly limited to ±8 degrees (Performance Budget: Rule 04)
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    transition: 'transform 0.2s ease-out',
  });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max tilt ±8 deg
    const rotateY = Math.max(-8, Math.min(8, ((x - centerX) / centerX) * 8));
    const rotateX = Math.max(-8, Math.min(8, -((y - centerY) / centerY) * 8));

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg)`,
      transition: 'transform 0.05s ease-out',
    });
  };

  const handlePointerLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.4s ease-out',
    });
  };

  useEffect(() => {
    let isMounted = true;
    async function loadTable() {
      setLoading(true);
      setError(null);
      try {
        const info = await customerMenuService.getTableInfo(tableId);
        if (isMounted) {
          setTableInfo(info);
          setTable(info.id, info.tableNumber, token || null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as { status?: number; message?: string };
          if (apiErr.status === 404) {
            setError('Bàn không khả dụng hoặc đã bị thay đổi mã QR. Vui lòng liên hệ nhân viên phục vụ để được hỗ trợ.');
          } else {
            setError('Không thể kết nối máy chủ nhà hàng. Vui lòng thử lại.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTable();
    return () => {
      isMounted = false;
    };
  }, [tableId, token, setTable]);

  // Auto redirect countdown: 3s timer with visible countdown
  useEffect(() => {
    if (!loading && !error && tableInfo) {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, error, tableInfo]);

  // Navigate cleanly in an effect when countdown reaches 0
  useEffect(() => {
    if (!loading && !error && tableInfo && countdown === 0) {
      router.push('/menu');
    }
  }, [loading, error, tableInfo, countdown, router]);

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] flex flex-col items-center justify-center p-6 text-center select-none">
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          transform: tiltStyle.transform,
          transition: tiltStyle.transition,
          willChange: 'transform',
        }}
        className="mx-auto w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_12px_40px_rgba(154,64,28,0.12)] border border-[#dcc1b8]/50 flex flex-col items-center gpu-accelerated"
      >
        {/* Top QR Icon Badge */}
        <div className="relative mb-5">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-[#9a401c] to-[#ba5831] flex items-center justify-center shadow-lg shadow-[#9a401c]/30">
            <QrCode className="h-10 w-10 text-white" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#00873a] text-white shadow-sm ring-2 ring-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* State 1: Loading */}
        {loading && (
          <div className="flex flex-col items-center py-4 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-[#9a401c]" />
            <p className="text-xs font-semibold text-[#56423c]">
              Đang xác thực mã QR bàn ăn...
            </p>
          </div>
        )}

        {/* State 2: Error 404 / Bàn không tồn tại */}
        {!loading && error && (
          <div className="flex flex-col items-center py-2 space-y-3 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-xs font-bold text-rose-800">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Lỗi bàn ăn</span>
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[#1e1b1a]">
              Bàn Không Khả Dụng
            </h1>
            <p className="text-xs text-[#56423c] leading-relaxed">
              {error}
            </p>
            <div className="pt-2 w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push('/menu')}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#9a401c] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <span>Xem Thực Đơn Chung</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full min-h-[40px] py-2 px-4 rounded-full border border-[#dcc1b8] text-xs font-semibold text-[#56423c] flex items-center justify-center gap-1.5 hover:bg-[#f5ecea]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Thử Lại</span>
              </button>
            </div>
          </div>
        )}

        {/* State 3: Normal / Success */}
        {!loading && !error && tableInfo && (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdbcf] text-xs font-bold text-[#380d00] mb-3">
              <Utensils className="h-3.5 w-3.5 text-[#9a401c]" />
              <span>Phố Cổ Dine • Đã kết nối</span>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1e1b1a] mb-1">
              Chào mừng đến với{' '}
              <span className="text-[#9a401c]">{tableInfo.tableNumber}</span>
            </h1>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#56423c] mb-4">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Sức chứa: {tableInfo.capacity} khách</span>
              </span>
              <span>•</span>
              <span className="text-[#00873a] font-bold">Trực tiếp tại bàn</span>
            </div>

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

            {/* Countdown info */}
            <p className="mt-3 text-[11px] font-medium text-[#89726a] flex items-center justify-center gap-1">
              <span>Tự động vào thực đơn sau</span>
              <span className="font-bold text-[#9a401c] px-1 py-0.5 rounded bg-[#faebe6] ops-nums">
                {countdown}s
              </span>
              <span>hoặc bấm nút ở trên</span>
            </p>

            <p className="mt-3 text-[11px] font-medium text-[#56423c]">
              Đặc sản hôm nay: Bún chả than hoa • Chả cá Lã Vọng • Lẩu riêu cua
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function TableQrEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#9a401c] mb-2" />
          <p className="text-xs font-semibold text-[#56423c]">Đang nhận diện bàn ăn...</p>
        </div>
      }
    >
      <TableQrEntryContent />
    </Suspense>
  );
}
