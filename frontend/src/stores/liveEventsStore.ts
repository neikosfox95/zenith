import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface LiveEvent {
  id: string;
  stream_id: string;
  event_type: string;
  payload: any;
  created_at: string;
  creator_username?: string;
}

export interface LiveStream {
  id: string;
  creator_id: string;
  creator_username: string;
  is_live: boolean;
  viewer_count: number;
  start_time: string;
  peak_viewers: number;
  total_revenue: number;
}

interface LiveEventsState {
  events: LiveEvent[];
  streams: LiveStream[];
  isConnected: boolean;
  lastUpdate: number;
  
  // Actions
  addEvent: (event: LiveEvent) => void;
  addEvents: (events: LiveEvent[]) => void;
  updateStream: (stream: Partial<LiveStream> & { id: string }) => void;
  setConnected: (connected: boolean) => void;
  clearOldEvents: (olderThan: number) => void;
  reset: () => void;
}

const initialState = {
  events: [],
  streams: [],
  isConnected: false,
  lastUpdate: Date.now(),
};

export const useLiveEventsStore = create<LiveEventsState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addEvent: (event) => set((state) => {
        // Keep only last 1000 events in memory
        const events = [event, ...state.events].slice(0, 1000);
        return { events, lastUpdate: Date.now() };
      }),
      
      addEvents: (newEvents) => set((state) => {
        const events = [...newEvents, ...state.events].slice(0, 1000);
        return { events, lastUpdate: Date.now() };
      }),
      
      updateStream: (streamUpdate) => set((state) => {
        const existingIndex = state.streams.findIndex(s => s.id === streamUpdate.id);
        
        if (existingIndex >= 0) {
          // Update existing
          const streams = [...state.streams];
          streams[existingIndex] = { ...streams[existingIndex], ...streamUpdate };
          return { streams, lastUpdate: Date.now() };
        } else {
          // Add new
          return { 
            streams: [streamUpdate as LiveStream, ...state.streams],
            lastUpdate: Date.now()
          };
        }
      }),
      
      setConnected: (connected) => set({ isConnected: connected }),
      
      clearOldEvents: (olderThan) => set((state) => {
        const cutoff = Date.now() - olderThan;
        const events = state.events.filter(
          e => new Date(e.created_at).getTime() > cutoff
        );
        return { events };
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'live-events-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        // Only persist streams, not events (too large)
        streams: state.streams 
      }),
    }
  )
);
