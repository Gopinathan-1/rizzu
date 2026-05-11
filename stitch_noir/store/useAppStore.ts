import { create } from 'zustand';

interface AppState {
  selectedTone: string;
  setSelectedTone: (tone: string) => void;
  isPro: boolean;
  setPro: (isPro: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedTone: 'Witty',
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  isPro: true,
  setPro: (isPro) => set({ isPro }),
}));
