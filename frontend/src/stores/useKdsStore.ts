import { create } from 'zustand';
import { OrderItem, OrderItemStatus } from '@/types';
import { getStompClient } from '@/lib/stomp';
import { fetchApi } from '@/lib/api-client';

interface KdsState {
  items: OrderItem[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeWebSocket: () => void;
  syncWithBackend: () => Promise<void>;
  updateItemStatusOptimistic: (itemId: string, newStatus: OrderItemStatus) => Promise<void>;
  addItem: (item: OrderItem) => void;
  setItems: (items: OrderItem[]) => void;
}

export const useKdsStore = create<KdsState>((set, get) => ({
  items: [],
  isConnected: false,
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),

  addItem: (item) => {
    set((state) => {
      if (state.items.some((i) => i.id === item.id)) {
        return state;
      }
      return { items: [item, ...state.items] };
    });
  },

  syncWithBackend: async () => {
    set({ isLoading: true, error: null });
    try {
      // Reconnect reconciliation: Gọi REST API để lấy toàn bộ danh sách đơn đang active
      const activeItems = await fetchApi<OrderItem[]>('/kds/items/active');
      set({ items: activeItems, isLoading: false });
    } catch (err) {
      console.warn('[KDS Store] Reconnect sync fallback to local cache:', err);
      set({ isLoading: false });
    }
  },

  initializeWebSocket: () => {
    const client = getStompClient();

    client.onConnect = () => {
      set({ isConnected: true });
      // Bắt buộc theo Rule 03: Gọi REST sync khi vừa kết nối / tái kết nối
      get().syncWithBackend();

      // Subscribe topic cập nhật đơn bếp
      client.subscribe('/topic/kds/orders', (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.action === 'CREATE_ITEM') {
            get().addItem(payload.data);
          } else if (payload.action === 'UPDATE_STATUS') {
            set((state) => ({
              items: state.items.map((it) =>
                it.id === payload.data.id ? { ...it, status: payload.data.status } : it
              ),
            }));
          }
        } catch (e) {
          console.error('[KDS STOMP] Parse message error:', e);
        }
      });
    };

    client.onDisconnect = () => {
      set({ isConnected: false });
    };

    if (!client.active) {
      client.activate();
    }
  },

  updateItemStatusOptimistic: async (itemId, newStatus) => {
    const previousItems = get().items;

    // 1. Optimistic Update UI tức thì (<16ms)
    set((state) => ({
      items: state.items.map((it) =>
        it.id === itemId ? { ...it, status: newStatus } : it
      ),
    }));

    try {
      // 2. Gửi request đồng bộ tới backend
      await fetchApi(`/kds/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      // 3. Rollback nếu backend từ chối
      console.error('[KDS Store] Update failed, rolling back:', err);
      set({ items: previousItems, error: 'Không thể cập nhật trạng thái món' });
    }
  },
}));
