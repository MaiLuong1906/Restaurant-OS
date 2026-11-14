import { create } from 'zustand';

export type PosQuickActionIntent = 'checkin' | 'splitmerge' | 'settlement' | null;

interface QuickActionIntentState {
  posIntent: PosQuickActionIntent;
  setPosIntent: (intent: PosQuickActionIntent) => void;
  clearPosIntent: () => void;

  pendingReservationSubTab: 'create' | 'checkin' | null;
  setPendingReservationSubTab: (value: 'create' | 'checkin' | null) => void;
  clearPendingReservationSubTab: () => void;

  pendingSplitMerge: boolean;
  setPendingSplitMerge: (value: boolean) => void;
  clearPendingSplitMerge: () => void;
}

export const useQuickActionIntentStore = create<QuickActionIntentState>((set) => ({
  posIntent: null,
  setPosIntent: (intent) => set({ posIntent: intent }),
  clearPosIntent: () => set({ posIntent: null }),

  pendingReservationSubTab: null,
  setPendingReservationSubTab: (value) => set({ pendingReservationSubTab: value }),
  clearPendingReservationSubTab: () => set({ pendingReservationSubTab: null }),

  pendingSplitMerge: false,
  setPendingSplitMerge: (value) => set({ pendingSplitMerge: value }),
  clearPendingSplitMerge: () => set({ pendingSplitMerge: false }),
}));
