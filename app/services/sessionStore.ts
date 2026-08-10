import { create } from 'zustand';

interface SessionState {
  user: any | null;
  isDecoy: boolean;
  isSigningUp: boolean;
  setSession: (user: any, isDecoy: boolean) => void;
  clearSession: () => void;
  setIsSigningUp: (isSigningUp: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isDecoy: false,
  isSigningUp: false,
  setSession: (user, isDecoy) => set({ user, isDecoy }),
  clearSession: () => set({ user: null, isDecoy: false }),
  setIsSigningUp: (isSigningUp) => set({ isSigningUp }),
}));
