'use client';

import { useState } from 'react';
import {
  STAFF_QUICK_REQUESTS,
  triggerHaptic,
} from '@/lib/customer-menu-data';
import {
  Utensils,
  Coffee,
  Sparkles,
  Clock,
  Flame,
  MessageCircle,
  BellRing,
  PhoneCall,
  CheckCircle2,
  Zap,
  X,
  FileEdit,
} from 'lucide-react';

export interface CallStaffSheetProps {
  isOpen: boolean;
  tableNumber: string;
  onClose: () => void;
}

export function CallStaffSheet({
  isOpen,
  tableNumber,
  onClose,
}: CallStaffSheetProps) {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleRequest = (requestText: string) => {
    triggerHaptic(15);
    setSelectedRequests((prev) =>
      prev.includes(requestText)
        ? prev.filter((r) => r !== requestText)
        : [...prev, requestText]
    );
  };

  const handleSendRequest = () => {
    triggerHaptic(25);
    setIsSubmitted(true);
  };

  const handleCancelRequest = () => {
    setSelectedRequests([]);
    setCustomNote('');
    setIsSubmitted(false);
  };

  const handleDismissAll = () => {
    setIsSubmitted(false);
    onClose();
  };

  const renderIcon = (iconName: string, isSelected: boolean) => {
    const className = `h-4 w-4 ${isSelected ? 'text-white' : 'text-[#9a401c]'}`;
    switch (iconName) {
      case 'utensils':
        return <Utensils className={className} />;
      case 'coffee':
        return <Coffee className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'clock':
        return <Clock className={className} />;
      case 'flame':
        return <Flame className={className} />;
      default:
        return <MessageCircle className={className} />;
    }
  };

  const summaryItems = [
    ...selectedRequests,
    ...(customNote.trim() ? [customNote.trim()] : []),
  ];
  const summaryText =
    summaryItems.length > 0
      ? summaryItems.join(', ')
      : `Hỗ trợ tổng quát tại ${tableNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#1e1b1a]/60 backdrop-blur-xs">
      <div className="mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[#fff8f6] text-[#1e1b1a] shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#dcc1b8]/50 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-[#1e1b1a]">
              Gọi Nhân Viên Hỗ Trợ
            </h2>
            <span className="rounded-full bg-[#ffdbcf] px-2.5 py-0.5 text-xs font-bold text-[#380d00]">
              {tableNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe6e4] text-[#1e1b1a] hover:bg-[#e9e1df] active:scale-95 transition-transform"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Ambient Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#342f2e] via-[#56423c] to-[#9a401c] p-4 text-white shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7ffc97]">
              <span className="h-2 w-2 rounded-full bg-[#7ffc97] animate-ping" />
              <span>Đội ngũ phục vụ trực sẵn</span>
            </div>
            <p className="mt-1 font-display text-base font-bold">
              {tableNumber} • Tầng 1 (Khu Tràng Tiền)
            </p>
            <p className="mt-0.5 text-xs text-white/80">
              Chọn nhu cầu bên dưới để nhân viên mang đúng vật phẩm ngay
            </p>
          </div>

          {/* 6 Quick Request Tags */}
          <div>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#56423c]">
                Chọn yêu cầu phổ biến (1 chạm)
              </span>
              <span className="text-xs font-semibold text-[#9a401c]">
                Đã chọn {selectedRequests.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {STAFF_QUICK_REQUESTS.map((tag) => {
                const isSelected = selectedRequests.includes(tag.requestText);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleRequest(tag.requestText)}
                    className={`flex flex-col items-start rounded-xl p-3 text-left shadow-xs transition-transform active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#9a401c] text-white ring-2 ring-[#9a401c]/30'
                        : 'bg-white text-[#1e1b1a] border border-[#dcc1b8]/40 hover:bg-[#fbf2f0]'
                    }`}
                  >
                    <div
                      className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                        isSelected ? 'bg-[#ba5831]' : 'bg-[#f5ecea]'
                      }`}
                    >
                      {renderIcon(tag.iconName, isSelected)}
                    </div>
                    <span className="text-xs font-bold leading-snug">
                      {tag.title}
                    </span>
                    <span
                      className={`mt-0.5 text-[11px] ${
                        isSelected ? 'text-[#ffdbcf]' : 'text-[#56423c]'
                      }`}
                    >
                      {tag.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Request Input */}
          <div className="rounded-xl bg-white p-3.5 shadow-xs border border-[#dcc1b8]/40">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="custom-staff-note"
                className="flex items-center gap-1.5 text-xs font-bold text-[#1e1b1a]"
              >
                <FileEdit className="h-4 w-4 text-[#9a401c]" />
                <span>Yêu cầu riêng biệt khác</span>
              </label>
              <span className="text-[11px] text-[#56423c]">Không bắt buộc</span>
            </div>
            <textarea
              id="custom-staff-note"
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ví dụ: Xin thêm 1 ghế trẻ em, nước canh bớt ngọt..."
              className="w-full resize-none rounded-lg bg-[#fbf2f0] p-2.5 text-xs text-[#1e1b1a] placeholder:text-[#89726a] focus:outline-none focus:ring-1 focus:ring-[#9a401c]"
            />
          </div>

          {/* 60-second SLA Assurance */}
          <div className="flex items-center gap-3 rounded-xl bg-[#fbf2f0] p-3 border border-[#dcc1b8]/40">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7ffc97] text-[#002109]">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1e1b1a]">
                Cam kết có mặt trong vòng 60 giây
              </p>
              <p className="truncate text-[11px] text-[#56423c]">
                Thông báo được chuyển trực tiếp tới thiết bị nhân viên tầng 1
              </p>
            </div>
          </div>

          {/* Primary Submit CTA */}
          <button
            type="button"
            onClick={handleSendRequest}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#9a401c] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#ba5831] active:scale-[0.98] transition-all"
          >
            <BellRing className="h-4 w-4" />
            <span>Gửi Yêu Cầu Hỗ Trợ</span>
          </button>

          {/* Emergency Hotline Strip */}
          <div className="flex items-center justify-between rounded-xl bg-white p-3.5 shadow-xs border border-[#dcc1b8]/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe6e4] text-[#1e1b1a]">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1e1b1a]">
                  Cần hỗ trợ khẩn cấp?
                </p>
                <p className="text-[11px] text-[#56423c]">
                  Hotline Quản lý: 0984 123 456
                </p>
              </div>
            </div>
            <a
              href="tel:0984123456"
              className="rounded-full bg-[#e7e1dd] px-3.5 py-2 text-xs font-bold text-[#1d1b19] active:scale-95 transition-transform"
            >
              Gọi ngay
            </a>
          </div>
        </div>

        {/* Confirmation Overlay when Submitted */}
        {isSubmitted ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1e1b1a]/65 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#7ffc97] text-[#002109]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1e1b1a]">
                Đã Tiếp Nhận Yêu Cầu!
              </h3>
              <p className="mt-1 text-xs text-[#56423c]">
                Nhân viên khu vực Tầng 1 đang di chuyển đến{' '}
                <strong className="font-bold text-[#9a401c]">
                  {tableNumber}
                </strong>
                .
              </p>

              <div className="my-4 rounded-xl bg-[#fbf2f0] p-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#006b2c]">
                  <Clock className="h-4 w-4" />
                  <span>Thời gian ước tính: ~45 giây</span>
                </div>
                <p className="mt-1 text-xs text-[#56423c] line-clamp-2">
                  Nội dung: {summaryText}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="min-h-[46px] w-full rounded-full bg-[#9a401c] py-2.5 text-xs font-bold text-white active:scale-95 transition-transform"
                >
                  Quay lại bàn ăn
                </button>
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  className="min-h-[40px] w-full rounded-full py-2 text-xs font-semibold text-[#ba1a1a] active:scale-95 transition-transform"
                >
                  Hủy yêu cầu này
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
