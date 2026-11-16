/**
 * AI Chat API Contract
 * Endpoint: POST /api/v1/chat
 */

export const AI_CHAT_API_PATH = '/api/v1/chat';

export type AiChatMode = 'mock' | 'live';

export type ChatEventType =
  | 'text'
  | 'dish_card'
  | 'booking_card'
  | 'voucher_card'
  | 'done'
  | 'error';

export interface DishCardData {
  id: string;
  name: string;
  // Price in integer VND (never float)
  price: number;
  description: string;
  imageUrl: string;
  badge?: string;
}

export interface BookingCardData {
  guestName?: string;
  phone?: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  note?: string;
  isSample: boolean;
}

export interface VoucherCardData {
  code: string;
  title: string;
  discountText: string;
  conditions: string;
  validUntil: string;
  isSample: boolean;
}

export type ChatStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'dish_card'; dish: DishCardData }
  | { type: 'booking_card'; booking: BookingCardData }
  | { type: 'voucher_card'; voucher: VoucherCardData }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cards?: (
    | { type: 'dish'; data: DishCardData }
    | { type: 'booking'; data: BookingCardData }
    | { type: 'voucher'; data: VoucherCardData }
  )[];
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  mode: AiChatMode;
}

export interface SendMessageParams {
  sessionId: string;
  message: string;
  onEvent: (event: ChatStreamEvent) => void;
  onError: (error: Error) => void;
  onDone: () => void;
}

export interface AiChatService {
  sendMessage(params: SendMessageParams): Promise<void> | (() => void);
}
