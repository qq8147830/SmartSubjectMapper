<template>
  <div class="profile-container">
    <el-container>
      <el-header class="header">
        <el-row justify="space-between" align="middle">
          <el-col>
            <h1>个人资料</h1>
          </el-col>
          <el-col>
            <el-button @click="resetForm" v-if="editing">
              <el-icon><refresh /></el-icon>
              重置
            </el-button>
            <el-button @click="toggleEdit" :type="editing ? 'success' : 'primary'">
              <el-icon v-if="!editing"><edit /></el-icon>
              <el-icon v-else><check /></el-icon>
              {{ editing ? '保存' : '编辑' }}
            </el-button>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <el-row :gutter="40">
          <el-col :span="8">
            <el-card class="profile-card">
              <div class="avatar-section">
                <div class="avatar-container">
                  <el-avatar 
                    :size="120" 
                    :src="userStore.user?.user_metadata?.avatar_url || defaultAvatar"
                    @click="triggerFileInput"
                    class="avatar"
                  />
                  <div class="avatar-overlay" v-if="editing">
                    <el-icon><camera /></el-icon>
                    <span>更换头像</span>
                  </div>
                </div>
                <input 
                  ref="fileInput" 
                  type="file" 
                  accept="image/*" 
                  @change="handleAvatarUpload"
                  style="display: none;"
                />
              </div>
              
              <div class="profile-info">
                <h2>{{ formData.display_name || '未设置姓名' }}</h2>
                <p class="email">{{ userStore.user?.email }}</p>
                <el-tag type="success" v-if="userStore.user?.email">
                  已验证邮箱
                </el-tag>
                <el-tag type="warning" v-else>
                  待验证邮箱
                </el-tag>
              </div>

              <div class="stats-section">
                <div class="stat-item">
                  <div class="stat-value">{{ totalAnalyses }}</div>
                  <div class="stat-label">总分析次数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ joinDays }}</div>
                  <div class="stat-label">使用天数</div>
                </div>
              </div>
            </el-card>

            <el-card class="settings-card" style="margin-top: 20px;">
              <template #header>
                <h3>快速设置</h3>
              </template>
              <div class="quick-settings">
                <div class="setting-item">
                  <span>邮件通知</span>
                  <el-switch 
                    v-model="settings.emailNotifications" 
                    @change="updateSettings"
                  />
                </div>
                <div class="setting-item">
                  <span>学习提醒</span>
                  <el-switch 
                    v-model="settings.studyReminders" 
                    @change="updateSettings"
                  />
                </div>
                <div class="setting-item">
                  <span>数据同步</span>
                  <el-switch 
                    v-model="settings.dataSync" 
                    @change="updateSettings"
                  />
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="16">
            <el-tabs v-model="activeTab" class="profile-tabs">
              <el-tab-pane label="基本信息" name="basic">
                <el-card>
                  <el-form 
                    ref="formRef" 
                    :model="formData" 
                    :rules="formRules" 
                    label-width="120px"
                    :disabled="!editing"
                  >
                    <el-form-item label="姓名" prop="display_name">
                      <el-input 
                        v-model="formData.display_name" 
                        placeholder="请输入姓名"
                      />
                    </el-form-item>
                    
                    <el-form-item label="手机号" prop="phone">
                      <el-input 
                        v-model="formData.phone" 
                        placeholder="请输入手机号"
                      />
                    </el-form-item>
                    
                    <el-form-item label="地区" prop="location">
                      <el-cascader
                        v-model="formData.location"
                        :options="regionOptions"
                        placeholder="请选择地区"
                        style="width: 100%;"
                      />
                    </el-form-item>
                    
                    <el-form-item label="孩子年龄段" prop="childAge">
                      <el-select 
                        v-model="formData.childAge" 
                        placeholder="请选择年龄段"
                        style="width: 100%;"
                      >
                        <el-option 
                          v-for="age in ageOptions" 
                          :key="age.value" 
                          :label="age.label" 
                          :value="age.value"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="教育背景" prop="education">
                      <el-select 
                        v-model="formData.education" 
                        placeholder="请选择教育背景"
                        style="width: 100%;"
                      >
                        <el-option 
                          v-for="edu in educationOptions" 
                          :key="edu.value" 
                          :label="edu.label" 
                          :value="edu.value"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="个人简介">
                      <el-input 
                        v-model="formData.bio" 
                        type="textarea" 
                        :rows="4" 
                        placeholder="简单介绍一下自己..."
                      />
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="账户安全" name="security">
                <el-card>
                  <div class="security-section">
                    <h3>密码修改</h3>
                    <el-form 
                      ref="passwordFormRef" 
                      :model="passwordForm" 
                      :rules="passwordRules" 
                      label-width="120px"
                    >
                      <el-form-item label="当前密码" prop="currentPassword">
                        <el-input 
                          v-model="passwordForm.currentPassword" 
                          type="password" 
                          placeholder="请输入当前密码"
                        />
                      </el-form-item>
                      
                      <el-form-item label="新密码" prop="newPassword">
                        <el-input 
                          v-model="passwordForm.newPassword" 
                          type="password" 
                          placeholder="请输入新密码"
                        />
                      </el-form-item>
                      
                      <el-form-item label="确认密码" prop="confirmPassword">
                        <el-input 
                          v-model="passwordForm.confirmPassword" 
                          type="password" 
                          placeholder="请再次输入新密码"
                        />
                      </el-form-item>
                      
                      <el-form-item>
                        <el-button type="primary" @click="changePassword">
                          修改密码
                        </el-button>
                      </el-form-item>
                    </el-form>
                  </div>

                  <el-divider />

                  <div class="security-section">
                    <h3>两步验证</h3>
                    <div class="two-factor-item">
                      <div class="two-factor-info">
                        <h4>短信验证</h4>
                        <p>通过手机短信接收验证码</p>
                      </div>
                      <el-switch v-model="settings.twoFactorSMS" @change="updateSettings" />
                    </div>
                    
                    <div class="two-factor-item">
                      <div class="two-factor-info">
                        <h4>邮箱验证</h4>
                        <p>通过邮箱接收验证码</p>
                      </div>
                      <el-switch v-model="settings.twoFactorEmail" @change="updateSettings" />
                    </div>
                  </div>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="偏好设置" name="preferences">
                <el-card>
                  <el-form label-width="140px">
                    <el-form-item label="语言偏好">
                      <el-select v-model="settings.language" @change="updateSettings">
                        <el-option label="简体中文" value="zh-CN" />
                        <el-option label="繁体中文" value="zh-TW" />
                        <el-option label="English" value="en-US" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="主题模式">
                      <el-radio-group v-model="settings.theme" @change="updateTheme">
                        <el-radio value="light">浅色模式</el-radio>
                        <el-radio value="dark">深色模式</el-radio>
                        <el-radio value="auto">跟随系统</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item label="分析报告频率">
                      <el-select v-model="settings.reportFrequency" @change="updateSettings">
                        <el-option label="每日" value="daily" />
                        <el-option label="每周" value="weekly" />
                        <el-option label="每月" value="monthly" />
                        <el-option label="从不" value="never" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="默认分析类型">
                      <el-select v-model="settings.defaultAnalysisType" @change="updateSettings">
                        <el-option label="文本分析" value="text" />
                        <el-option label="图片分析" value="image" />
                        <el-option label="语音分析" value="voice" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="自动保存历史">
                      <el-switch v-model="settings.autoSaveHistory" @change="updateSettings" />
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-tab-pane>

              <el-tab-pane label="数据管理" name="data">
                <el-card>
                  <div class="data-section">
                    <h3>数据导出</h3>
                    <p>导出您的所有学习数据和个人信息</p>
                    <el-button @click="exportData">
                      <el-icon><download /></el-icon>
                      导出数据
                    </el-button>
                  </div>

                  <el-divider />

                  <div class="data-section">
                    <h3>账户操作</h3>
                    <p>管理您的账户和关联服务</p>
                    <div class="account-actions">
                      <el-button @click="disconnectSocial('google')">
                        <el-icon><connection /></el-icon>
                        断开Google账户
                      </el-button>
                      <el-button @click="disconnectSocial('wechat')">
                        <el-icon><connection /></el-icon>
                        断开微信账户
                      </el-button>
                    </div>
                  </div>

                  <el-divider />

                  <div class="danger-section">
                    <h3>危险操作</h3>
                    <p class="danger-warning">以下操作不可逆，请谨慎操作</p>
                    <el-button 
                      type="danger" 
                      @click="showDeleteConfirm"
                    >
                      <el-icon><delete /></el-icon>
                      删除账户
                    </el-button>
                  </div>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <el-dialog 
      v-model="deleteDialogVisible" 
      title="确认删除账户" 
      width="500px"
    >
      <p>您确定要删除账户吗？此操作不可恢复。</p>
      <p>请输入您的密码以确认：</p>
      <el-input 
        v-model="deletePassword" 
        type="password" 
        placeholder="请输入密码"
        style="margin-top: 10px;"
      />
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteAccount">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { 
  Edit, 
  Check, 
  Refresh, 
  Camera, 
  Download, 
  Connection, 
  Delete 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useAnalysisStore } from '@/stores/analysis'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/utils/supabase'

