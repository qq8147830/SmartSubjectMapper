<template>
  <div class="dashboard-container">
    <el-container>
      <el-header class="header">
        <el-row justify="space-between" align="middle">
          <el-col>
            <h1>学习仪表板</h1>
          </el-col>
          <el-col>
            <el-dropdown>
              <el-button type="primary">
                {{ userStore.userName }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/profile')">个人资料</el-dropdown-item>
                  <el-dropdown-item @click="$router.push('/report')">学习报告</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-row :gutter="40">
          <el-col :span="16">
            <el-card class="chart-card">
              <template #header>
                <h3>学科分布雷达图</h3>
              </template>
              <div ref="radarChart" class="chart-container"></div>
            </el-card>

            <el-card class="history-card" style="margin-top: 20px;">
              <template #header>
                <h3>最近分析记录</h3>
              </template>
              <el-timeline>
                <el-timeline-item 
                  v-for="record in recentRecords" 
                  :key="record.id"
                  :timestamp="formatDate(record.created_at)"
                >
                  <div class="record-content">
                    <p class="content-preview">{{ record.content.substring(0, 100) }}...</p>
                    <div class="subjects">
                      <el-tag 
                        v-for="subject in record.analysis.subjects" 
                        :key="subject.name"
                        size="small"
                      >
                        {{ subject.name }}
                      </el-tag>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card">
              <template #header>
                <h3>学习统计</h3>
              </template>
              <div class="stats">
                <div class="stat-item">
                  <div class="stat-value">{{ analysisStore.totalAnalyses }}</div>
                  <div class="stat-label">总分析次数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ uniqueSubjects.length }}</div>
                  <div class="stat-label">涉及学科</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ avgDifficulty.toFixed(1) }}</div>
                  <div class="stat-label">平均难度</div>
                </div>
              </div>
            </el-card>

            <el-card class="quick-actions" style="margin-top: 20px;">
              <template #header>
                <h3>快捷操作</h3>
              </template>
              <div class="actions">
                <el-button type="primary" @click="$router.push('/analysis')" block>
                  新建分析
                </el-button>
                <el-button @click="$router.push('/report')" block>
                  查看报告
                </el-button>
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
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAnalysisStore } from '@/stores/analysis'
import { useUserStore } from '@/stores/user'
import { createChart } from '@/utils/chartHelper'

const router = useRouter()
const analysisStore = useAnalysisStore()
const userStore = useUserStore()

const radarChart = ref<HTMLElement>()

const recentRecords = computed(() => analysisStore.analysisHistory.slice(0, 5))

const uniqueSubjects = computed(() => {
  const subjects = new Set<string>()
  analysisStore.analysisHistory.forEach(record => {
    record.analysis.subjects.forEach(subject => {
      subjects.add(subject.name)
    })
  })
  return Array.from(subjects)
})

const avgDifficulty = computed(() => {
  if (analysisStore.analysisHistory.length === 0) return 0
  const totalRate = analysisStore.analysisHistory.reduce((sum, record) => {
    return sum + record.analysis.difficulty.matchRate
  }, 0)
  return totalRate / analysisStore.analysisHistory.length
})

const handleLogout = async () => {
  try {
    await userStore.signOut()
    router.push('/')
    ElMessage.success('已退出登录')
  } catch (error) {
    ElMessage.error('退出失败')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const updateChart = () => {
  if (!radarChart.value) return

  const subjectCounts = uniqueSubjects.value.map(subject => {
    const count = analysisStore.analysisHistory.reduce((sum, record) => {
      return sum + record.analysis.subjects.filter(s => s.name === subject).length
    }, 0)
    return { name: subject, value: count }
  })

  createChart(radarChart.value, {
    title: '学科分析分布',
    type: 'radar',
    data: subjectCounts
  })
}

onMounted(async () => {
  await analysisStore.loadHistory()
  updateChart()
})

watch(() => analysisStore.analysisHistory, updateChart, { deep: true })
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-card,
.stats-card,
.history-card,
.quick-actions {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 5px;
}

.record-content {
  color: white;
}

.content-preview {
  margin-bottom: 10px;
  font-style: italic;
}

.subjects {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>