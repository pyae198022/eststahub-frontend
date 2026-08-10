import { create } from 'zustand'

const TOKEN_KEY = 'estatehub-token'

interface AuthState {
  token: string | null
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }

    set({ token })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }

    set({ token: null })
  },
}))
