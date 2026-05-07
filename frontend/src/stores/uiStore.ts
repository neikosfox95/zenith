import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  isOnline: boolean;
  globalLoading: boolean;
  refreshing: boolean;
  
  // Actions
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  setOnline: (online: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isOnline: true,
  globalLoading: false,
  refreshing: false,
  
  showToast: (toast) => set((state) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };
    
    // Auto-hide after duration
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, toast.duration || 3000);
    
    return { toasts: [...state.toasts, newToast] };
  }),
  
  hideToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
  
  setOnline: (online) => set({ isOnline: online }),
  
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  
  setRefreshing: (refreshing) => set({ refreshing: refreshing }),
  
  clearToasts: () => set({ toasts: [] }),
}));
