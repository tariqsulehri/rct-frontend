import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number; // in milliseconds
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (item) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      id,
      type: item.type,
      title: item.title,
      message: item.message,
      duration: item.duration ?? 4000,
      createdAt: Date.now(),
    };
    set((state) => ({
      // Keep maximum 5 toasts at once
      toasts: [...state.toasts.slice(-4), newToast],
    }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (message: string, title?: string, duration = 4000) =>
    useToastStore.getState().addToast({ type: 'success', message, title, duration }),
  error: (message: string, title?: string, duration = 5000) =>
    useToastStore.getState().addToast({ type: 'error', message, title, duration }),
  warning: (message: string, title?: string, duration = 4500) =>
    useToastStore.getState().addToast({ type: 'warning', message, title, duration }),
  info: (message: string, title?: string, duration = 4000) =>
    useToastStore.getState().addToast({ type: 'info', message, title, duration }),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
  clear: () => useToastStore.getState().clearToasts(),
};
