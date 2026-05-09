import { create } from 'zustand';

interface LiveState {
  filter: string;
  setFilter: (filter: string) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
