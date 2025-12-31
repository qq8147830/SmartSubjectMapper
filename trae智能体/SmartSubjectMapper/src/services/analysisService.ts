import axios from 'axios'
import type { AnalysisResult } from '@/types'

const API_URL = `${import.meta.env.VITE_AI_BASE_URL}/chat/completions`

export const analysisService = {
  async analyzeContent(content: string): Promise<AnalysisResult> {
    const prompt = `你是一位资深教育专家，请分析以下学习内容：${content}
    
请按照以下JSON格式输出，不要包含任何其他内容：
{
  "subjects": [
    {
      "name": "数学",
      "grade": "5年级", 
      "difficulty": "中等"
    }
  ],
  "difficulty": {
    "level": "中等偏上",
    "matchRate": 85
  },
  "advancedPoints": [
    {
      "content": "几何概念理解",
      "usualGrade": "6年级"
    }
  ],
  "suggestions": [
    "鼓励孩子的科学兴趣，可以适当加深"
  ]
}`

    try {
      const response = await axios.post(API_URL, {
        model: import.meta.env.VITE_AI_MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      const resultText = response.data.choices[0].message.content
      const result = JSON.parse(resultText)
      
      if (!result.subjects || !result.difficulty || !result.advancedPoints || !result.suggestions) {
        throw new Error('返回数据格式不正确')
      }
      
      return result
    } catch (error) {
      console.error('分析内容失败:', error)
      throw new Error('分析失败，请稍后重试')
    }
  }
}