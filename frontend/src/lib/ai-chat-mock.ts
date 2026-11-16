import {
  AiChatService,
  SendMessageParams,
  BookingCardData,
  VoucherCardData,
  DishCardData,
} from './ai-chat-contract';
import { PHO_CO_DISHES, FALLBACK_DISH_IMAGE } from './customer-menu-data';

export const MOCK_DELAY_MS = 750;

type BookingStep =
  | { step: 'awaiting_date' }
  | { step: 'awaiting_time'; date: string }
  | { step: 'awaiting_party_size'; date: string; time: string };

const sessionBookingSteps = new Map<string, BookingStep>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAiChatService: AiChatService = {
  async sendMessage({ sessionId, message, onEvent, onError, onDone }: SendMessageParams) {
    try {
      // 1. Latency simulation: 750ms fixed delay
      await delay(MOCK_DELAY_MS);

      const trimmed = message.trim();
      const lower = trimmed.toLowerCase();
      const currentStep = sessionBookingSteps.get(sessionId);

      // Check intent routing:
      // Active booking step first
      if (currentStep) {
        // If message clearly breaks intent, abandon booking
        if (
          lower.includes('chay') ||
          lower.includes('voucher') ||
          lower.includes('ưu đãi') ||
          lower.includes('gợi ý')
        ) {
          sessionBookingSteps.delete(sessionId);
        } else if (currentStep.step === 'awaiting_date') {
          sessionBookingSteps.set(sessionId, {
            step: 'awaiting_time',
            date: trimmed,
          });
          onEvent({
            type: 'text',
            text: `Dạ, quán xin ghi nhận ngày "${trimmed}". Quý khách dự kiến đến quán vào mấy giờ ạ?`,
          });
          onEvent({ type: 'done' });
          onDone();
          return;
        } else if (currentStep.step === 'awaiting_time') {
          sessionBookingSteps.set(sessionId, {
            step: 'awaiting_party_size',
            date: currentStep.date,
            time: trimmed,
          });
          onEvent({
            type: 'text',
            text: `Dạ khung giờ "${trimmed}". Bàn của mình sẽ đi khoảng bao nhiêu người ạ?`,
          });
          onEvent({ type: 'done' });
          onDone();
          return;
        } else if (currentStep.step === 'awaiting_party_size') {
          const match = trimmed.match(/\d+/);
          const size = match ? parseInt(match[0], 10) : 0;
          if (size <= 0) {
            onEvent({
              type: 'text',
              text: 'Dạ quý khách vui lòng cho em xin số lượng người cụ thể (ví dụ: 2 người, 4 người) để quán chuẩn bị bàn chu đáo nhất ạ.',
            });
            onEvent({ type: 'done' });
            onDone();
            return;
          }

          // Complete booking flow
          const bookingCard: BookingCardData = {
            date: currentStep.date,
            time: currentStep.time,
            partySize: size,
            status: 'Chờ xác nhận (Demo)',
            note: 'Dữ liệu mẫu demo',
            isSample: true,
          };

          sessionBookingSteps.delete(sessionId);

          onEvent({
            type: 'text',
            text: `Em đã tạo thông tin đặt bàn mẫu cho ngày ${currentStep.date} lúc ${currentStep.time} (${size} người).`,
          });
          onEvent({
            type: 'booking_card',
            booking: bookingCard,
          });
          onEvent({ type: 'done' });
          onDone();
          return;
        }
      }

      // Vegetarian intent (checked before general suggestion)
      if (lower.includes('chay')) {
        const vegDish = PHO_CO_DISHES.find(
          (d) => d.badge === 'Món chay' || d.isVegetarian || d.id === 'dish-nam-kho-to-chay'
        );
        const dishesToEmit: DishCardData[] = [];
        if (vegDish) {
          dishesToEmit.push({
            id: vegDish.id,
            name: vegDish.name,
            price: vegDish.price,
            description: vegDish.description || '',
            imageUrl: vegDish.imageUrl || FALLBACK_DISH_IMAGE,
            badge: vegDish.badge,
          });
        }
        // Also provide refreshing / suitable options
        const refreshing = PHO_CO_DISHES.find((d) => d.id === 'dish-che-sen');
        if (refreshing) {
          dishesToEmit.push({
            id: refreshing.id,
            name: refreshing.name,
            price: refreshing.price,
            description: refreshing.description || '',
            imageUrl: refreshing.imageUrl || FALLBACK_DISH_IMAGE,
            badge: refreshing.badge,
          });
        }

        onEvent({
          type: 'text',
          text: 'Phố Cổ xin giới thiệu các món thanh đạm, thuần chay thơm ngon chuẩn vị gia truyền:',
        });
        for (const dish of dishesToEmit) {
          onEvent({ type: 'dish_card', dish });
        }
        onEvent({ type: 'done' });
        onDone();
        return;
      }

      // Voucher intent
      if (lower.includes('voucher') || lower.includes('ưu đãi')) {
        const sampleVoucher: VoucherCardData = {
          code: 'VOUCHER_PHOCO10',
          title: 'Ưu Đãi Thực Khách Mới',
          discountText: 'Giảm 10% tổng hóa đơn món ăn',
          conditions: 'Áp dụng cho khách đặt bàn trước trên website hoặc dùng bữa tại quán.',
          validUntil: '31/12/2026',
          isSample: true,
        };

        onEvent({
          type: 'text',
          text: 'Dạ, Phố Cổ đang có chương trình ưu đãi tri ân thực khách:',
        });
        onEvent({
          type: 'voucher_card',
          voucher: sampleVoucher,
        });
        onEvent({ type: 'done' });
        onDone();
        return;
      }

      // Dish suggestion intent
      if (
        lower.includes('gợi ý') ||
        lower.includes('món cho') ||
        lower.includes('2 người') ||
        lower.includes('món ngon')
      ) {
        // Recommend 2-3 signature dishes from PHO_CO_DISHES
        const targetIds = ['dish-goi-ngo-sen', 'dish-nem-ran', 'dish-bun-cha'];
        const dishes: DishCardData[] = PHO_CO_DISHES.filter((d) => targetIds.includes(d.id)).map(
          (d) => ({
            id: d.id,
            name: d.name,
            price: d.price,
            description: d.description || '',
            imageUrl: d.imageUrl || FALLBACK_DISH_IMAGE,
            badge: d.badge,
          })
        );

        onEvent({
          type: 'text',
          text: 'Dạ với bàn 2 người, Phố Cổ xin gợi ý mâm cơm truyền thống hài hòa khai vị và món chính:',
        });
        for (const dish of dishes) {
          onEvent({ type: 'dish_card', dish });
        }
        onEvent({ type: 'done' });
        onDone();
        return;
      }

      // Booking intent
      if (lower.includes('đặt bàn')) {
        sessionBookingSteps.set(sessionId, { step: 'awaiting_date' });
        onEvent({
          type: 'text',
          text: 'Dạ em rất hân hạnh được hỗ trợ quý khách đặt bàn tại Phố Cổ. Quý khách dự định ghé quán vào ngày nào ạ?',
        });
        onEvent({ type: 'done' });
        onDone();
        return;
      }

      // Fallback
      onEvent({
        type: 'text',
        text: 'Dạ, Phố Cổ luôn sẵn lòng phục vụ quý khách. Quý khách có thể chọn các gợi ý bên dưới hoặc nhắn tin để em tư vấn chi tiết hơn ạ.',
      });
      onEvent({ type: 'done' });
      onDone();
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  },
};
