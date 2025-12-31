<template>
  <div class="home-container">
    <el-row justify="center" class="hero-section">
      <el-col :span="20">
        <div class="hero-content">
          <h1 class="hero-title">智能学科定位器</h1>
          <p class="hero-subtitle">
            AI驱动的学习内容分析，为K12家长提供科学的学科指导
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/analysis')">
              开始分析
            </el-button>
            <el-button size="large" @click="showLoginDialog = true">
              登录/注册
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row justify="center" class="features-section">
      <el-col :span="20">
        <h2 class="section-title">核心功能</h2>
        <el-row :gutter="40">
          <el-col :span="6" v-for="feature in features" :key="feature.title">
            <el-card class="feature-card" shadow="hover">
              <div class="feature-icon">{{ feature.icon }}</div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <el-dialog v-model="showLoginDialog" title="用户登录" width="400px">
      <el-form :model="loginForm" @submit.prevent="handleLogin">
        <el-form-item label="邮箱">
          <el-input v-model="loginForm.email" type="email" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" />
        </el-form-item>
        <el-form-item v-if="showRegister" label="姓名">
          <el-input v-model="loginForm.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLoginDialog = false">取消</el-button>
        <el-button type="primary" @click="handleLogin" :loading="userStore.loading">
          {{ showRegister ? '注册' : '登录' }}
        </el-button>
        <el-button text @click="showRegister = !showRegister">
          {{ showRegister ? '已有账号？登录' : '没有账号？注册' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const showLoginDialog = ref(false)
const showRegister = ref(false)
const loginForm = ref({
  email: '',
  password: '',
  name: ''
})

const features = [
  {
    icon: '🧠',
    title: '智能内容分析',
    description: 'AI分析学习内容，精准识别学科、年级和难度等级'
  },
  {
    icon: '📊',
    title: '可视化图表',
    description: '雷达图、进度图等多维度展示学习情况'
  },
  {
    icon: '📚',
    title: '学习路径规划',
    description: '个性化推荐学习路径和进阶建议'
  },
  {
    icon: '📈',
    title: '学习档案管理',
    description: '完整记录学习历程，追踪进步轨迹'
  }
]

const handleLogin = async () => {
  try {
    if (showRegister.value) {
      await userStore.signUp(loginForm.value.email, loginForm.value.password, loginForm.value.name)
      ElMessage.success('注册成功！')
    } else {
      await userStore.signIn(loginForm.value.email, loginForm.value.password)
      ElMessage.success('登录成功！')
    }
    showLoginDialog.value = false
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-section {
  padding: 80px 0;
  text-align: center;
}

.hero-content {
  padding: 40px 0;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.features-section {
  padding: 60px 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  height: 100%;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: white;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.8);
}
</style>