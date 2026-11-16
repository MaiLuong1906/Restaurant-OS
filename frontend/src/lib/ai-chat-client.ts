import {
  AiChatService,
  SendMessageParams,
  ChatStreamEvent,
  AiChatMode,
} from './ai-chat-contract';
import { mockAiChatService } from './ai-chat-mock';

const SESSION_STORAGE_KEY = 'phoco_ai_session_id';

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
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              onEvent({ type: 'done' });
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr) as ChatStreamEvent;
              onEvent(parsed);
              if (parsed.type === 'done') {
                onDone();
                return;
              }
            } catch {
              // Ignore non-json chunk
            }
          }
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
