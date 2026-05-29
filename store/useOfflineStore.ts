import { create } from 'zustand';

interface OfflineState {
  queue: any[];
  addToQueue: (item: any) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  queue: [],

  addToQueue: (item) =>
    set((state) => ({ queue: [...state.queue, item] })),

  clearQueue: () => set({ queue: [] }),
}));