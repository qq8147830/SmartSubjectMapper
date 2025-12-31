import { defineStore } from 'pinia'
import type { AnalysisResult, LearningRecord } from '@/types'
import { analysisService } from '@/services/analysisService'
import { supabase } from '@/utils/supabase'
import { useUserStore } from './user'

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    currentAnalysis: null as AnalysisResult | null,
    analysisHistory: [] as LearningRecord[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    hasHistory: (state) => state.analysisHistory.length > 0,
    totalAnalyses: (state) => state.analysisHistory.length
  },

  actions: {
    async analyzeContent(content: string) {
      this.loading = true
      this.error = null
      
      try {
        const result = await analysisService.analyzeContent(content)
        this.currentAnalysis = result
        
        const userStore = useUserStore()
        if (userStore.isAuthenticated && userStore.user) {
          await this.saveAnalysis(content, result)
          await this.loadHistory()
        }
        
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : '分析失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async saveAnalysis(content: string, analysis: AnalysisResult) {
      const userStore = useUserStore()
      if (!userStore.user) return

      const { error } = await supabase
        .from('learning_records')
        .insert({
          user_id: userStore.user.id,
          content,
          analysis
        })

      if (error) {
        console.error('保存分析记录失败:', error)
      }
    },

    async loadHistory() {
      const userStore = useUserStore()
      if (!userStore.user) return

      const { data, error } = await supabase
        .from('learning_records')
        .select('*')
        .eq('user_id', userStore.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('加载历史记录失败:', error)
      } else {
        this.analysisHistory = data || []
      }
    }
  }
})