const analysisStore = useAnalysisStore()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const fileInput = ref<HTMLInputElement>()

const editing = ref(false)
const activeTab = ref('basic')
const deleteDialogVisible = ref(false)
const deletePassword = ref('')

const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

const formData = reactive({
  display_name: '',
  phone: '',
  location: [] as any[],
  childAge: '',
  education: '',
  bio: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const settings = reactive({
  emailNotifications: true,
  studyReminders: true,
  dataSync: true,
  twoFactorSMS: false,
  twoFactorEmail: false,
  language: 'zh-CN',
  theme: 'light',
  reportFrequency: 'weekly',
  defaultAnalysisType: 'text',
  autoSaveHistory: true
})

const ageOptions = [
  { value: '0-3', label: '0-3岁' },
  { value: '4-6', label: '4-6岁' },
  { value: '7-9', label: '7-9岁' },
  { value: '10-12', label: '10-12岁' },
  { value: '13-15', label: '13-15岁' },
  { value: '16-18', label: '16-18岁' }
]

const educationOptions = [
  { value: 'high-school', label: '高中' },
  { value: 'college', label: '大学' },
  { value: 'bachelor', label: '学士' },
  { value: 'master', label: '硕士' },
  { value: 'doctor', label: '博士' }
]

const regionOptions = [
  {
    value: 'beijing',
    label: '北京',
    children: [
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'haidian', label: '海淀区' },
      { value: 'dongcheng', label: '东城区' }
    ]
  },
  {
    value: 'shanghai',
    label: '上海',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'xuhui', label: '徐汇区' },
      { value: 'putuo', label: '普陀区' }
    ]
  },
  {
    value: 'guangdong',
    label: '广东',
    children: [
      { value: 'guangzhou', label: '广州' },
      { value: 'shenzhen', label: '深圳' },
      { value: 'foshan', label: '佛山' }
    ]
  }
]

