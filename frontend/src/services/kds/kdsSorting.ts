import { OrderItem, OrderItemStatus, Ticket } from '@/types';

/**
 * Suy diễn trạng thái ticket theo đúng luật BE (`deriveTicketStatus`):
 * - Còn món WAITING -> WAITING
 * - Không còn WAITING, còn món READY -> READY
 * - Không còn WAITING/READY, còn món REJECTED -> REJECTED
 * - Còn lại -> SERVED
 */
export function deriveTicketStatus(items: OrderItem[]): OrderItemStatus {
  if (items.some((i) => i.status === 'WAITING')) return 'WAITING';
  if (items.some((i) => i.status === 'READY')) return 'READY';
  if (items.some((i) => i.status === 'REJECTED')) return 'REJECTED';
  return 'SERVED';
}

/**
 * Áp event UPDATE_STATUS ({ id: itemId, status }) từ STOMP `/topic/kds/orders`
 * vào danh sách tickets hiện tại mà không refetch hay đổi các món khác.
 */
export function applyKdsOrderStatusEvent(
  tickets: Ticket[],
  itemId: string,
  status: OrderItemStatus
): Ticket[] {
  let changed = false;
  const next = tickets.map((ticket) => {
    const hasItem = ticket.items.some((i) => i.id === itemId);
    if (!hasItem) return ticket;
    changed = true;
    const updatedItems = ticket.items.map((i) =>
      i.id === itemId ? { ...i, status } : i
    );
    return {
      ...ticket,
      items: updatedItems,
      status: deriveTicketStatus(updatedItems),
    };
  });
  return changed ? next : tickets;
}

/**
 * Lọc các ticket còn hiển thị trên hàng đợi KDS:
 * Giữ lại ticket có ít nhất 1 món WAITING, READY hoặc REJECTED (§1.3b).
 * Chỉ ẩn khỏi KDS khi toàn bộ món đã SERVED.
 */
export function filterActiveTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) =>
    t.items.some(
      (i) => i.status === 'WAITING' || i.status === 'READY' || i.status === 'REJECTED'
    )
  );
}

/**
 * Sắp xếp tickets:
 * 1. Ưu tiên ticket có cảnh báo dị ứng lên đầu.
 * 2. Ưu tiên SLA sớm hơn (hoặc quá hạn) lên trước.
 * 3. Fallback khi không có SLA hoặc SLA bằng nhau (tránh NaN): sắp xếp theo thời gian tạo (FIFO).
 */
export function sortKdsTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const aHasAllergy = a.items.some((i) => Boolean(i.allergy && i.allergy.trim().length > 0));
    const bHasAllergy = b.items.some((i) => Boolean(i.allergy && i.allergy.trim().length > 0));

    if (aHasAllergy && !bHasAllergy) return -1;
    if (!aHasAllergy && bHasAllergy) return 1;

    const aHasSla = Boolean(a.slaDeadline);
    const bHasSla = Boolean(b.slaDeadline);

    if (aHasSla && bHasSla) {
      const diff = new Date(a.slaDeadline!).getTime() - new Date(b.slaDeadline!).getTime();
      if (!Number.isNaN(diff) && diff !== 0) {
        return diff;
      }
    } else if (aHasSla && !bHasSla) {
      return -1;
    } else if (!aHasSla && bHasSla) {
      return 1;
    }

    const aCreated = new Date(a.createdAt).getTime();
    const bCreated = new Date(b.createdAt).getTime();
    return aCreated - bCreated;
  });
}
