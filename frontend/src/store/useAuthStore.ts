import { create } from 'zustand'

interface AuthState {
  user: string | null;
  setUser: (user: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))