const formRules = {
  display_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const totalAnalyses = computed(() => analysisStore.analysisHistory.length)

const joinDays = computed(() => {
  if (!userStore.user?.created_at) return 0
  const created = new Date(userStore.user.created_at)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
})

const toggleEdit = async () => {
  if (editing.value) {
    await saveProfile()
  } else {
    editing.value = true
  }
}

const resetForm = () => {
  loadUserProfile()
  ElMessage.info('已重置表单')
}

const loadUserProfile = () => {
  const user = userStore.user
  if (user?.user_metadata) {
    formData.display_name = user.user_metadata.display_name || ''
    formData.phone = user.user_metadata.phone || ''
    formData.location = user.user_metadata.location || []
    formData.childAge = user.user_metadata.childAge || ''
    formData.education = user.user_metadata.education || ''
    formData.bio = user.user_metadata.bio || ''
  }
}

const saveProfile = async () => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: formData.display_name,
        phone: formData.phone,
        location: formData.location,
        childAge: formData.childAge,
        education: formData.education,
        bio: formData.bio
      }
    })

    if (error) {
      ElMessage.error('保存失败：' + error.message)
    } else {
      ElMessage.success('保存成功')
      editing.value = false
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const triggerFileInput = () => {
  if (editing.value) {
    fileInput.value?.click()
  }
}

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // 检查文件类型和大小
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userStore.user?.id}-${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (error) {
      ElMessage.error('上传失败：' + error.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl }
    })

    if (updateError) {
      ElMessage.error('更新头像失败：' + updateError.message)
    } else {
      ElMessage.success('头像更新成功')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

const updateSettings = () => {
  // 保存设置到本地存储或数据库
  localStorage.setItem('userSettings', JSON.stringify(settings))
  ElMessage.success('设置已保存')
}

const updateTheme = (_: string) => {
  updateSettings()
  // 这里可以添加主题切换逻辑
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    })

    if (error) {
      ElMessage.error('密码修改失败：' + error.message)
    } else {
      ElMessage.success('密码修改成功')
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  } catch (error) {
    ElMessage.error('密码修改失败')
  }
}

