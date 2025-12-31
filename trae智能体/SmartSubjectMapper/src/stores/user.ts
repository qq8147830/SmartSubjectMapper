import { defineStore } from 'pinia'
import type { User } from '@/types'
import { supabase } from '@/utils/supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    userName: (state) => state.user?.user_metadata?.display_name || state.user?.name || '用户',
    userEmail: (state) => state.user?.email || ''
  },

  actions: {
    async initAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        this.user = session.user as User
        this.isAuthenticated = true
      }
    },

    async signUp(email: string, password: string, name: string) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        })

        if (error) throw error
        return data
      } finally {
        this.loading = false
      }
    },

    async signIn(email: string, password: string) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        if (data.user) {
          this.user = data.user as User
          this.isAuthenticated = true
        }
        return data
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      this.isAuthenticated = false
    }
  }
})