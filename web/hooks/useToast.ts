'use client';

import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, variant?: ToastVariant, duration?: number) => void;
  remove: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
  },
  remove: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  success: (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant: 'success', duration: 4000 }] }));
  },
  error: (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant: 'error', duration: 5000 }] }));
  },
  warning: (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant: 'warning', duration: 4000 }] }));
  },
  info: (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant: 'info', duration: 3000 }] }));
  },
}));