const exportData = () => {
  const data = {
    profile: formData,
    settings: settings,
    analysisHistory: analysisStore.analysisHistory,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('数据导出成功')
}

const disconnectSocial = (provider: string) => {
  ElMessage.info(`${provider}账户断开功能开发中...`)
}

const showDeleteConfirm = () => {
  deleteDialogVisible.value = true
}

const deleteAccount = async () => {
  if (!deletePassword.value) {
    ElMessage.error('请输入密码')
    return
  }

  try {
    // 这里需要实现账户删除逻辑
    ElMessage.warning('账户删除功能需要后端支持')
    deleteDialogVisible.value = false
  } catch (error) {
    ElMessage.error('账户删除失败')
  }
}

onMounted(async () => {
  await analysisStore.loadHistory()
  loadUserProfile()
  
  // 加载用户设置
  const savedSettings = localStorage.getItem('userSettings')
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings))
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: white;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.profile-card {
  text-align: center;
}

.avatar-section {
  margin-bottom: 20px;
}

.avatar-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.avatar {
  transition: opacity 0.3s;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.profile-info h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.profile-info .email {
  color: #606266;
  margin: 0 0 12px 0;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 0.8rem;
  color: #909399;
  margin-top: 4px;
}

.settings-card {
  margin-top: 20px;
}

.quick-settings {
  padding: 0 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.profile-tabs {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.security-section {
  padding: 20px 0;
}

.security-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.two-factor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.two-factor-item:last-child {
  border-bottom: none;
}

.two-factor-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
}

.two-factor-info p {
  margin: 0;
  color: #606266;
  font-size: 0.9rem;
}

.data-section {
  padding: 20px 0;
}

.data-section h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.data-section p {
  margin: 0 0 16px 0;
  color: #606266;
}

.account-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.danger-section {
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
}

.danger-section h3 {
  margin: 0 0 8px 0;
  color: #f56c6c;
}

.danger-warning {
  color: #f56c6c;
  margin: 0 0 16px 0;
  font-weight: bold;
}

@media (max-width: 768px) {
  .stats-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .account-actions {
    flex-direction: column;
  }
  
  .two-factor-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>