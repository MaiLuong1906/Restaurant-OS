'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { formatVND } from '@/lib/utils';
import { triggerHaptic } from '@/lib/customer-menu-data';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CallStaffSheet } from '@/components/customer/CallStaffSheet';
import {
  CheckCircle2,
  Leaf,
  ReceiptText,
  QrCode,
  FileText,
  Download,
  ChefHat,
  Star,
  Utensils,
  Zap,
  Sparkles,
  ShieldCheck,
  Heart,
  Send,
  BookOpen,
} from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  1: 'Cần cải thiện • 1 sao',
  2: 'Tạm ổn • 2 sao',
  3: 'Hài lòng • 3 sao',
  4: 'Rất ngon • 4 sao',
  5: 'Tuyệt hảo • 5 sao',
};

const FEEDBACK_TAGS = [
  { id: 'delicious', label: 'Món ăn ngon đậm đà', icon: Utensils },
  { id: 'fast', label: 'Phục vụ nhanh nhẹn', icon: Zap },
  { id: 'cozy', label: 'Không gian ấm cúng', icon: Sparkles },
  { id: 'fair-price', label: 'Giá hợp lý', icon: ShieldCheck },
];

export default function CustomerPaymentSuccessPage() {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Món ăn ngon đậm đà',
    'Phục vụ nhanh nhẹn',
  ]);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isCallStaffOpen, setIsCallStaffOpen] = useState(false);

  const { tableNumber, getPlacedSubtotal } = useCartStore();
  const displayTable = tableNumber || 'Bàn 04';

  const rawSubtotal = getPlacedSubtotal();
  const memberDiscount = Math.round(rawSubtotal * 0.1);
  const afterDiscount = rawSubtotal - memberDiscount;
  const vatAmount = Math.round(afterDiscount * 0.08);
  const finalPayable =
    Math.round((afterDiscount + vatAmount) / 100) * 100 || 429600;

  const toggleFeedbackTag = (label: string) => {
    triggerHaptic(10);
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const handleSubmitReview = () => {
    triggerHaptic(25);
    setReviewSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] text-[#1e1b1a] pb-12">
      <CustomerHeader
        title="Hoàn Tất & Đánh Giá"
        subtitle="Cảm ơn quý khách"
        tableNumber={displayTable}
        showBack
        onOpenCallStaff={() => setIsCallStaffOpen(true)}
      />

      <main className="mx-auto w-full max-w-md px-4 pt-5 space-y-5">
        {/* Success Hero */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#efe6e4] shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00873a] text-white shadow-md">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <Leaf className="absolute -top-1 -right-1 h-5 w-5 text-[#006b2c]" />
          </div>

          <span className="mb-1.5 rounded-full bg-[#ffdbcf] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#380d00]">
            Giao dịch hoàn tất
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1e1b1a]">
            Thanh Toán Thành Công!
          </h2>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#56423c]">
            Nhà hàng Phố Cổ xin chân thành cảm ơn Quý khách tại{' '}
            <strong className="font-bold text-[#9a401c]">{displayTable}</strong>{' '}
            đã tin tưởng và thưởng thức bữa ăn hôm nay.
          </p>
        </div>

        {/* Receipt Summary Card */}
        <div className="rounded-2xl bg-white p-4 shadow-2xs border border-[#dcc1b8]/40 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <ReceiptText className="h-4 w-4 text-[#9a401c]" />
              <span className="text-xs font-bold text-[#1e1b1a]">
                Tóm Tắt Hóa Đơn
              </span>
            </div>
            <span className="rounded bg-[#00873a]/15 px-2 py-0.5 text-[11px] font-bold text-[#006b2c]">
              Đã Quyết Toán
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#56423c]">
              <span>Mã hóa đơn:</span>
              <span className="font-bold text-[#1e1b1a]">#HD-202410-04</span>
            </div>
            <div className="flex items-center justify-between text-[#56423c]">
              <span>Thời gian:</span>
              <span className="text-[#1e1b1a]">12:45 • Hôm nay</span>
            </div>
            <div className="flex items-center justify-between text-[#56423c]">
              <span>Phương thức:</span>
              <span className="flex items-center gap-1 font-semibold text-[#1e1b1a]">
                <QrCode className="h-3.5 w-3.5 text-[#9a401c]" />
                <span>Chuyển khoản VietQR</span>
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-[#efe6e4]" />

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-[#56423c]">
                Tổng thanh toán
              </p>
              <p className="text-[11px] text-[#676461]">Đã bao gồm thuế phí</p>
            </div>
            <span className="ops-nums font-display text-xl font-extrabold text-[#9a401c]">
              {formatVND(finalPayable)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => triggerHaptic(10)}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-[#f5ecea] hover:bg-[#efe6e4] px-3 py-2 text-[11px] font-bold text-[#1e1b1a] transition-colors"
            >
              <FileText className="h-4 w-4 text-[#9a401c]" />
              <span>Xem e-Invoice VAT</span>
            </button>
            <button
              type="button"
              onClick={() => triggerHaptic(10)}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-[#f5ecea] hover:bg-[#efe6e4] px-3 py-2 text-[11px] font-bold text-[#1e1b1a] transition-colors"
            >
              <Download className="h-4 w-4 text-[#615e5b]" />
              <span>Tải biên nhận</span>
            </button>
          </div>
        </div>

        {/* Memory Highlight Banner */}
        <div className="flex items-center gap-3 rounded-xl bg-[#fbf2f0] p-3 shadow-2xs border border-[#dcc1b8]/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR1gRtNUikXs05mHFRAlVgVFl17BMZnFQGhfuT_y5b9M4DpjfkSGNPRmOKCIGLBqmMUEJr-mWq9BXmkPMxQMoVkyFaYgDYgNKc2oqFTTCnr-Dv01YDsZ_ZNvSj-r6qcy-bZIOlMTiAlzr3le1bcjTqAHqwC-wSJT-XBvwWdmMyPZVvcqkctqWGJ2Eqb0bht9qWTCoY4SB8wmA8F0kzHnbLZFntjFJjUWQwJnaoLg"
            alt="Phố Cổ Dine"
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase text-[#9a401c]">
              <ChefHat className="h-3.5 w-3.5 text-[#006b2c]" />
              <span>Kỷ niệm vị giác</span>
            </div>
            <p className="truncate text-xs font-bold text-[#1e1b1a]">
              Bữa ăn đậm đà phong vị Bắc
            </p>
            <p className="truncate text-[11px] text-[#56423c]">
              Cảm ơn đã ghé dùng bữa cùng Phố Cổ!
            </p>
          </div>
        </div>

        {/* Interactive 5-Star Rating & Feedback Card (UC06) */}
        <div className="rounded-2xl bg-white p-4 shadow-2xs border border-[#dcc1b8]/40 space-y-4">
          <div className="text-center">
            <h3 className="font-display text-base font-bold text-[#1e1b1a]">
              Đánh Giá Trải Nghiệm
            </h3>
            <p className="mt-0.5 text-xs text-[#56423c]">
              Ý kiến của Quý khách giúp Phố Cổ phục vụ ngày càng chu đáo hơn
            </p>
          </div>

          {/* 5 Stars */}
          <div className="flex items-center justify-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isFilled = starValue <= rating;
              return (
                <button
                  key={starValue}
                  type="button"
                  aria-label={`${starValue} sao`}
                  onClick={() => {
                    triggerHaptic(10);
                    setRating(starValue);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:scale-110 active:scale-95 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      isFilled
                        ? 'fill-[#ba5831] text-[#ba5831]'
                        : 'text-[#e9e1df]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="text-center text-xs font-bold text-[#9a401c]">
            {RATING_LABELS[rating]}
          </div>

          {/* Quick Feedback Tags */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#56423c]">
              Điều Quý khách hài lòng nhất:
            </p>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TAGS.map((tag) => {
                const Icon = tag.icon;
                const isSelected = selectedTags.includes(tag.label);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleFeedbackTag(tag.label)}
                    className={`flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#9a401c] text-white shadow-2xs'
                        : 'bg-[#f5ecea] text-[#1e1b1a] hover:bg-[#efe6e4]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <label
              htmlFor="review-comment"
              className="text-[11px] font-semibold text-[#56423c]"
            >
              Lời nhắn gửi đầu bếp hoặc nhà hàng (tùy chọn):
            </label>
            <textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ thêm cảm nhận của Quý khách..."
              className="w-full resize-none rounded-xl bg-[#f5ecea] p-3 text-xs text-[#1e1b1a] placeholder:text-[#89726a] focus:bg-[#efe6e4] focus:outline-none focus:ring-1 focus:ring-[#9a401c]"
            />
          </div>
        </div>

        {/* Review Submitted Toast */}
        {reviewSubmitted && (
          <div className="flex items-center gap-3 rounded-xl bg-[#00873a] p-4 text-white shadow-md">
            <Heart className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-xs font-bold">Cảm ơn lời góp ý của bạn!</p>
              <p className="text-[11px] text-white/90">
                Phố Cổ rất mong được phục vụ bạn trong những dịp tới.
              </p>
            </div>
          </div>
        )}

        {/* Primary & Secondary CTAs */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={reviewSubmitted}
            onClick={handleSubmitReview}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#9a401c] hover:bg-[#ba5831] text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            <span>
              {reviewSubmitted
                ? 'Đã ghi nhận phản hồi!'
                : 'Gửi đánh giá & Kết thúc'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/menu')}
            className="flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#e7e1dd] hover:bg-[#e9e1df] text-xs font-bold text-[#1d1b19] active:scale-[0.98] transition-all"
          >
            <BookOpen className="h-4 w-4" />
            <span>Quay lại xem thực đơn</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-[11px] text-[#56423c]">
          <p className="font-bold">Phố Cổ Dine • Di Sản &amp; Ẩm Thực</p>
          <p className="mt-0.5">
            Hẹn gặp lại Quý khách • Chúc một ngày an lành!
          </p>
        </div>
      </main>

      <CallStaffSheet
        isOpen={isCallStaffOpen}
        tableNumber={displayTable}
        onClose={() => setIsCallStaffOpen(false)}
      />
    </div>
  );
}
