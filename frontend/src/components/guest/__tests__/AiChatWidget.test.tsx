import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getOrCreateSessionId,
  getAiChatService,
  liveAiChatService,
} from '../../../lib/ai-chat-client';
import { mockAiChatService } from '../../../lib/ai-chat-mock';
import { ChatStreamEvent } from '../../../lib/ai-chat-contract';
import { PHO_CO_DISHES } from '../../../lib/customer-menu-data';

describe('AiChatWidget & AI Client Tests', () => {
  const originalEnv = process.env.NEXT_PUBLIC_AI_CHAT_MODE;

  beforeEach(() => {
    // Stub localStorage in node environment
    const store: Record<string, string> = {};
    const storageStub = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };

    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_AI_CHAT_MODE = originalEnv;
    vi.unstubAllGlobals();
  });

  describe('Group A: Executable logic tests', () => {
    it('creates a valid RFC4122 v4 UUID and persists in localStorage', () => {
      localStorage.removeItem('phoco_ai_session_id');
      const id1 = getOrCreateSessionId();
      const v4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id1).toMatch(v4Regex);
      expect(localStorage.getItem('phoco_ai_session_id')).toBe(id1);

      // Persistence
      const id2 = getOrCreateSessionId();
      expect(id2).toBe(id1);

      // Fresh generation after removal
      localStorage.removeItem('phoco_ai_session_id');
      const id3 = getOrCreateSessionId();
      expect(id3).toMatch(v4Regex);
      expect(id3).not.toBe(id1);
    });

    it('selects provider based on NEXT_PUBLIC_AI_CHAT_MODE', () => {
      delete process.env.NEXT_PUBLIC_AI_CHAT_MODE;
      expect(getAiChatService()).toBe(mockAiChatService);

      process.env.NEXT_PUBLIC_AI_CHAT_MODE = 'mock';
      expect(getAiChatService()).toBe(mockAiChatService);

      process.env.NEXT_PUBLIC_AI_CHAT_MODE = 'live';
      expect(getAiChatService()).toBe(liveAiChatService);
    });

    it('walks multi-step mock booking flow to completion', async () => {
      const testSessionId = `test-book-${Date.now()}`;
      const events: ChatStreamEvent[] = [];
      const onEvent = (e: ChatStreamEvent) => events.push(e);
      const onError = vi.fn();
      const onDone = vi.fn();

      // Step 1: Initial booking request
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Đặt bàn tối nay',
        onEvent,
        onError,
        onDone,
      });

      expect(onError).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);
      const hasDatePrompt = events.some(
        (e) => e.type === 'text' && e.text.includes('ngày nào')
      );
      expect(hasDatePrompt).toBe(true);

      // Step 2: Provide Date
      events.length = 0;
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Tối mai',
        onEvent,
        onError,
        onDone,
      });
      const hasTimePrompt = events.some(
        (e) => e.type === 'text' && e.text.includes('mấy giờ')
      );
      expect(hasTimePrompt).toBe(true);

      // Step 3: Provide Time
      events.length = 0;
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: '19:00',
        onEvent,
        onError,
        onDone,
      });
      const hasPartyPrompt = events.some(
        (e) => e.type === 'text' && e.text.includes('bao nhiêu người')
      );
      expect(hasPartyPrompt).toBe(true);

      // Step 4: Provide Party Size
      events.length = 0;
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: '4 người',
        onEvent,
        onError,
        onDone,
      });
      const bookingCardEvent = events.find((e) => e.type === 'booking_card');
      expect(bookingCardEvent).toBeDefined();
      if (bookingCardEvent && bookingCardEvent.type === 'booking_card') {
        expect(bookingCardEvent.booking.partySize).toBe(4);
        expect(bookingCardEvent.booking.date).toBe('Tối mai');
        expect(bookingCardEvent.booking.time).toBe('19:00');
        expect(bookingCardEvent.booking.isSample).toBe(true);
        expect(bookingCardEvent.booking.note).toContain('Dữ liệu mẫu demo');
      }
    }, 20000);

    it('re-prompts for party size when given invalid input during booking', async () => {
      const testSessionId = `test-invalid-${Date.now()}`;
      const events: ChatStreamEvent[] = [];
      const onEvent = (e: ChatStreamEvent) => events.push(e);
      const onError = vi.fn();
      const onDone = vi.fn();

      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Đặt bàn',
        onEvent,
        onError,
        onDone,
      });
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Tối mai',
        onEvent,
        onError,
        onDone,
      });
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: '19:00',
        onEvent,
        onError,
        onDone,
      });

      events.length = 0;
      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'chưa biết nữa',
        onEvent,
        onError,
        onDone,
      });

      const hasCard = events.some((e) => e.type === 'booking_card');
      expect(hasCard).toBe(false);
      const hasReprompt = events.some(
        (e) => e.type === 'text' && e.text.includes('số lượng người cụ thể')
      );
      expect(hasReprompt).toBe(true);
    }, 20000);

    it('returns 2-3 real dish cards from PHO_CO_DISHES on dish recommendation intent', async () => {
      const testSessionId = `test-dish-${Date.now()}`;
      const events: ChatStreamEvent[] = [];
      const onEvent = (e: ChatStreamEvent) => events.push(e);
      const onError = vi.fn();
      const onDone = vi.fn();

      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Gợi ý món cho 2 người',
        onEvent,
        onError,
        onDone,
      });

      const dishCards = events.filter((e) => e.type === 'dish_card');
      expect(dishCards.length).toBeGreaterThanOrEqual(2);
      expect(dishCards.length).toBeLessThanOrEqual(3);

      const realIds = PHO_CO_DISHES.map((d) => d.id);
      for (const card of dishCards) {
        if (card.type === 'dish_card') {
          expect(realIds).toContain(card.dish.id);
          expect(Number.isInteger(card.dish.price)).toBe(true);
          const sourceDish = PHO_CO_DISHES.find((d) => d.id === card.dish.id);
          expect(card.dish.price).toBe(sourceDish?.price);
        }
      }
    }, 15000);

    it('returns vegetarian dishes including Nấm Đông Cô Kho Tộ Chay on vegetarian intent', async () => {
      const testSessionId = `test-veg-${Date.now()}`;
      const events: ChatStreamEvent[] = [];
      const onEvent = (e: ChatStreamEvent) => events.push(e);
      const onError = vi.fn();
      const onDone = vi.fn();

      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Món chay có gì?',
        onEvent,
        onError,
        onDone,
      });

      const dishCards = events.filter((e) => e.type === 'dish_card');
      expect(dishCards.length).toBeGreaterThanOrEqual(1);
      const hasMushroom = dishCards.some(
        (c) => c.type === 'dish_card' && c.dish.id === 'dish-nam-kho-to-chay'
      );
      expect(hasMushroom).toBe(true);
    }, 15000);

    it('returns sample voucher card on voucher intent with 10% discount', async () => {
      const testSessionId = `test-voucher-${Date.now()}`;
      const events: ChatStreamEvent[] = [];
      const onEvent = (e: ChatStreamEvent) => events.push(e);
      const onError = vi.fn();
      const onDone = vi.fn();

      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Voucher hôm nay',
        onEvent,
        onError,
        onDone,
      });

      const voucherEvents = events.filter((e) => e.type === 'voucher_card');
      expect(voucherEvents.length).toBe(1);
      if (voucherEvents[0] && voucherEvents[0].type === 'voucher_card') {
        expect(voucherEvents[0].voucher.code).toBe('VOUCHER_PHOCO10');
        expect(voucherEvents[0].voucher.discountText).toContain('10%');
        expect(voucherEvents[0].voucher.isSample).toBe(true);
        expect(voucherEvents[0].voucher.validUntil).toBe('31/12/2026');
      }
    }, 15000);

    it('returns polite fallback response without cards on off-script message', async () => {
      const testSessionId = `test-fallback-${Date.now()}`;
      const events: ChatStreamEvent[] = [];
      const onEvent = (e: ChatStreamEvent) => events.push(e);
      const onError = vi.fn();
      const onDone = vi.fn();

      await mockAiChatService.sendMessage({
        sessionId: testSessionId,
        message: 'Thời tiết hôm nay thế nào bạn ơi?',
        onEvent,
        onError,
        onDone,
      });

      expect(onError).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);

      const textEvents = events.filter((e) => e.type === 'text');
      expect(textEvents.length).toBeGreaterThanOrEqual(1);

      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('done');

      const cardEvents = events.filter(
        (e) =>
          e.type === 'dish_card' ||
          e.type === 'booking_card' ||
          e.type === 'voucher_card'
      );
      expect(cardEvents.length).toBe(0);
    }, 15000);
  });

  describe('Group B: Source-inspection assertions on AiChatWidget.tsx', () => {
    const widgetPath = path.resolve(
      __dirname,
      '../../../../src/components/guest/AiChatWidget.tsx'
    );
    const widgetSource = fs.readFileSync(widgetPath, 'utf8');

    it('asserts open/close wiring, Escape key, and backdrop click in source', () => {
      expect(widgetSource).toContain('aria-label="Mở trợ lý ẩm thực Phố Cổ"');
      expect(widgetSource).toContain('aria-label="Đóng trợ lý"');
      // FAB opening invocation
      expect(widgetSource).toContain('onClick={() => setIsOpen((prev) => !prev)}');
      // Backdrop element click closing
      expect(widgetSource).toContain('onClick={() => setIsOpen(false)}');
      // Escape key handler
      expect(widgetSource).toContain("e.key === 'Escape'");
      expect(widgetSource).toContain('setIsOpen(false)');
    });

    it('asserts all 4 suggestion chips in exact order in source', () => {
      const idx1 = widgetSource.indexOf('Đặt bàn tối nay');
      const idx2 = widgetSource.indexOf('Gợi ý món cho 2 người');
      const idx3 = widgetSource.indexOf('Món chay có gì?');
      const idx4 = widgetSource.indexOf('Voucher hôm nay');

      expect(idx1).toBeGreaterThan(-1);
      expect(idx2).toBeGreaterThan(idx1);
      expect(idx3).toBeGreaterThan(idx2);
      expect(idx4).toBeGreaterThan(idx3);
    });

    it('asserts phoco:open-booking event listener and opening path in source', () => {
      expect(widgetSource).toContain("addEventListener('phoco:open-booking'");
      expect(widgetSource).toContain("removeEventListener('phoco:open-booking'");
      // Handler path opening widget and sending booking chip
      expect(widgetSource).toContain('setIsOpen(true)');
      expect(widgetSource).toContain("sendMessage('Đặt bàn tối nay')");
      expect(widgetSource).toContain('isOpenRef.current');
    });

    it('asserts accessibility dialog role and modal attributes in source', () => {
      expect(widgetSource).toContain('role="dialog"');
      expect(widgetSource).toContain('aria-modal="true"');
      expect(widgetSource).toContain('aria-label="Trợ lý ẩm thực Phố Cổ"');
    });
  });
});
