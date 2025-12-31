export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  created_at: string
  user_metadata?: {
    display_name?: string
    phone?: string
    location?: any[]
    childAge?: string
    education?: string
    bio?: string
    avatar_url?: string
  }
}

export interface SubjectResult {
  name: string
  grade: string
  difficulty: string
}

export interface Difficulty {
  level: string
  matchRate: number
}

export interface AdvancedPoint {
  content: string
  usualGrade: string
}

export interface AnalysisResult {
  subjects: SubjectResult[]
  difficulty: Difficulty
  advancedPoints: AdvancedPoint[]
  suggestions: string[]
}

export interface LearningRecord {
  id: string
  user_id: string
  content: string
  analysis: AnalysisResult
  created_at: string
}

export interface LearningPath {
  id: string
  name: string
  subjects: string[]
  grade: string
  difficulty: string
  estimatedHours: number
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  title: string
  description: string
  completed: boolean
  completedAt?: string
}