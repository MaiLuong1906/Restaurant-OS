import { create } from 'zustand';

export type PosQuickActionIntent = 'checkin' | 'splitmerge' | 'settlement' | null;

interface QuickActionIntentState {
  posIntent: PosQuickActionIntent;
  setPosIntent: (intent: PosQuickActionIntent) => void;
  clearPosIntent: () => void;
}

export const useQuickActionIntentStore = create<QuickActionIntentState>((set) => ({
  posIntent: null,
  setPosIntent: (intent) => set({ posIntent: intent }),
  clearPosIntent: () => set({ posIntent: null }),
}));
