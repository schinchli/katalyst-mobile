import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RateResult = { ok: true } | { ok: false; reason: 'daily_limit' };

interface RateLimitState {
  dayKey: string;     // e.g., 2026-03-10
  dayCount: number;
  hourKey: string;    // e.g., 2026-03-10T14
  hourCount: number;
  maxPerDay: number;
  maxPerHour: number;
  checkAndConsume: () => RateResult;
  reset: () => void;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function hourKey() {
  const d = new Date();
  return `${d.toISOString().slice(0, 13)}`; // YYYY-MM-DDTHH
}

export const useRateLimitStore = create<RateLimitState>()(
  persist(
    (set, get) => ({
      dayKey: todayKey(),
      dayCount: 0,
      hourKey: hourKey(),
      hourCount: 0,
      maxPerDay: 5,
      maxPerHour: 10,

      checkAndConsume: () => {
        // TODO(go-live): remove this bypass and uncomment the limit block below
        return { ok: true };

        /* --- enable for production ---
        const state = get();
        const nowDay = todayKey();
        const nowHour = hourKey();
        let { dayCount, hourCount } = state;

        if (state.dayKey !== nowDay) dayCount = 0;
        if (state.hourKey !== nowHour) hourCount = 0;

        if (dayCount >= state.maxPerDay || hourCount >= state.maxPerHour) {
          return { ok: false, reason: 'daily_limit' };
        }

        set({ dayKey: nowDay, hourKey: nowHour, dayCount: dayCount + 1, hourCount: hourCount + 1 });
        return { ok: true };
        --- end production block --- */
      },

      reset: () => set({
        dayKey: todayKey(),
        hourKey: hourKey(),
        dayCount: 0,
        hourCount: 0,
      }),
    }),
    {
      name: 'rate-limit-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
