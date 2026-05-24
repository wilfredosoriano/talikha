import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'english' | 'filipino';
export type AppPlan = 'free' | 'monthly' | 'lifetime';

export const FREE_CAPTURE_LIMIT = 10;

interface SettingsStore {
  nickname: string;
  avatar: string;
  language: AppLanguage;
  plan: AppPlan;
  onboardingComplete: boolean;
  totalCapturesCreated: number;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setNickname: (name: string) => void;
  setAvatar: (emoji: string) => void;
  setLanguage: (lang: AppLanguage) => void;
  setPlan: (plan: AppPlan) => void;
  setOnboardingComplete: () => void;
  incrementTotalCapturesCreated: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      nickname: '',
      avatar: '',
      language: 'english',
      plan: 'free',
      onboardingComplete: false,
      totalCapturesCreated: 0,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setNickname: (nickname) => set({ nickname }),
      setAvatar: (avatar) => set({ avatar }),
      setLanguage: (language) => set({ language }),
      setPlan: (plan) => set({ plan }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
      incrementTotalCapturesCreated: () =>
        set((state) => ({ totalCapturesCreated: state.totalCapturesCreated + 1 })),
    }),
    {
      name: 'capture-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
