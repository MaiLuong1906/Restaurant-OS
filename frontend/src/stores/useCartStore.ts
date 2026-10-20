import { create } from 'zustand';
import { Dish, CartItem } from '@/types';

interface CartState {
  tableId: string | null;
  tableNumber: string | null;
  items: CartItem[];
  customerNotes: string;
  setTable: (tableId: string, tableNumber: string) => void;
  addItem: (dish: Dish, selectedModifiers?: { name: string; selected: string; extraPrice: number }[], note?: string) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, delta: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number; // VND integer
  getTotalItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  tableId: null,
  tableNumber: null,
  items: [],
  customerNotes: '',

  setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),

  addItem: (dish, selectedModifiers = [], note = '') => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.dish.id === dish.id && JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers)
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += 1;
        return { items: updated };
      }

      return {
        items: [...state.items, { dish, quantity: 1, selectedModifiers, note }],
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

  setNotes: (notes) => set({ customerNotes: notes }),

  clearCart: () => set({ items: [], customerNotes: '' }),

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const modifierExtra = item.selectedModifiers.reduce((acc, m) => acc + m.extraPrice, 0);
      return sum + (item.dish.price + modifierExtra) * item.quantity;
    }, 0);
  },

  getTotalItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
