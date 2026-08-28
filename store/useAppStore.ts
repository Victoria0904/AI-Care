import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 当前用户在 App 内的角色（黑客松简化版：单账号切换，不持久到服务端）
// 详见 PRD.md §5.2 简化策略
export type Role = 'patient' | 'family' | null;

interface AppState {
  role: Role;
  currentConsultationId: string | null;
  setRole: (role: Role) => void;
  setCurrentConsultationId: (id: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      role: null,
      currentConsultationId: null,
      setRole: (role) => set({ role }),
      setCurrentConsultationId: (id) => set({ currentConsultationId: id }),
      reset: () => set({ role: null, currentConsultationId: null }),
    }),
    {
      name: 'ai-companion-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
