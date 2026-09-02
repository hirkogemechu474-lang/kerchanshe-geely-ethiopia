'use client';

import { create } from 'zustand';

interface ConfigState {
  vehicleId: string | null;
  color: string | null;
  trim: string | null;
  options: string[];
  totalPrice: number;
  setVehicle: (id: string) => void;
  setColor: (color: string) => void;
  setTrim: (trim: string) => void;
  toggleOption: (option: string) => void;
  reset: () => void;
}

export const useConfigurator = create<ConfigState>((set) => ({
  vehicleId: null,
  color: null,
  trim: null,
  options: [],
  totalPrice: 0,
  setVehicle: (id) => set({ vehicleId: id, color: null, trim: null, options: [], totalPrice: 0 }),
  setColor: (color) => set({ color }),
  setTrim: (trim) => set({ trim }),
  toggleOption: (option) =>
    set((state) => ({
      options: state.options.includes(option)
        ? state.options.filter((o) => o !== option)
        : [...state.options, option],
    })),
  reset: () => set({ vehicleId: null, color: null, trim: null, options: [], totalPrice: 0 }),
}));
