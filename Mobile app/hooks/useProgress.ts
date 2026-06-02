import { create } from 'zustand';

interface ProgressState {
  xp: number;
  streak: number;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
}

export const useProgress = create<ProgressState>((set) => ({
  xp: 0,
  streak: 0,

  addXP: (amount) =>
    set((state) => ({ xp: state.xp + amount })),

  incrementStreak: () =>
    set((state) => ({ streak: state.streak + 1 })),

  resetStreak: () => set({ streak: 0 }),
}));