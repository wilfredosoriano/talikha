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
  capturesCreatedThisMonth: number;
  captureCountMonth: string; // 'YYYY-MM'
  digestEnabled: boolean;
  digestHour: number;
  digestMinute: number;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setNickname: (name: string) => void;
  setAvatar: (emoji: string) => void;
  setLanguage: (lang: AppLanguage) => void;
  setPlan: (plan: AppPlan) => void;
  setOnboardingComplete: () => void;
  incrementMonthlyCaptures: () => void;
  setDigestEnabled: (enabled: boolean) => void;
  setDigestTime: (hour: number, minute: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      nickname: '',
      avatar: '',
      language: 'english',
      plan: 'free',
      onboardingComplete: false,
      capturesCreatedThisMonth: 0,
      captureCountMonth: '',
      digestEnabled: false,
      digestHour: 7,
      digestMinute: 0,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setNickname: (nickname) => set({ nickname }),
      setAvatar: (avatar) => set({ avatar }),
      setLanguage: (language) => set({ language }),
      setPlan: (plan) => set({ plan }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
      setDigestEnabled: (digestEnabled) => set({ digestEnabled }),
      setDigestTime: (digestHour, digestMinute) => set({ digestHour, digestMinute }),
      incrementMonthlyCaptures: () =>
        set((state) => {
          const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
          if (state.captureCountMonth !== currentMonth) {
            // New month — reset counter
            return { capturesCreatedThisMonth: 1, captureCountMonth: currentMonth };
          }
          return { capturesCreatedThisMonth: state.capturesCreatedThisMonth + 1 };
        }),
    }),
    {
      name: 'capture-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // Exclude _hasHydrated from persistence — it's a runtime flag, not saved data
      partialize: (state) => ({
        nickname: state.nickname,
        avatar: state.avatar,
        language: state.language,
        plan: state.plan,
        onboardingComplete: state.onboardingComplete,
        capturesCreatedThisMonth: state.capturesCreatedThisMonth,
        captureCountMonth: state.captureCountMonth,
        digestEnabled: state.digestEnabled,
        digestHour: state.digestHour,
        digestMinute: state.digestMinute,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Set hydrated even on error so the app never hangs on splash
        if (error) {
          useSettingsStore.setState({ _hasHydrated: true });
        } else {
          state?.setHasHydrated(true);
        }
      },
    }
  )
);
