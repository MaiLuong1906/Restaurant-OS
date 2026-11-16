'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, Calendar, Users, Clock, Tag } from 'lucide-react';
import {
  ChatMessage,
  DishCardData,
  BookingCardData,
  VoucherCardData,
  ChatStreamEvent,
} from '@/lib/ai-chat-contract';
import { getAiChatService, getOrCreateSessionId } from '@/lib/ai-chat-client';
import { FALLBACK_DISH_IMAGE } from '@/lib/customer-menu-data';
import { formatVnd } from '@/lib/formatMoney';

function DishBubbleCard({ dish }: { dish: DishCardData }) {
  const [imgSrc, setImgSrc] = React.useState(dish.imageUrl || FALLBACK_DISH_IMAGE);
  const [hasFallback, setHasFallback] = React.useState(false);

  const handleError = () => {
    if (!hasFallback) {
      setHasFallback(true);
      setImgSrc(FALLBACK_DISH_IMAGE);
    }
  };

  return (
    <div className="mt-2 bg-white rounded-lg border border-[#E9E4DC] overflow-hidden shadow-xs flex flex-col">
      <div className="relative aspect-16/9 w-full bg-[#E9E4DC]/30 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={dish.name}
          onError={handleError}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {dish.badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#8C1D2C] text-white text-[10px] font-semibold">
            {dish.badge}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#141210] line-clamp-1">{dish.name}</h4>
          <p className="mt-0.5 text-[11px] text-[#7A6A58] line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#E9E4DC]/60 flex items-center justify-between">
          <span className="text-xs font-bold text-[#8C1D2C]">{formatVnd(dish.price)}</span>
          <Link
            href="/menu"
            className="text-[11px] font-semibold text-[#7A6A58] hover:text-[#8C1D2C] transition-colors"
          >
            Chi tiết &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookingBubbleCard({ booking }: { booking: BookingCardData }) {
  return (
    <div className="mt-2 p-3 bg-white rounded-lg border border-[#E9E4DC] shadow-xs space-y-2">
      <div className="flex items-center justify-between border-b border-[#E9E4DC]/60 pb-1.5">
        <span className="text-xs font-bold text-[#8C1D2C]">Thông Tin Đặt Bàn</span>
        {booking.isSample && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E9E4DC]/60 text-[#7A6A58]">
            Dữ liệu mẫu demo
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[#141210]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#7A6A58]" />
          <span>{booking.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#7A6A58]" />
          <span>{booking.time}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Users className="w-3.5 h-3.5 text-[#7A6A58]" />
          <span>Số lượng: {booking.partySize} khách</span>
        </div>
      </div>
      <div className="pt-1 text-[11px] text-[#7A6A58] flex items-center justify-between">
        <span>Trạng thái: {booking.status}</span>
        {booking.note && <span className="italic">{booking.note}</span>}
      </div>
    </div>
  );
}

function VoucherBubbleCard({ voucher }: { voucher: VoucherCardData }) {
  return (
    <div className="mt-2 p-3 bg-white rounded-lg border border-[#E9E4DC] shadow-xs space-y-2">
      <div className="flex items-center justify-between border-b border-[#E9E4DC]/60 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C1D2C]">
          <Tag className="w-3.5 h-3.5" />
          <span>{voucher.code}</span>
        </div>
        {voucher.isSample && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E9E4DC]/60 text-[#7A6A58]">
            Dữ liệu mẫu demo
          </span>
        )}
      </div>
      <div>
        <h4 className="text-xs font-bold text-[#141210]">{voucher.title}</h4>
        <p className="mt-0.5 text-xs font-semibold text-[#8C1D2C]">{voucher.discountText}</p>
        <p className="mt-1 text-[11px] text-[#7A6A58] leading-relaxed">{voucher.conditions}</p>
      </div>
      <div className="pt-1 border-t border-[#E9E4DC]/40 text-[10px] text-[#7A6A58]">
        Hạn sử dụng: {voucher.validUntil}
      </div>
    </div>
  );
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [isThinking, setIsThinking] = React.useState(false);
  const [sessionId, setSessionId] = React.useState('');

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      text: 'Xin chào quý khách! Em là Trợ lý ẩm thực Phố Cổ. Em có thể hỗ trợ quý khách đặt bàn, gợi ý món ngon, món chay hoặc các thông tin ưu đãi hấp dẫn hôm nay.',
    },
  ]);

  const isOpenRef = React.useRef(isOpen);
  isOpenRef.current = isOpen;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'Đặt bàn tối nay',
    'Gợi ý món cho 2 người',
    'Món chay có gì?',
    'Voucher hôm nay',
  ];

  // Initialize UUID session
  React.useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const sendMessage = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsThinking(true);

      const assistantMsgId = `asst-${Date.now()}`;
      let textAccumulator = '';
      const cardsAccumulator: NonNullable<ChatMessage['cards']> = [];

      const service = getAiChatService();
      service.sendMessage({
        sessionId: sessionId || getOrCreateSessionId(),
        message: trimmed,
        onEvent: (event: ChatStreamEvent) => {
          if (event.type === 'text') {
            textAccumulator = textAccumulator ? `${textAccumulator}\n${event.text}` : event.text;
          } else if (event.type === 'dish_card') {
            cardsAccumulator.push({ type: 'dish', data: event.dish });
          } else if (event.type === 'booking_card') {
            cardsAccumulator.push({ type: 'booking', data: event.booking });
          } else if (event.type === 'voucher_card') {
            cardsAccumulator.push({ type: 'voucher', data: event.voucher });
          } else if (event.type === 'error') {
            textAccumulator = event.message;
          }

          setMessages((prev) => {
            const existingIdx = prev.findIndex((m) => m.id === assistantMsgId);
            const updatedMsg: ChatMessage = {
              id: assistantMsgId,
              role: 'assistant',
              text: textAccumulator,
              cards: [...cardsAccumulator],
            };
            if (existingIdx >= 0) {
              const copy = [...prev];
              copy[existingIdx] = updatedMsg;
              return copy;
            }
            return [...prev, updatedMsg];
          });
        },
        onError: (err) => {
          setIsThinking(false);
          const errorMsg: ChatMessage = {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text:
              err.message ||
              'Dạ hiện tại máy chủ AI chưa sẵn sàng. Quý khách vui lòng thử lại sau giây lát ạ!',
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
        onDone: () => {
          setIsThinking(false);
        },
      });
    },
    [isThinking, sessionId]
  );

  // External trigger phoco:open-booking
  React.useEffect(() => {
    const handleOpenBooking = () => {
      if (!isOpenRef.current) {
        setIsOpen(true);
        sendMessage('Đặt bàn tối nay');
      } else {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('phoco:open-booking', handleOpenBooking);
    return () => {
      window.removeEventListener('phoco:open-booking', handleOpenBooking);
    };
  }, [sendMessage]);

  // Handle Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus input and scroll to bottom when opened or messages change
  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const hasUserSentMessage = messages.some((m) => m.role === 'user');

  return (
    <>
      {/* Unconditional FAB Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Mở trợ lý ẩm thực Phố Cổ"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#8C1D2C] hover:bg-[#6F1623] text-white flex items-center justify-center shadow-lg transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Backdrop & Dialog Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[55] bg-[#141210]/40 sm:bg-transparent transition-opacity"
            aria-hidden="true"
          />

          {/* Dialog Panel: Mobile bottom-sheet & Desktop popover */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Trợ lý ẩm thực Phố Cổ"
            className="fixed bottom-0 inset-x-0 w-full max-h-[85svh] rounded-t-xl bg-white border-t border-[#E9E4DC] sm:bottom-20 sm:right-6 sm:left-auto sm:inset-x-auto sm:w-96 sm:max-h-[600px] sm:rounded-xl sm:shadow-xl sm:border sm:border-[#E9E4DC] z-[60] flex flex-col font-sans text-[#141210] overflow-hidden"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-[#E9E4DC]" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-[#E9E4DC] flex items-center justify-between shrink-0 bg-[#F5F2EA]/60">
              <div>
                <h2 className="text-sm font-bold text-[#141210]">Trợ lý ẩm thực Phố Cổ</h2>
                <p className="text-xs text-[#7A6A58]">Tư vấn món &amp; hỗ trợ đặt bàn</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng trợ lý"
                className="p-1.5 rounded-lg text-[#7A6A58] hover:text-[#141210] hover:bg-[#E9E4DC]/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#8C1D2C] text-white rounded-br-xs'
                        : 'bg-[#F5F2EA] text-[#141210] border border-[#E9E4DC]/60 rounded-bl-xs'
                    }`}
                  >
                    {m.text && <p className="whitespace-pre-line">{m.text}</p>}
                    {m.cards && m.cards.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {m.cards.map((c, idx) => {
                          if (c.type === 'dish') {
                            return <DishBubbleCard key={idx} dish={c.data} />;
                          }
                          if (c.type === 'booking') {
                            return <BookingBubbleCard key={idx} booking={c.data} />;
                          }
                          if (c.type === 'voucher') {
                            return <VoucherBubbleCard key={idx} voucher={c.data} />;
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-[#F5F2EA] border border-[#E9E4DC]/60 text-xs text-[#7A6A58] italic">
                    Đang kiểm tra...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips (Visible before first user message) */}
            {!hasUserSentMessage && (
              <div className="px-4 py-2 border-t border-[#E9E4DC]/60 bg-[#F5F2EA]/30 flex flex-wrap gap-1.5 shrink-0">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={isThinking}
                    onClick={() => sendMessage(chip)}
                    className="px-2.5 py-1 text-xs rounded-full bg-white border border-[#E9E4DC] text-[#141210] hover:border-[#8C1D2C] hover:text-[#8C1D2C] disabled:opacity-50 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-[#E9E4DC] flex items-center gap-2 shrink-0 bg-white"
            >
              <input
                ref={inputRef}
                type="text"
                disabled={isThinking}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isThinking ? 'Đang phản hồi...' : 'Nhập câu hỏi hoặc yêu cầu...'}
                className="flex-1 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E9E4DC] bg-[#F5F2EA]/30 text-[#141210] placeholder-[#7A6A58] focus:outline-hidden focus:border-[#8C1D2C] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                aria-label="Gửi tin nhắn"
                className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-2 rounded-lg bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-40 disabled:hover:bg-[#8C1D2C] text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
