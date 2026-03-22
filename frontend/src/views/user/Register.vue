<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  bio: '',
  wechat_id: ''
})

const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''

  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }

  if (form.value.password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true

  try {
    await userStore.register({
      username: form.value.username,
      password: form.value.password,
      bio: form.value.bio,
      wechat_id: form.value.wechat_id
    })
    router.push('/market')
  } catch (e) {
    error.value = e.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <div class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">二手书市</span>
        </div>
        <h1 class="register-title">创建账户</h1>
        <p class="register-subtitle">加入我们，开始你的淘书之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div v-if="error" class="error-alert">
          <span>⚠️</span>
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username"
            type="text" 
            class="form-input"
            placeholder="设置用户名"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password"
            type="password" 
            class="form-input"
            placeholder="设置密码（至少6位）"
          />
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input 
            v-model="form.confirmPassword"
            type="password" 
            class="form-input"
            placeholder="再次输入密码"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            个性签名
            <span class="optional">（可选）</span>
          </label>
          <input 
            v-model="form.bio"
            type="text" 
            class="form-input"
            placeholder="介绍一下自己"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            微信号
            <span class="optional">（可选）</span>
          </label>
          <input 
            v-model="form.wechat_id"
            type="text" 
            class="form-input"
            placeholder="方便买家联系你"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>→</span>
          <span>{{ loading ? '注册中...' : '注册' }}</span>
        </button>
      </form>

      <div class="register-footer">
        <p>
          已有账户？
          <router-link to="/login" class="link">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.dark .register-page {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 100%);
}

.register-container {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 40px;
}

.logo-text {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.register-subtitle {
  color: var(--text-secondary);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fee2e2;
  border-radius: var(--radius);
  color: #991b1b;
  font-size: 0.875rem;
}

.dark .error-alert {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: var(--text-primary);
}

.optional {
  font-weight: 400;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.form-input {
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.register-footer {
  margin-top: 24px;
  text-align: center;
  color: var(--text-secondary);
}

.link {
  color: var(--primary);
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-container {
    padding: 32px 24px;
  }
}
</style>
