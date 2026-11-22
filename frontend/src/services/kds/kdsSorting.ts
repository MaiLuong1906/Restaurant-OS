import { Ticket } from '@/types';

/**
 * Lọc các ticket còn việc cần làm (có ít nhất 1 món WAITING hoặc READY).
 */
export function filterActiveTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) =>
    t.items.some((i) => i.status === 'WAITING' || i.status === 'READY')
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
