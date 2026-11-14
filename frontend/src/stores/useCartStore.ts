import { create } from 'zustand';
import type { Dish, CartItem } from '../types';
import {
  INITIAL_PLACED_BATCHES,
  type PlacedBatch,
  type PlacedBatchItem,
} from '../lib/customer-menu-data';

interface CartState {
  tableId: string | null;
  tableNumber: string | null;
  items: CartItem[];
  customerNotes: string;
  placedBatches: PlacedBatch[];
  lastIdempotencyKey: string | null;
  setTable: (tableId: string, tableNumber: string) => void;
  addItem: (
    dish: Dish,
    selectedModifiers?: { name: string; selected: string; extraPrice: number }[],
    note?: string,
    quantity?: number
  ) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, delta: number) => void;
  updateItemNote: (dishId: string, note: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  submitOrderToKitchen: (idempotencyKey: string) => void;
  expeditePlacedItem: (itemId: string) => void;
  getTotalAmount: () => number; // VND integer
  getTotalItemCount: () => number;
  getDishQuantityInCart: (dishId: string) => number;
  getPlacedSubtotal: () => number; // VND integer
  getPlacedItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  tableId: 'ban-04',
  tableNumber: 'Bàn 04',
  items: [],
  customerNotes: '',
  placedBatches: INITIAL_PLACED_BATCHES,
  lastIdempotencyKey: null,

  setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),

  addItem: (dish, selectedModifiers = [], note = '', quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.dish.id === dish.id &&
          JSON.stringify(item.selectedModifiers) ===
            JSON.stringify(selectedModifiers)
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          note: note || updated[existingIndex].note,
        };
        return { items: updated };
      }

      return {
        items: [
          ...state.items,
          { dish, quantity, selectedModifiers, note },
        ],
      };
    });
  },

  removeItem: (dishId) => {
    set((state) => ({
      items: state.items.filter((item) => item.dish.id !== dishId),
    }));
  },

  updateQuantity: (dishId, delta) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      return { items: updated };
    });
  },

  updateItemNote: (dishId, note) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.dish.id === dishId ? { ...item, note } : item
      ),
    }));
  },

  setNotes: (notes) => set({ customerNotes: notes }),

  clearCart: () => set({ items: [], customerNotes: '' }),

  submitOrderToKitchen: (idempotencyKey) => {
    set((state) => {
      if (state.items.length === 0) {
        return { lastIdempotencyKey: idempotencyKey };
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const nextBatchNum = state.placedBatches.length + 1;

      const newBatchItems: PlacedBatchItem[] = state.items.map(
        (cartItem, idx) => {
          const modifierExtra = cartItem.selectedModifiers.reduce(
            (acc, m) => acc + m.extraPrice,
            0
          );
          const modifierText = cartItem.selectedModifiers
            .map((m) => m.selected)
            .join(', ');
          return {
            id: `placed-${idempotencyKey}-${idx}`,
            dishId: cartItem.dish.id,
            dishName: cartItem.dish.name,
            description:
              cartItem.note ||
              modifierText ||
              cartItem.dish.description ||
              'Chế biến chuẩn vị Phố Cổ',
            imageUrl:
              cartItem.dish.imageUrl ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
            unitLabel: `${cartItem.quantity} phần`,
            quantity: cartItem.quantity,
            unitPrice: cartItem.dish.price + modifierExtra,
            status: 'COOKING',
            cookingNote:
              cartItem.note ||
              state.customerNotes ||
              'Bếp đang tiếp nhận & chế biến nóng',
            etaText: 'Đang nấu (~5-8p)',
            expedited: false,
          };
        }
      );

      const newBatch: PlacedBatch = {
        id: `batch-${nextBatchNum}-${idempotencyKey.slice(0, 6)}`,
        batchNumber: nextBatchNum,
        title: `Đợt ${nextBatchNum} · Gửi lúc ${timeStr}`,
        submittedAt: timeStr,
        isCompleted: false,
        items: newBatchItems,
      };

      return {
        placedBatches: [newBatch, ...state.placedBatches],
        items: [],
        customerNotes: '',
        lastIdempotencyKey: idempotencyKey,
      };
    });
  },

  expeditePlacedItem: (itemId) => {
    set((state) => ({
      placedBatches: state.placedBatches.map((batch) => ({
        ...batch,
        items: batch.items.map((item) =>
          item.id === itemId ? { ...item, expedited: true } : item
        ),
      })),
    }));
  },

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const modifierExtra = item.selectedModifiers.reduce(
        (acc, m) => acc + m.extraPrice,
        0
      );
      return sum + (item.dish.price + modifierExtra) * item.quantity;
    }, 0);
  },

  getTotalItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getDishQuantityInCart: (dishId) => {
    const { items } = get();
    return items
      .filter((item) => item.dish.id === dishId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },

  getPlacedSubtotal: () => {
    const { placedBatches } = get();
    return placedBatches.reduce(
      (batchSum, batch) =>
        batchSum +
        batch.items.reduce(
          (itemSum, item) => itemSum + item.unitPrice * item.quantity,
          0
        ),
      0
    );
  },

  getPlacedItemCount: () => {
    const { placedBatches } = get();
    return placedBatches.reduce(
      (batchSum, batch) =>
        batchSum +
        batch.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
  },
}));
