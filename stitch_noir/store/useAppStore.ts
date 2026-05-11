import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AnalysisResult = {
  tone: string;
  mood: string;
  replyStyles: string[];
  extractedText?: string;
  replies?: string[];
};

export type VaultItem = {
  id: string;
  type: 'reply' | 'bio' | 'opener';
  content: string;
  tone?: string;
  createdAt?: string;
};

export type HistoryItem = {
  id: string;
  type: 'reply' | 'bio' | 'opener' | 'analysis';
  content: string;
  createdAt?: string;
};

type AppState = {
  user: { id: string; email?: string | null; full_name?: string | null } | null;
  isPremium: boolean;
  activeTone: string;
  currentAnalysis: AnalysisResult | null;
  vault: VaultItem[];
  history: HistoryItem[];
  trendingToneExamples: Record<string, string>;
  setUser: (user: AppState['user']) => void;
  setPremium: (isPremium: boolean) => void;
  setActiveTone: (tone: string) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setTrendingToneExample: (tone: string, example: string) => void;
  addToVault: (item: VaultItem) => void;
  removeFromVault: (id: string) => void;
  addToHistory: (item: HistoryItem) => void;
  clearState: () => void;
};

const memoryStorage = {
  getItem: async (name: string) => null,
  setItem: async (_name: string, _value: string) => undefined,
  removeItem: async (_name: string) => undefined,
};

const storage = createJSONStorage(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return memoryStorage as Storage;
});

const initialState = {
  user: null,
  isPremium: false,
  activeTone: 'Witty',
  currentAnalysis: null,
  vault: [],
  history: [],
  trendingToneExamples: {},
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user }),
      setPremium: (isPremium) => set({ isPremium }),
      setActiveTone: (tone) => set({ activeTone: tone }),
      setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      setTrendingToneExample: (tone, example) =>
        set((state) => ({
          trendingToneExamples: { ...state.trendingToneExamples, [tone]: example },
        })),
      addToVault: (item) =>
        set((state) => ({
          vault: [item, ...state.vault.filter((existing) => existing.id !== item.id)],
        })),
      removeFromVault: (id) =>
        set((state) => ({
          vault: state.vault.filter((item) => item.id !== id),
        })),
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history.filter((existing) => existing.id !== item.id)],
        })),
      clearState: () => set(initialState),
    }),
    {
      name: 'aura-ai-store',
      storage,
      partialize: (state) => ({
        user: state.user,
        isPremium: state.isPremium,
        activeTone: state.activeTone,
        currentAnalysis: state.currentAnalysis,
        vault: state.vault,
        history: state.history,
        trendingToneExamples: state.trendingToneExamples,
      }),
    }
  )
);
