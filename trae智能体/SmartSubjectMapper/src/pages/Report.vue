<template>
  <div class="report-container">
    <el-container>
      <el-header class="header">
        <el-row justify="space-between" align="middle">
          <el-col>
            <h1>学习报告</h1>
          </el-col>
          <el-col>
            <el-button @click="generateReport" :loading="generating">
              <el-icon><document-add /></el-icon>
              生成报告
            </el-button>
            <el-button @click="exportReport" type="primary">
              <el-icon><download /></el-icon>
              导出报告
            </el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-row :gutter="40">
          <el-col :span="24">
            <el-card class="overview-card">
              <template #header>
                <h3>学习概况</h3>
              </template>
              <el-row :gutter="40">
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-value">{{ totalAnalyses }}</div>
                    <div class="metric-label">总分析次数</div>
                    <div class="metric-trend" :class="{ positive: analysisTrend > 0 }">
                      <el-icon v-if="analysisTrend > 0"><arrow-up /></el-icon>
                      <el-icon v-else-if="analysisTrend < 0"><arrow-down /></el-icon>
                      {{ Math.abs(analysisTrend) }}%
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-value">{{ uniqueSubjectsCount }}</div>
                    <div class="metric-label">涉及学科</div>
                    <div class="metric-trend positive">
                      <el-icon><trend-charts /></el-icon>
                      多元化学习
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-value">{{ avgAccuracy.toFixed(1) }}%</div>
                    <div class="metric-label">平均准确率</div>
                    <div class="metric-trend" :class="{ positive: accuracyTrend > 0 }">
                      <el-icon v-if="accuracyTrend > 0"><arrow-up /></el-icon>
                      <el-icon v-else-if="accuracyTrend < 0"><arrow-down /></el-icon>
                      {{ Math.abs(accuracyTrend) }}%
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="metric-card">
                    <div class="metric-value">{{ learningDays }}</div>
                    <div class="metric-label">学习天数</div>
                    <div class="metric-trend positive">
                      <el-icon><calendar /></el-icon>
                      持续学习
                    </div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="40" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <h3>学科掌握情况</h3>
              </template>
              <div ref="radarChart" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <h3>学习进度趋势</h3>
              </template>
              <div ref="lineChart" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="40" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <h3>学科分布饼图</h3>
              </template>
              <div ref="pieChart" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="subjects-card">
              <template #header>
                <h3>学科详细分析</h3>
              </template>
              <div class="subjects-list">
                <div 
                  v-for="subject in subjectAnalysis" 
                  :key="subject.name"
                  class="subject-item"
                >
                  <div class="subject-header">
                    <h4>{{ subject.name }}</h4>
                    <el-tag :type="getSubjectTagType(subject.masteryLevel)" size="small">
                      {{ subject.masteryLevel }}
                    </el-tag>
                  </div>
                  <div class="subject-progress">
                    <el-progress 
                      :percentage="subject.progress" 
                      :color="getProgressColor(subject.progress)"
                    />
                  </div>
                  <div class="subject-stats">
                    <span>分析次数: {{ subject.analysisCount }}</span>
                    <span>平均难度: {{ subject.avgDifficulty }}</span>
                    <span>最后学习: {{ formatDate(subject.lastStudied) }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="40" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card class="recommendations-card">
              <template #header>
                <h3>学习建议</h3>
              </template>
              <div class="recommendations">
                <div 
                  v-for="(recommendation, index) in recommendations" 
                  :key="index"
                  class="recommendation-item"
                >
                  <div class="recommendation-icon">
                    <el-icon><sunny /></el-icon>
                  </div>
                  <div class="recommendation-content">
                    <h4>{{ recommendation.title }}</h4>
                    <p>{{ recommendation.content }}</p>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  DocumentAdd, 
  Download, 
  ArrowUp, 
  ArrowDown, 
  TrendCharts, 
  Calendar, 
  Sunny 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAnalysisStore } from '@/stores/analysis'
import { createChart } from '@/utils/chartHelper'

const analysisStore = useAnalysisStore()

const radarChart = ref<HTMLElement>()
const lineChart = ref<HTMLElement>()
const pieChart = ref<HTMLElement>()
const generating = ref(false)

// 计算统计数据
const totalAnalyses = computed(() => analysisStore.analysisHistory.length)
const uniqueSubjectsCount = computed(() => {
  const subjects = new Set<string>()
  analysisStore.analysisHistory.forEach(record => {
    record.analysis.subjects.forEach(subject => {
      subjects.add(subject.name)
    })
  })
  return subjects.size
})

const avgAccuracy = computed(() => {
  if (analysisStore.analysisHistory.length === 0) return 0
  const totalAccuracy = analysisStore.analysisHistory.reduce((sum, record) => {
    return sum + record.analysis.difficulty.matchRate
  }, 0)
  return totalAccuracy / analysisStore.analysisHistory.length
})

const learningDays = computed(() => {
  if (analysisStore.analysisHistory.length === 0) return 0
  const dates = analysisStore.analysisHistory.map(record => 
    new Date(record.created_at).toDateString()
  )
  const uniqueDates = new Set(dates)
  return uniqueDates.size
})

const analysisTrend = computed(() => {
  // 简化趋势计算 - 基于最近7天和之前7天的对比
  const now = new Date()
  const recentCount = analysisStore.analysisHistory.filter(record => {
    const recordDate = new Date(record.created_at)
    const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  }).length

  const previousCount = analysisStore.analysisHistory.filter(record => {
    const recordDate = new Date(record.created_at)
    const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 7 && daysDiff <= 14
  }).length

  if (previousCount === 0) return recentCount > 0 ? 100 : 0
  return Math.round(((recentCount - previousCount) / previousCount) * 100)
})

