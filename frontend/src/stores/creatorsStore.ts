import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Creator {
  id: string;
  tiktok_username: string;
  display_name: string;
  follower_count: number;
  is_live: boolean;
  avatar_url?: string;
  bio?: string;
  last_live_at?: string;
  total_streams?: number;
  total_revenue?: number;
}

interface CreatorsState {
  creators: Creator[];
  selectedCreatorId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCreators: (creators: Creator[]) => void;
  addCreator: (creator: Creator) => void;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  removeCreator: (id: string) => void;
  selectCreator: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  creators: [],
  selectedCreatorId: null,
  isLoading: false,
  error: null,
};

export const useCreatorsStore = create<CreatorsState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setCreators: (creators) => set({ creators, isLoading: false, error: null }),
      
      addCreator: (creator) => set((state) => ({
        creators: [creator, ...state.creators],
      })),
      
      updateCreator: (id, updates) => set((state) => ({
        creators: state.creators.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
      })),
      
      removeCreator: (id) => set((state) => ({
        creators: state.creators.filter(c => c.id !== id),
        selectedCreatorId: state.selectedCreatorId === id ? null : state.selectedCreatorId,
      })),
      
      selectCreator: (id) => set({ selectedCreatorId: id }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error, isLoading: false }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'creators-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
