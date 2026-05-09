import { create } from 'zustand';

interface DashboardState {
  recentStreams: any[];
  setRecentStreams: (streams: any[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  recentStreams: [],
  setRecentStreams: (streams) => set({ recentStreams: streams }),
}));