const accuracyTrend = computed(() => {
  // 简化趋势计算
  return Math.round((Math.random() - 0.5) * 20) // 模拟数据
})

const subjectAnalysis = computed(() => {
  const subjectMap = new Map<string, any>()
  
  analysisStore.analysisHistory.forEach(record => {
    record.analysis.subjects.forEach(subject => {
      if (!subjectMap.has(subject.name)) {
        subjectMap.set(subject.name, {
          name: subject.name,
          analysisCount: 0,
          totalDifficulty: 0,
          lastStudied: record.created_at,
          progress: 0
        })
      }
      
      const subjectData = subjectMap.get(subject.name)
      subjectData.analysisCount++
      subjectData.totalDifficulty += record.analysis.difficulty.matchRate
      subjectData.lastStudied = new Date(record.created_at) > new Date(subjectData.lastStudied) 
        ? record.created_at 
        : subjectData.lastStudied
    })
  })

  return Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    avgDifficulty: (subject.totalDifficulty / subject.analysisCount).toFixed(1),
    progress: Math.min(subject.analysisCount * 10, 100), // 模拟进度
    masteryLevel: subject.analysisCount > 10 ? '精通' : 
                  subject.analysisCount > 5 ? '熟练' : 
                  subject.analysisCount > 2 ? '了解' : '入门'
  }))
})

const recommendations = computed(() => {
  const recommendations = []
  
  if (uniqueSubjectsCount.value < 3) {
    recommendations.push({
      title: '扩展学习领域',
      content: '您目前主要关注较少学科，建议尝试分析更多不同领域的学习内容，获得更全面的知识体系。'
    })
  }

  if (avgAccuracy.value < 80) {
    recommendations.push({
      title: '提升理解深度',
      content: '建议针对低准确率的学科进行深入学习，可以尝试寻找更多相关资料进行巩固。'
    })
  }

  if (analysisStore.analysisHistory.length > 0) {
    const recentActivity = analysisStore.analysisHistory.slice(0, 5)
    const hasRecentActivity = recentActivity.some(record => {
      const daysDiff = (new Date().getTime() - new Date(record.created_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 3
    })

    if (!hasRecentActivity) {
      recommendations.push({
        title: '保持学习节奏',
        content: '最近几天没有学习记录，建议保持定期的学习习惯，持续积累知识。'
      })
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: '继续保持',
      content: '您的学习状态很好！继续保持当前的学习节奏和方法。'
    })
  }

  return recommendations
})

const generateReport = async () => {
  generating.value = true
  try {
    // 模拟报告生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('报告生成成功！')
  } catch (error) {
    ElMessage.error('报告生成失败')
  } finally {
    generating.value = false
  }
}

const exportReport = () => {
  // 模拟导出功能
  ElMessage.info('导出功能开发中...')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getSubjectTagType = (level: string) => {
  switch (level) {
    case '精通': return 'success'
    case '熟练': return 'primary'
    case '了解': return 'warning'
    default: return 'info'
  }
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  if (progress >= 40) return '#f56c6c'
  return '#909399'
}

const updateCharts = () => {
  if (!radarChart.value || !lineChart.value || !pieChart.value) return

  // 雷达图 - 学科掌握情况
  const radarData = subjectAnalysis.value.map(subject => ({
    name: subject.name,
    value: subject.progress
  }))

  createChart(radarChart.value, {
    title: '学科掌握情况',
    type: 'radar',
    data: radarData
  })

  // 折线图 - 学习进度趋势
  const lineData = analysisStore.analysisHistory.slice(-30).map((record, index) => ({
    name: `第${index + 1}次`,
    value: record.analysis.difficulty.matchRate
  }))

  createChart(lineChart.value, {
    title: '学习进度趋势',
    type: 'line',
    data: lineData
  })

  // 饼图 - 学科分布
  const subjectCounts = subjectAnalysis.value.reduce((acc, subject) => {
    acc[subject.name] = subject.analysisCount
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(subjectCounts).map(([name, value]) => ({
    name,
    value
  }))

  createChart(pieChart.value, {
    title: '学科分布',
    type: 'pie',
    data: pieData
  })
}

onMounted(async () => {
  await analysisStore.loadHistory()
  updateCharts()
})

watch(() => analysisStore.analysisHistory, updateCharts, { deep: true })
</script>

<style scoped>
.report-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: white;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.main-content {
  padding: 20px;
}

.overview-card {
  margin-bottom: 20px;
}

.metric-card {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 12px;
}

.metric-trend {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.metric-trend.positive {
  color: #67c23a;
}

.metric-trend:not(.positive) {
  color: #f56c6c;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.subjects-card {
  height: 400px;
}

.subjects-list {
  max-height: 320px;
  overflow-y: auto;
}

.subject-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.subject-item:last-child {
  border-bottom: none;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.subject-header h4 {
  margin: 0;
  color: #303133;
}

.subject-progress {
  margin-bottom: 8px;
}

.subject-stats {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
  color: #909399;
}

.recommendations-card {
  margin-top: 20px;
}

.recommendations {
  max-height: 300px;
  overflow-y: auto;
}

.recommendation-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recommendation-item:last-child {
  border-bottom: none;
}

.recommendation-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background-color: #ecf5ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.recommendation-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.recommendation-content p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .chart-card,
  .subjects-card {
    margin-bottom: 20px;
  }
  
  .metric-card {
    margin-bottom: 16px;
  }
  
  .subject-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>