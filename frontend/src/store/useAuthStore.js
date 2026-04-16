import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,

  setUser: (user) =>
    set({
      user,
      role: user?.user_metadata?.role ?? null,
      loading: false,
    }),

  clearUser: () =>
    set({ user: null, role: null, loading: false }),

  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('signOut error:', err)
    }
    set({ user: null, role: null, loading: false })
  },
}))
