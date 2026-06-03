import { create } from 'zustand';

interface SessionState {
  user: any | null;
  isDecoy: boolean;
  setSession: (user: any, isDecoy: boolean) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isDecoy: false,
  setSession: (user, isDecoy) => set({ user, isDecoy }),
  clearSession: () => set({ user: null, isDecoy: false }),
}));
