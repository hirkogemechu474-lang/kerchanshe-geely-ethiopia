'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_COMPARE_VEHICLES } from '@/constants/vehicles';

interface CompareStore {
  vehicleIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  canAdd: () => boolean;
}

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      vehicleIds: [],
      add: (id: string) => {
        const { vehicleIds } = get();
        if (vehicleIds.length >= MAX_COMPARE_VEHICLES) return;
        if (vehicleIds.includes(id)) return;
        set({ vehicleIds: [...vehicleIds, id] });
      },
      remove: (id: string) => {
        set((state) => ({ vehicleIds: state.vehicleIds.filter((v) => v !== id) }));
      },
      clear: () => set({ vehicleIds: [] }),
      canAdd: () => get().vehicleIds.length < MAX_COMPARE_VEHICLES,
    }),
    { name: 'geely-compare' }
  )
);
