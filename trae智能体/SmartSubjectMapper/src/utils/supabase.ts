import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量。请检查.env文件中的VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'SmartSubjectMapper'
    }
  }
})

// 辅助函数：检查用户是否已认证
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// 辅助函数：获取当前用户
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// 辅助函数：处理认证错误
export const handleAuthError = (error: any) => {
  console.error('Supabase认证错误:', error)
  
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': '邮箱或密码错误',
    'Email not confirmed': '请先验证您的邮箱',
    'User already registered': '该邮箱已被注册',
    'Password should be at least 6 characters': '密码长度不能少于6位',
    'Signup is disabled': '注册功能已禁用',
    'Email rate limit exceeded': '邮箱验证次数过多，请稍后再试',
    'Network request failed': '网络请求失败，请检查网络连接'
  }
  
  const message = errorMessages[error.message] || error.message || '认证失败'
  return message
}

// 数据库操作辅助函数
export const db = {
  // 学习记录操作
  learningRecords: {
    async getByUserId(userId: string, limit = 50) {
      const { data, error } = await supabase
        .from('learning_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    },

    async create(record: {
      user_id: string
      content: string
      content_type?: string
      analysis: any
    }) {
      const { data, error } = await supabase
        .from('learning_records')
        .insert(record)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('learning_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('learning_records')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // 用户设置操作
  userSettings: {
    async getByUserId(userId: string) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return data
    },

    async upsert(settings: {
      user_id: string
      [key: string]: any
    }) {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert(settings, { onConflict: 'user_id' })
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // 学科映射操作
  subjectMappings: {
    async getAll() {
      const { data, error } = await supabase
        .from('subject_mappings')
        .select('*')
        .order('category', { ascending: true })
      
      if (error) throw error
      return data
    },

    async getByCategory(category: string) {
      const { data, error } = await supabase
        .from('subject_mappings')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    }
  },

  // 用户学科偏好操作
  userSubjectPreferences: {
    async getByUserId(userId: string) {
      const { data, error } = await supabase
        .from('user_subject_preferences')
        .select(`
          *,
          subject_mappings (*)
        `)
        .eq('user_id', userId)
      
      if (error) throw error
      return data
    },

    async upsert(preference: {
      user_id: string
      subject_mapping_id: string
      proficiency_level?: string
      interest_level?: number
      study_frequency?: string
    }) {
      const { data, error } = await supabase
        .from('user_subject_preferences')
        .upsert(preference, { onConflict: 'user_id,subject_mapping_id' })
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // 学习报告操作
  learningReports: {
    async getByUserId(userId: string, limit = 10) {
      const { data, error } = await supabase
        .from('learning_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    },

    async create(report: {
      user_id: string
      report_type: string
      data: any
      period_start?: string
      period_end?: string
    }) {
      const { data, error } = await supabase
        .from('learning_reports')
        .insert(report)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // 分析缓存操作
  analysisCache: {
    async getByHash(contentHash: string) {
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('*')
        .eq('content_hash', contentHash)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async create(cache: {
      content_hash: string
      content_type: string
      analysis_result: any
      expires_at: string
    }) {
      const { data, error } = await supabase
        .from('analysis_cache')
        .insert(cache)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  }
}