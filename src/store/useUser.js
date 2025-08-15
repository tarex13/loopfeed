// stores/useUser.js
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useUser = create((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    set({ loading: true })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    set({ user, error, loading: false })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
