<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
  captchaToken: '',
  captchaInput: ''
})

const captcha = ref({
  token: '',
  data: ''
})

const loading = ref(false)
const error = ref('')

async function fetchCaptcha() {
  try {
    const res = await userApi.getCaptcha()
    captcha.value = res.data
    form.value.captchaToken = res.data.token
  } catch (e) {
    console.error('获取验证码失败', e)
  }
}

onMounted(() => {
  fetchCaptcha()
})

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }

  if (!form.value.captchaInput) {
    error.value = '请输入验证码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await userStore.login({
      username: form.value.username,
      password: form.value.password,
      captchaToken: form.value.captchaToken,
      captchaInput: form.value.captchaInput
    })
    const redirect = route.query.redirect || '/market'
    router.push(redirect)
  } catch (e) {
    error.value = e.message || '登录失败，请检查用户名和密码'
    form.value.captchaInput = ''
    fetchCaptcha()
  } finally {
    loading.value = false
  }
}

function handleDemoLogin() {
  const demoUser = {
    id: 999,
    username: '游客用户',
    bio: '我是来体验功能的游客',
    wechat_id: 'demo_wechat_123'
  }
  
  localStorage.setItem('token', 'demo_token')
  localStorage.setItem('user', JSON.stringify(demoUser))
  
  userStore.$patch({
    token: 'demo_token',
    user: demoUser
  })
  
  router.push('/market')
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">二手书市</span>
        </div>
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">登录您的账户，继续淘书之旅</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
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
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password"
            type="password" 
            class="form-input"
            placeholder="请输入密码"
          />
        </div>

        <div class="form-group captcha-group">
          <label class="form-label">验证码</label>
          <div class="captcha-row">
            <input 
              v-model="form.captchaInput"
              type="text" 
              class="form-input captcha-input"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <div class="captcha-image" @click="fetchCaptcha" v-html="captcha.data"></div>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>→</span>
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>

        <button type="button" class="demo-btn" @click="handleDemoLogin">
          <span>🚀</span>
          <span>游客体验</span>
        </button>
      </form>

      <div class="login-footer">
        <p>
          还没有账户？
          <router-link to="/register" class="link">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.dark .login-page {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
}

.login-header {
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

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--text-secondary);
}

.login-form {
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

.captcha-group .form-label {
  margin-bottom: 4px;
}

.captcha-row {
  display: flex;
  gap: 12px;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 42px;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--border);
  transition: border-color var(--transition);
}

.captcha-image:hover {
  border-color: var(--primary);
}

.captcha-image :deep(svg) {
  width: 100%;
  height: 100%;
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

.demo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: var(--bg-secondary);
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.demo-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(79, 70, 229, 0.05);
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

.login-footer {
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
  .login-container {
    padding: 32px 24px;
  }
}
</style>
