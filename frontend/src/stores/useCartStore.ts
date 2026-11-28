import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Dish, CartItem } from '../types';
import {
  FALLBACK_DISH_IMAGE,
  type PlacedBatch,
  type PlacedBatchItem,
} from '../lib/customer-menu-data';

export type CustomerPaymentMethod = 'vietqr' | 'cash' | 'pos';

export function getCartLineId(
  dishId: string,
  selectedModifiers: { name: string; selected: string; extraPrice: number }[] = []
): string {
  return `${dishId}::${JSON.stringify(selectedModifiers)}`;
}

const memoryStore = new Map<string, string>();

const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      // Fallback to memory store
    }
    return memoryStore.get(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch {
      // Fallback to memory store
    }
    memoryStore.set(name, value);
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
    } catch {
      // Fallback to memory store
    }
    memoryStore.delete(name);
  },
};

interface CartState {
  tableId: string | null;
  tableNumber: string | null;
  tableToken?: string | null;
  items: CartItem[];
  customerNotes: string;
  placedBatches: PlacedBatch[];
  lastIdempotencyKey: string | null;
  hasMemberPromo: boolean;
  lastPaymentMethod: CustomerPaymentMethod;
  lastPaidTotal: number;
  setTable: (tableId: string, tableNumber: string, tableToken?: string | null) => void;
  addItem: (
    dish: Dish,
    selectedModifiers?: { name: string; selected: string; extraPrice: number }[],
    note?: string,
    quantity?: number
  ) => void;
  removeItem: (lineIdOrDishId: string) => void;
  updateQuantity: (lineIdOrDishId: string, delta: number) => void;
  updateItemNote: (lineIdOrDishId: string, note: string) => void;
  setNotes: (notes: string) => void;
  setHasMemberPromo: (enabled: boolean) => void;
  recordPayment: (method: CustomerPaymentMethod, total: number) => void;
  clearCart: () => void;
  clearPlacedBatches: () => void;
  submitOrderToKitchen: (idempotencyKey: string) => void;
  expeditePlacedItem: (itemId: string) => void;
  getTotalAmount: () => number; // VND integer
  getTotalItemCount: () => number;
  getDishQuantityInCart: (dishId: string) => number;
  getPlacedSubtotal: () => number; // VND integer
  getPlacedItemCount: () => number;
}

function matchesTargetLine(item: CartItem, lineIdOrDishId: string): boolean {
  const lineId = getCartLineId(item.dish.id, item.selectedModifiers);
  if (lineIdOrDishId.includes('::')) {
    return lineId === lineIdOrDishId;
  }
  return item.dish.id === lineIdOrDishId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tableId: 'ban-04',
      tableNumber: 'Bàn 04',
      tableToken: null,
      items: [],
      customerNotes: '',
      placedBatches: [],
      lastIdempotencyKey: null,
      hasMemberPromo: false,
      lastPaymentMethod: 'vietqr',
      lastPaidTotal: 0,

      setTable: (tableId, tableNumber, tableToken) =>
        set((state) => ({
          tableId,
          tableNumber,
          tableToken: tableToken !== undefined ? tableToken : state.tableToken,
        })),

      addItem: (dish, selectedModifiers = [], note = '', quantity = 1) => {
        set((state) => {
          const targetLineId = getCartLineId(dish.id, selectedModifiers);
          const existingIndex = state.items.findIndex(
            (item) =>
              getCartLineId(item.dish.id, item.selectedModifiers) ===
              targetLineId
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

      removeItem: (lineIdOrDishId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !matchesTargetLine(item, lineIdOrDishId)
          ),
        }));
      },

      updateQuantity: (lineIdOrDishId, delta) => {
        set((state) => {
          // If a plain dishId is passed (e.g. from menu quick-stepper) and multiple lines exist,
          // prioritize the default line (empty modifiers) or the last added line for that dish
          let targetKey = lineIdOrDishId;
          if (!lineIdOrDishId.includes('::')) {
            const matchingLines = state.items.filter(
              (i) => i.dish.id === lineIdOrDishId
            );
            if (matchingLines.length > 1) {
              const defaultLine =
                matchingLines.find(
                  (i) => i.selectedModifiers.length === 0
                ) ?? matchingLines[matchingLines.length - 1];
              targetKey = getCartLineId(
                defaultLine.dish.id,
                defaultLine.selectedModifiers
              );
            }
          }

          const updated = state.items
            .map((item) => {
              if (matchesTargetLine(item, targetKey)) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[];

          return { items: updated };
        });
      },

      updateItemNote: (lineIdOrDishId, note) => {
        set((state) => ({
          items: state.items.map((item) =>
            matchesTargetLine(item, lineIdOrDishId) ? { ...item, note } : item
          ),
        }));
      },

      setNotes: (notes) => set({ customerNotes: notes }),

      setHasMemberPromo: (enabled) => set({ hasMemberPromo: enabled }),

      recordPayment: (method, total) =>
        set({ lastPaymentMethod: method, lastPaidTotal: total }),

      clearCart: () => set({ items: [], customerNotes: '' }),

      clearPlacedBatches: () =>
        set({
          placedBatches: [],
          lastIdempotencyKey: null,
          hasMemberPromo: false,
          lastPaymentMethod: 'vietqr',
          lastPaidTotal: 0,
        }),

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
                imageUrl: cartItem.dish.imageUrl || FALLBACK_DISH_IMAGE,
                unitLabel: `${cartItem.quantity} phần`,
                quantity: cartItem.quantity,
                unitPrice: cartItem.dish.price + modifierExtra,
                status: 'WAITING',
                cookingNote:
                  cartItem.note ||
                  state.customerNotes ||
                  'Bếp đang tiếp nhận & chế biến nóng',
                etaText: 'Chờ bếp (~5-8p)',
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
    }),
    {
      name: 'pho-co-customer-cart',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        tableId: state.tableId,
        tableNumber: state.tableNumber,
        tableToken: state.tableToken,
        items: state.items,
        customerNotes: state.customerNotes,
        placedBatches: state.placedBatches,
        lastIdempotencyKey: state.lastIdempotencyKey,
        hasMemberPromo: state.hasMemberPromo,
        lastPaymentMethod: state.lastPaymentMethod,
        lastPaidTotal: state.lastPaidTotal,
      }),
    }
  )
);
