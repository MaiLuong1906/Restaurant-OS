'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { formatVND } from '@/lib/utils';
import { triggerHaptic } from '@/lib/customer-menu-data';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CallStaffSheet } from '@/components/customer/CallStaffSheet';
import {
  Clock,
  ShieldCheck,
  Headphones,
  UtensilsCrossed,
  History,
  ReceiptText,
  Tag,
  QrCode,
  Banknote,
  CreditCard,
  Smile,
  ArrowRight,
  FileEdit,
  BellRing,
  CheckCircle2,
} from 'lucide-react';

type PaymentMethodType = 'vietqr' | 'cash' | 'pos';

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>('vietqr');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);

  const { tableNumber, placedBatches, getPlacedSubtotal, getPlacedItemCount } =
    useCartStore();

  const displayTable = tableNumber || 'Bàn 04';
  const rawSubtotal = getPlacedSubtotal();
  const totalPortions = getPlacedItemCount();

  // Integer VND calculation
  const memberDiscount = Math.round(rawSubtotal * 0.1);
  const afterDiscount = rawSubtotal - memberDiscount;
  const vatAmount = Math.round(afterDiscount * 0.08);
  const finalPayable = Math.round((afterDiscount + vatAmount) / 100) * 100;

  const showToast = (msg: string) => {
    triggerHaptic(15);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleConfirmPayment = () => {
    triggerHaptic(25);
    router.push(
      `/payment-success?method=${paymentMethod}&total=${finalPayable}`
    );
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] pb-32">
      <CustomerHeader
        title="Hóa Đơn Tạm Tính"
        subtitle="Xác nhận & Thanh toán"
        tableNumber={displayTable}
        showBack
        onOpenCallStaff={() => setIsCallStaffOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage ? (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#342f2e] px-4 py-2.5 text-xs font-bold text-[#f8efed] shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#7ffc97]" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-md px-4 pt-4 space-y-5">
        {/* Table & Ticket Metadata Card */}
        <div className="rounded-2xl bg-[#fbf2f0] p-4 shadow-2xs border border-[#dcc1b8]/40 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-[#006b2c] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#006b2c]">
                  Đã hoàn tất phục vụ
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-[#1e1b1a]">
                {displayTable} • Tầng 1
              </h2>
              <p className="text-xs text-[#56423c]">Khu vực Ban Công Phố Cổ</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="rounded bg-[#e7e1dd] px-2 py-0.5 text-[11px] font-bold text-[#676461]">
                #HD-202410-04
              </span>
              <span className="mt-1 flex items-center gap-1 text-xs text-[#56423c]">
                <Clock className="h-3.5 w-3.5" />
                <span>11:30 - 12:45</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#9a401c]" />
              <span className="text-xs font-medium text-[#1e1b1a]">
                Sẵn sàng lập phiếu thanh toán
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast('Đã gửi yêu cầu kiểm tra tới phục vụ bàn.')
              }
              className="flex items-center gap-1 rounded-full bg-[#ffdbcf] px-2.5 py-1 text-[11px] font-bold text-[#380d00]"
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Báo nhân viên</span>
            </button>
          </div>
        </div>

        {/* Order Batches Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-[#9a401c]" />
              <h3 className="font-display text-sm font-bold text-[#1e1b1a]">
                Chi Tiết Các Món Đã Dùng
              </h3>
            </div>
            <span className="ops-nums rounded-full bg-[#efe6e4] px-2.5 py-0.5 text-[11px] font-semibold text-[#56423c]">
              {placedBatches.reduce((s, b) => s + b.items.length, 0)} món •{' '}
              {totalPortions} phần
            </span>
          </div>

          {placedBatches.map((batch, idx) => (
            <div
              key={batch.id}
              className="rounded-xl bg-white p-3.5 shadow-2xs border border-[#dcc1b8]/40 space-y-2.5"
            >
              <div className="flex items-center justify-between pb-1 border-b border-[#dcc1b8]/30">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffdbcf] text-xs font-bold text-[#380d00]">
                    {batch.batchNumber || idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#1e1b1a]">
                    Đợt {batch.batchNumber} (
                    {batch.batchNumber === 1 ? 'Đầu tiệc' : 'Gọi thêm'})
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-[#56423c]">
                  <History className="h-3.5 w-3.5" />
                  <span>{batch.submittedAt}</span>
                </span>
              </div>

              {batch.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.dishName}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 rounded-lg object-cover bg-[#f5ecea]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#1e1b1a]">
                        {item.dishName}
                      </p>
                      <p className="truncate text-[11px] text-[#56423c]">
                        {item.unitLabel} • {item.description}
                      </p>
                    </div>
                  </div>
                  <span className="ops-nums shrink-0 pl-2 font-display text-xs font-bold text-[#1e1b1a]">
                    {formatVND(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Financial Breakdown Card */}
        <div className="rounded-2xl bg-[#fbf2f0] p-4 shadow-2xs border border-[#dcc1b8]/40 space-y-2.5">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1e1b1a]">
            <ReceiptText className="h-4 w-4 text-[#9a401c]" />
            <span>Bảng Tính Chi Phí</span>
          </h3>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between text-[#56423c]">
              <span>Tổng tiền món ăn &amp; uống</span>
              <span className="ops-nums font-bold text-[#1e1b1a]">
                {formatVND(rawSubtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#006b2c]">
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Khuyến mại trưa / Hội viên (-10%)</span>
              </span>
              <span className="ops-nums font-bold">
                -{formatVND(memberDiscount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#56423c]">
              <span>Thuế giá trị gia tăng (VAT 8%)</span>
              <span className="ops-nums font-bold text-[#1e1b1a]">
                {formatVND(vatAmount)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-white p-3.5 shadow-2xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#56423c]">
                  Số tiền thanh toán
                </p>
                <p className="text-[10px] text-[#615e5b]">
                  Đã áp dụng làm tròn VNĐ
                </p>
              </div>
              <span className="ops-nums font-display text-2xl font-extrabold text-[#9a401c]">
                {formatVND(finalPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#1e1b1a]">
              <CreditCard className="h-4 w-4 text-[#9a401c]" />
              <span>Chọn Phương Thức Thanh Toán</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#9a401c]">
              Tùy chọn
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'vietqr' as const,
                title: 'Chuyển khoản VietQR',
                subtitle: 'Quét mã ngân hàng tức thì, không cần tiền mặt',
                icon: QrCode,
              },
              {
                id: 'cash' as const,
                title: 'Tiền mặt tại bàn',
                subtitle: 'Nhân viên mang hóa đơn & trả tiền thừa tận nơi',
                icon: Banknote,
              },
              {
                id: 'pos' as const,
                title: 'Quẹt thẻ POS tận bàn',
                subtitle: 'Hỗ trợ Visa, Mastercard, JCB, Napas',
                icon: CreditCard,
              },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = paymentMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setPaymentMethod(option.id);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left shadow-2xs transition-all ${
                    isSelected
                      ? 'bg-white ring-2 ring-[#9a401c]'
                      : 'bg-white border border-[#dcc1b8]/40 hover:bg-[#fbf2f0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-[#ffdbcf] text-[#9a401c]'
                          : 'bg-[#e7e1dd] text-[#676461]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1e1b1a]">
                        {option.title}
                      </p>
                      <p className="text-[11px] text-[#56423c]">
                        {option.subtitle}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? 'bg-[#9a401c]' : 'bg-[#e9e1df]'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hospitality Pledge */}
        <div className="flex items-start gap-2.5 rounded-xl bg-[#f5ecea] p-3.5">
          <Smile className="h-5 w-5 shrink-0 text-[#9a401c] mt-0.5" />
          <div className="text-xs leading-relaxed text-[#56423c]">
            <p className="font-bold text-[#1e1b1a]">
              Cam Kết Của Nhà Hàng Phố Cổ
            </p>
            <p className="mt-0.5 text-[11px]">
              Quý khách vui lòng đối chiếu đúng các món đã dùng. Sau khi xác
              nhận, nhân viên phụ trách {displayTable} sẽ có mặt trong vòng 60
              giây để hỗ trợ.
            </p>
          </div>
        </div>
      </main>

      {/* Persistent Sticky Bottom Checkout Action Deck */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(30,27,26,0.08)] border-t border-[#dcc1b8]/40">
        <div className="mx-auto max-w-md px-4 py-3 space-y-2">
          <button
            type="button"
            onClick={handleConfirmPayment}
            className="flex min-h-[50px] w-full items-center justify-between rounded-xl bg-[#9a401c] hover:bg-[#ba5831] px-4 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Yêu Cầu Thanh Toán</span>
            </div>
            <div className="flex items-center gap-1.5 font-display text-base font-extrabold">
              <span className="ops-nums">{formatVND(finalPayable)}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>

          <div className="flex items-center justify-between px-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() =>
                showToast(
                  'Vui lòng đợi 30 giây để nhân viên đối chiếu phiếu.'
                )
              }
              className="flex items-center gap-1 text-[#56423c] hover:text-[#9a401c]"
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span>Sai sót món ăn? Báo đổi</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCallStaffOpen(true)}
              className="flex items-center gap-1 text-[#9a401c]"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Gọi nhân viên hỗ trợ</span>
            </button>
          </div>
        </div>
      </div>

      <CallStaffSheet
        isOpen={isCallStaffOpen}
        tableNumber={displayTable}
        onClose={() => setIsCallStaffOpen(false)}
      />
    </div>
  );
}
