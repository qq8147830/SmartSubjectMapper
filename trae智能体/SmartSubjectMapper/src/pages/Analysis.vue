<template>
  <div class="analysis-container">
    <el-container>
      <el-header class="header">
        <el-row justify="space-between" align="middle">
          <el-col>
            <h1>内容分析</h1>
          </el-col>
          <el-col>
            <el-button @click="$router.push('/')">返回首页</el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-row :gutter="40">
          <el-col :span="12">
            <el-card class="input-card">
              <template #header>
                <h2>输入学习内容</h2>
              </template>
              
              <el-form>
                <el-form-item label="学习内容">
                  <el-input
                    v-model="content"
                    type="textarea"
                    :rows="10"
                    placeholder="请输入您想要分析的学习内容，如题目、知识点、学习材料等..."
                    maxlength="2000"
                    show-word-limit
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="handleAnalyze" 
                    :loading="analysisStore.loading"
                    :disabled="!content.trim()"
                    size="large"
                  >
                    开始分析
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card v-if="analysisStore.currentAnalysis" class="result-card">
              <template #header>
                <h2>分析结果</h2>
              </template>

              <div class="analysis-result">
                <el-divider content-position="left">学科识别</el-divider>
                <div class="subjects">
                  <el-tag 
                    v-for="subject in analysisStore.currentAnalysis.subjects" 
                    :key="subject.name"
                    type="primary"
                    size="large"
                    class="subject-tag"
                  >
                    {{ subject.name }} · {{ subject.grade }}
                  </el-tag>
                </div>

                <el-divider content-position="left">难度评估</el-divider>
                <div class="difficulty">
                  <el-progress 
                    :percentage="analysisStore.currentAnalysis.difficulty.matchRate" 
                    :stroke-width="20"
                    :text-inside="true"
                  />
                  <p class="difficulty-label">{{ analysisStore.currentAnalysis.difficulty.level }}</p>
                </div>

                <el-divider content-position="left">进阶要点</el-divider>
                <div class="advanced-points">
                  <el-tag 
                    v-for="point in analysisStore.currentAnalysis.advancedPoints" 
                    :key="point.content"
                    type="warning"
                    class="point-tag"
                  >
                    {{ point.content }} ({{ point.usualGrade }})
                  </el-tag>
                </div>

                <el-divider content-position="left">学习建议</el-divider>
                <div class="suggestions">
                  <ul>
                    <li v-for="suggestion in analysisStore.currentAnalysis.suggestions" :key="suggestion">
                      {{ suggestion }}
                    </li>
                  </ul>
                </div>

                <div class="actions">
                  <el-button type="primary" @click="$router.push('/dashboard')">
                    查看学习仪表板
                  </el-button>
                </div>
              </div>
            </el-card>

            <el-empty v-else description="请输入内容开始分析" />
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'
import { ElMessage } from 'element-plus'

const analysisStore = useAnalysisStore()

const content = ref('')

const handleAnalyze = async () => {
  try {
    await analysisStore.analyzeContent(content.value)
    ElMessage.success('分析完成！')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分析失败')
  }
}
</script>

<style scoped>
.analysis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.input-card,
.result-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  margin-bottom: 20px;
}

.analysis-result {
  padding: 20px 0;
}

.subjects {
  margin-bottom: 20px;
}

.subject-tag {
  margin: 5px;
  font-size: 14px;
}

.difficulty {
  text-align: center;
  margin-bottom: 20px;
}

.difficulty-label {
  margin-top: 10px;
  font-weight: bold;
}

.advanced-points {
  margin-bottom: 20px;
}

.point-tag {
  margin: 5px;
  font-size: 12px;
}

.suggestions ul {
  padding-left: 20px;
}

.suggestions li {
  margin-bottom: 8px;
}

.actions {
  text-align: center;
  margin-top: 30px;
}
</style>