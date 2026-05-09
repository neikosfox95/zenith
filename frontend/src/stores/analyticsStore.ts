import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnalyticsSummary {
  total_revenue: number;
  total_gifts: number;
  total_viewers: number;
  peak_viewers: number;
  average_duration: number;
  total_streams: number;
}

export interface TopGifter {
  username: string;
  total_diamonds: number;
  gift_count: number;
  avatar_url?: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  gifts: number;
}

interface AnalyticsState {
  summary: AnalyticsSummary;
  topGifters: TopGifter[];
  revenueHistory: RevenueData[];
  isLoading: boolean;
  lastSync: number;
  
  // Actions
  setSummary: (summary: AnalyticsSummary) => void;
  setTopGifters: (gifters: TopGifter[]) => void;
  setRevenueHistory: (history: RevenueData[]) => void;
  updateSummaryDelta: (delta: Partial<AnalyticsSummary>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  summary: {
    total_revenue: 0,
    total_gifts: 0,
    total_viewers: 0,
    peak_viewers: 0,
    average_duration: 0,
    total_streams: 0,
  },
  topGifters: [],
  revenueHistory: [],
  isLoading: false,
  lastSync: 0,
};

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSummary: (summary) => set({ 
        summary, 
        lastSync: Date.now(),
        isLoading: false 
      }),
      
      setTopGifters: (gifters) => set({ topGifters: gifters }),
      
      setRevenueHistory: (history) => set({ revenueHistory: history }),
      
      updateSummaryDelta: (delta) => set((state) => ({
        summary: { ...state.summary, ...delta },
        lastSync: Date.now(),
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'analytics-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
