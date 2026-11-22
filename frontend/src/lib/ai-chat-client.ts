import {
  AiChatService,
  SendMessageParams,
  ChatStreamEvent,
  AiChatMode,
  DishCardData,
  BookingCardData,
  VoucherCardData,
} from './ai-chat-contract';
import { mockAiChatService } from './ai-chat-mock';

const SESSION_STORAGE_KEY = 'phoco_ai_session_id';

const FALLBACK_DISH_IMAGE =
  'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function mapDishPayload(raw: Record<string, unknown>): DishCardData {
  return {
    id: String(raw.dish_id || raw.id || 'dish-unknown'),
    name: String(raw.name || 'Món ăn đặc sản'),
    price: typeof raw.price === 'number' ? Math.round(raw.price) : 0,
    description:
      String(raw.description || (raw.available ? 'Đang phục vụ sẵn sàng' : 'Món ngon nổi bật')),
    imageUrl: String(raw.imageUrl || raw.image_url || FALLBACK_DISH_IMAGE),
    badge: raw.badge ? String(raw.badge) : raw.available ? 'Bán chạy' : undefined,
  };
}

function mapBookingPayload(raw: Record<string, unknown>): BookingCardData {
  return {
    bookingCode: raw.booking_code ? String(raw.booking_code) : undefined,
    tableId: raw.table_id ? String(raw.table_id) : undefined,
    guestName: raw.name || raw.guestName ? String(raw.name || raw.guestName) : undefined,
    phone: raw.phone_masked || raw.phone ? String(raw.phone_masked || raw.phone) : undefined,
    date: String(raw.date || 'Hôm nay'),
    time: String(raw.time || '19:00'),
    partySize: Number(raw.party_size || raw.partySize || 2),
    status: String(raw.status || 'CONFIRMED'),
    note: raw.note ? String(raw.note) : undefined,
    isSample: false,
  };
}

function mapVoucherPayload(raw: Record<string, unknown>): VoucherCardData {
  const discountVnd = typeof raw.discount_vnd === 'number' ? raw.discount_vnd : 0;
  const minOrderVnd = typeof raw.min_order_vnd === 'number' ? raw.min_order_vnd : 0;

  return {
    code: String(raw.code || 'PHOCO'),
    title: String(raw.title || raw.code || 'Ưu đãi ẩm thực Phố Cổ'),
    discountText: raw.discountText
      ? String(raw.discountText)
      : discountVnd > 0
        ? `Giảm ${formatVnd(discountVnd)}`
        : 'Ưu đãi đặc biệt',
    conditions: raw.conditions
      ? String(raw.conditions)
      : raw.description
        ? String(raw.description)
        : minOrderVnd > 0
          ? `Áp dụng cho đơn từ ${formatVnd(minOrderVnd)}`
          : 'Áp dụng khi dùng bữa tại nhà hàng',
    validUntil: String(raw.expiry || raw.validUntil || '31/12/2026'),
    isSample: false,
  };
}

/**
 * Phân tích và chuyển đổi một SSE block (event + data) thành ChatStreamEvent
 */
export function parseSseBlock(block: string): ChatStreamEvent | null {
  const lines = block.split('\n');
  let eventType = '';
  const dataLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('event:')) {
      eventType = trimmed.slice(6).trim();
    } else if (trimmed.startsWith('data:')) {
      dataLines.push(trimmed.slice(5).trim());
    }
  }

  const rawData = dataLines.join('\n');
  if (!eventType && !rawData) {
    return null;
  }

  if (rawData === '[DONE]' || eventType === 'done') {
    return { type: 'done' };
  }

  if (eventType === 'text') {
    return { type: 'text', text: rawData };
  }

  if (eventType === 'error') {
    return { type: 'error', message: rawData || 'Đã có lỗi xảy ra' };
  }

  if (eventType === 'dish_card') {
    try {
      const parsedJson = JSON.parse(rawData);
      return { type: 'dish_card', dish: mapDishPayload(parsedJson) };
    } catch {
      return null;
    }
  }

  if (eventType === 'booking_card') {
    try {
      const parsedJson = JSON.parse(rawData);
      return { type: 'booking_card', booking: mapBookingPayload(parsedJson) };
    } catch {
      return null;
    }
  }

  if (eventType === 'voucher_card') {
    try {
      const parsedJson = JSON.parse(rawData);
      return { type: 'voucher_card', voucher: mapVoucherPayload(parsedJson) };
    } catch {
      return null;
    }
  }

  // Fallback nếu không có event header rõ ràng nhưng data có JSON type
  try {
    const parsed = JSON.parse(rawData);
    if (parsed.type === 'dish_card' && parsed.dish) {
      return { type: 'dish_card', dish: mapDishPayload(parsed.dish) };
    }
    if (parsed.type === 'booking_card' && parsed.booking) {
      return { type: 'booking_card', booking: mapBookingPayload(parsed.booking) };
    }
    if (parsed.type === 'voucher_card' && parsed.voucher) {
      return { type: 'voucher_card', voucher: mapVoucherPayload(parsed.voucher) };
    }
    if (parsed.type === 'done') {
      return { type: 'done' };
    }
    if (parsed.type === 'text' && typeof parsed.text === 'string') {
      return { type: 'text', text: parsed.text };
    }
  } catch {
    // Không phải JSON
  }

  return null;
}

/**
 * Lấy hoặc sinh mới UUID cho session của khách hàng
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-4000-8000-000000000000';
  }

  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 32) {
      return existing;
    }

    let newId: string;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newId = crypto.randomUUID();
    } else {
      // Fallback RFC4122 v4 UUID generator
      newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    localStorage.setItem(SESSION_STORAGE_KEY, newId);
    return newId;
  } catch {
    return '00000000-0000-4000-8000-000000000000';
  }
}

/**
 * Client kết nối SSE Live
 */
export const liveAiChatService: AiChatService = {
  async sendMessage({ sessionId, message, onEvent, onError, onDone }: SendMessageParams) {
    const endpointUrl =
      process.env.NEXT_PUBLIC_AI_CHAT_URL || 'http://localhost:8000/api/v1/chat';

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const event = parseSseBlock(block);
          if (event) {
            onEvent(event);
            if (event.type === 'done') {
              onDone();
              return;
            }
          }
        }
      }

      if (buffer.trim()) {
        const event = parseSseBlock(buffer);
        if (event) {
          onEvent(event);
        }
      }

      onEvent({ type: 'done' });
      onDone();
    } catch {
      // Luôn trả về thông báo lỗi thân thiện tiếng Việt cho người dùng
      onError(
        new Error('Dạ hiện tại máy chủ AI chưa sẵn sàng. Quý khách vui lòng thử lại sau giây lát ạ!')
      );
    }
  },
};

/**
 * Lấy AI Chat Provider dựa theo cấu hình môi trường NEXT_PUBLIC_AI_CHAT_MODE
 */
export function getAiChatService(): AiChatService {
  const mode = (process.env.NEXT_PUBLIC_AI_CHAT_MODE as AiChatMode) || 'mock';
  if (mode === 'live') {
    return liveAiChatService;
  }
  return mockAiChatService;
}
