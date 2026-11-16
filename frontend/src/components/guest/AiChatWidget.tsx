'use client';

import * as React from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Xin chào quý khách! Em là Trợ lý ẩm thực Phố Cổ. Em có thể hỗ trợ quý khách đặt bàn, gợi ý món ngon, món chay hoặc các thông tin ưu đãi hấp dẫn hôm nay.',
    },
  ]);

  const nextIdRef = React.useRef(2);
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

  const sendMessage = React.useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsgId = nextIdRef.current++;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: trimmed,
    };

    const replyMsgId = nextIdRef.current++;
    const assistantMsg: ChatMessage = {
      id: replyMsgId,
      role: 'assistant',
      text: `Dạ, em đã ghi nhận yêu cầu "${trimmed}" của quý khách. Đội ngũ nhân viên Phố Cổ sẽ sẵn sàng hỗ trợ quý khách ngay ạ!`,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue('');
  }, []);

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
  }, [isOpen, messages]);

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
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#8C1D2C] text-white rounded-br-xs'
                        : 'bg-[#F5F2EA] text-[#141210] border border-[#E9E4DC]/60 rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips (Visible before first user message) */}
            {!hasUserSentMessage && (
              <div className="px-4 py-2 border-t border-[#E9E4DC]/60 bg-[#F5F2EA]/30 flex flex-wrap gap-1.5 shrink-0">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    className="px-2.5 py-1 text-xs rounded-full bg-white border border-[#E9E4DC] text-[#141210] hover:border-[#8C1D2C] hover:text-[#8C1D2C] transition-colors"
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
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi hoặc yêu cầu..."
                className="flex-1 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E9E4DC] bg-[#F5F2EA]/30 text-[#141210] placeholder-[#7A6A58] focus:outline-hidden focus:border-[#8C1D2C]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
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
