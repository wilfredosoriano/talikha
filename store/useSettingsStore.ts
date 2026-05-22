import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'auto' | 'english' | 'filipino';
export type AppPlan = 'free' | 'monthly' | 'lifetime';

export const FREE_CAPTURE_LIMIT = 10;

interface SettingsStore {
  nickname: string;
  avatar: string;
  language: AppLanguage;
  plan: AppPlan;
  onboardingComplete: boolean;
  setNickname: (name: string) => void;
  setAvatar: (emoji: string) => void;
  setLanguage: (lang: AppLanguage) => void;
  setPlan: (plan: AppPlan) => void;
  setOnboardingComplete: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      nickname: '',
      avatar: '',
      language: 'auto',
      plan: 'free',
      onboardingComplete: false,
      setNickname: (nickname) => set({ nickname }),
      setAvatar: (avatar) => set({ avatar }),
      setLanguage: (language) => set({ language }),
      setPlan: (plan) => set({ plan }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
    }),
    {
      name: 'capture-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
