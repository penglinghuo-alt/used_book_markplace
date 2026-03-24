<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  bio: '',
  wechat_id: '',
  phone: ''
})

const avatarFile = ref(null)
const avatarPreview = ref('')
const loading = ref(false)
const uploading = ref(false)
const success = ref(false)

const displayAvatar = computed(() => {
  if (avatarPreview.value) return avatarPreview.value
  if (userStore.user?.avatar_url) return userStore.user.avatar_url
  return ''
})

onMounted(() => {
  if (userStore.user) {
    form.value = {
      username: userStore.user.username || '',
      bio: userStore.user.bio || '',
      wechat_id: userStore.user.wechat_id || '',
      phone: userStore.user.phone || ''
    }
  }
})

function handleAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }
  
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function uploadAvatar() {
  if (!avatarFile.value) return
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', avatarFile.value)
    
    const res = await userApi.uploadAvatar(formData)
    
    avatarFile.value = null
    avatarPreview.value = ''
    
    await userStore.fetchProfile()
  } catch (error) {
    console.error('上传头像失败:', error)
    alert(error.response?.data?.message || '上传头像失败，请重试')
  } finally {
    uploading.value = false
  }
}

async function handleBindPhone() {
  if (!form.value.phone) {
    alert('请输入手机号')
    return
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(form.value.phone)) {
    alert('手机号格式不正确')
    return
  }
  
  try {
    await userApi.bindPhone(form.value.phone)
    await userStore.fetchProfile()
    alert('手机号绑定成功')
  } catch (e) {
    alert(e.message || '绑定失败')
  }
}

async function handleSubmit() {
  loading.value = true
  success.value = false

  try {
    if (avatarFile.value) {
      await uploadAvatar()
    }
    
    await userStore.updateProfile({
      username: form.value.username.trim(),
      bio: form.value.bio.trim(),
      wechat_id: form.value.wechat_id.trim()
    })
    
    if (form.value.phone && !userStore.user?.phone) {
      await handleBindPhone()
    }
    
    success.value = true
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    console.error('更新失败:', error)
    alert(error.response?.data?.message || '更新失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="edit-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">编辑资料</h1>
        <button class="save-btn" @click="handleSubmit" :disabled="loading || uploading">
          {{ loading ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="edit-content">
      <div class="container">
        <div class="avatar-section">
          <div class="avatar-preview">
            <img v-if="displayAvatar" :src="displayAvatar" alt="头像" class="avatar-img" />
            <span v-else>{{ form.username?.charAt(0).toUpperCase() || '?' }}</span>
          </div>
          <label class="avatar-upload-btn">
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/gif,image/webp"
              @change="handleAvatarChange"
              hidden
            />
            {{ uploading ? '上传中...' : '更换头像' }}
          </label>
          <p class="avatar-tip">支持 JPG、PNG、GIF、WebP 格式，最大 2MB</p>
        </div>

        <form @submit.prevent="handleSubmit" class="edit-form">
          <div v-if="success" class="success-alert">
            <span>✅</span>
            保存成功！
          </div>

          <div class="form-group">
            <label class="form-label">用户名</label>
            <input 
              v-model="form.username"
              type="text" 
              class="form-input"
              placeholder="请输入新用户名"
            />
            <span class="form-hint">用户名长度 3-30 个字符，可包含字母、数字和下划线</span>
          </div>

          <div class="form-group">
            <label class="form-label">个性签名</label>
            <textarea 
              v-model="form.bio"
              class="form-textarea"
              placeholder="介绍一下自己..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">
              微信号
              <span class="required">*</span>
            </label>
            <input 
              v-model="form.wechat_id"
              type="text" 
              class="form-input"
              placeholder="请输入您的微信号"
            />
            <span class="form-hint">设置微信号方便买家联系你</span>
          </div>

          <div class="form-group">
            <label class="form-label">
              手机号
              <span class="optional" v-if="!form.phone">（用于找回密码）</span>
              <span class="bound-tag" v-else>已绑定</span>
            </label>
            <input 
              v-if="!form.phone"
              v-model="form.phone"
              type="tel" 
              class="form-input"
              placeholder="请输入手机号"
              maxlength="11"
            />
            <div v-else class="phone-bound">
              <span class="phone-value">{{ form.phone }}</span>
            </div>
            <span class="form-hint" v-if="!form.phone">绑定手机号可以通过手机号找回密码</span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-page {
  min-height: 100vh;
}

.page-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
  transition: background var(--transition);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.page-title {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.save-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all var(--transition);
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.edit-content {
  padding: 24px 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 32px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-btn {
  display: inline-block;
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition);
}

.avatar-upload-btn:hover {
  background: var(--bg-hover);
}

.avatar-tip {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.edit-form {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow);
}

.success-alert {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #d1fae5;
  border-radius: var(--radius);
  color: #065f46;
  margin-bottom: 20px;
  font-weight: 500;
}

.dark .success-alert {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.required {
  color: var(--error);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-input:disabled {
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.optional {
  font-weight: 400;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.bound-tag {
  font-size: 0.75rem;
  background: #d1fae5;
  color: #065f46;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

.dark .bound-tag {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.phone-bound {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.phone-value {
  color: var(--text-primary);
  font-weight: 500;
}
</style>
