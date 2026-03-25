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

const showForgotModal = ref(false)
const forgotPhone = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const foundUsername = ref('')
const resetting = ref(false)
const forgotError = ref('')

const captcha = ref({
  token: '',
  data: ''
})

const loading = ref(false)
const error = ref('')

async function fetchCaptcha() {
  try {
    const res = await userApi.getCaptcha()
    captcha.value = { token: res.token, data: res.captcha }
    form.value.captchaToken = res.token
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

function openForgotModal() {
  showForgotModal.value = true
  forgotPhone.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  foundUsername.value = ''
  forgotError.value = ''
}

function closeForgotModal() {
  showForgotModal.value = false
}

async function checkPhone() {
  forgotError.value = ''
  
  if (!forgotPhone.value) {
    forgotError.value = '请输入手机号'
    return
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(forgotPhone.value)) {
    forgotError.value = '手机号格式不正确'
    return
  }
  
  try {
    const res = await userApi.findByPhone(forgotPhone.value)
    if (res.data.bound) {
      foundUsername.value = res.data.username
    } else {
      forgotError.value = '该手机号未注册'
    }
  } catch (e) {
    forgotError.value = e.message || '查询失败'
  }
}

async function resetPassword() {
  forgotError.value = ''
  
  if (!newPassword.value) {
    forgotError.value = '请输入新密码'
    return
  }
  
  if (newPassword.value.length < 6) {
    forgotError.value = '密码长度至少为6位'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    forgotError.value = '两次输入的密码不一致'
    return
  }
  
  resetting.value = true
  
  try {
    await userApi.resetPassword(forgotPhone.value, newPassword.value)
    alert('密码重置成功，请使用新密码登录')
    closeForgotModal()
    fetchCaptcha()
  } catch (e) {
    forgotError.value = e.message || '重置失败'
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="hero-bg-animation"></div>
    <div class="login-container glass">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon bounce-in">📚</span>
          <span class="logo-text text-gradient-animate">二手书市</span>
        </div>
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">登录您的账户，继续淘书之旅</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="error-alert bounce-in">
          <span>⚠️</span>
          {{ error }}
        </div>

        <div class="form-group hover-lift">
          <label class="form-label">用户名</label>
          <input 
            v-model="form.username"
            type="text" 
            class="form-input"
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group hover-lift">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password"
            type="password" 
            class="form-input"
            placeholder="请输入密码"
          />
        </div>

        <div class="form-group captcha-group hover-lift">
          <label class="form-label">验证码</label>
          <div class="captcha-row">
            <input 
              v-model="form.captchaInput"
              type="text" 
              class="form-input captcha-input"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <div class="captcha-image neon-border" @click="fetchCaptcha" v-html="captcha.data"></div>
          </div>
        </div>

        <button type="submit" class="submit-btn ripple pulse-glow" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>→</span>
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>

        <button type="button" class="demo-btn ripple" @click="handleDemoLogin">
          <span>🚀</span>
          <span>游客体验</span>
        </button>
      </form>

      <div class="login-footer">
        <p>
          还没有账户？
          <router-link to="/register" class="link">立即注册</router-link>
        </p>
        <p class="forgot-link">
          <a href="#" @click.prevent="openForgotModal">忘记密码？</a>
        </p>
      </div>
    </div>
  </div>

  <div v-if="showForgotModal" class="modal-overlay" @click.self="closeForgotModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>找回密码</h3>
        <button class="modal-close" @click="closeForgotModal">×</button>
      </div>
      <div class="modal-body">
        <div v-if="forgotError" class="error-alert">{{ forgotError }}</div>
        <div v-if="foundUsername" class="username-hint">
          找到账户：{{ foundUsername }}
        </div>

        <div class="form-group">
          <input 
            v-model="forgotPhone"
            type="tel" 
            class="form-input"
            placeholder="请输入绑定的手机号"
            maxlength="11"
            :disabled="foundUsername"
          />
        </div>

        <button v-if="!foundUsername" class="submit-btn full-width" @click="checkPhone">查找账户</button>

        <template v-if="foundUsername">
          <div class="form-group">
            <input 
              v-model="newPassword"
              type="password" 
              class="form-input"
              placeholder="请输入新密码（至少6位）"
            />
          </div>
          <div class="form-group">
            <input 
              v-model="confirmPassword"
              type="password" 
              class="form-input"
              placeholder="请再次输入新密码"
            />
          </div>
          <button class="submit-btn full-width" @click="resetPassword" :disabled="resetting">
            {{ resetting ? '重置中...' : '重置密码' }}
          </button>
        </template>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradient-flow 8s ease infinite;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.hero-bg-animation {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 30% 70%, rgba(102, 126, 234, 0.5) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(240, 147, 251, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(118, 75, 162, 0.3) 0%, transparent 60%);
  animation: pulse-glow 4s ease-in-out infinite;
}

.dark .login-page {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 50%, #3d2a5c 100%);
  background-size: 200% 200%;
  animation: gradient-flow 8s ease infinite;
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  padding: 48px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
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
  font-size: 48px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.logo-text {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255,255,255,0.3);
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.login-subtitle {
  color: rgba(255,255,255,0.85);
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
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(10px);
  border-radius: var(--radius);
  color: white;
  font-size: 0.875rem;
  border: 1px solid rgba(255,255,255,0.2);
}

.dark .error-alert {
  background: rgba(239, 68, 68, 0.3);
  color: #fee2e2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.form-input {
  padding: 16px 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  transition: all var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: white;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.form-input::placeholder {
  color: rgba(255,255,255,0.6);
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
  height: 48px;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all var(--transition);
  background: rgba(255,255,255,0.1);
}

.captcha-image:hover {
  border-color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255,255,255,0.2);
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
  padding: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  color: var(--primary);
  border-radius: var(--radius);
  font-size: 1.1rem;
  font-weight: 700;
  transition: all var(--transition);
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 30px rgba(255, 255, 255, 0.4);
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  transition: all var(--transition);
}

.demo-btn:hover {
  border-color: white;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
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
  margin-top: 28px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.forgot-link {
  margin-top: 12px;
}

.forgot-link a {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  transition: color var(--transition);
}

.forgot-link a:hover {
  color: white;
}

.link {
  color: white;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.link:hover {
  text-decoration: underline;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-tertiary);
  transition: all var(--transition);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.step-content {
  text-align: center;
}

.step-hint {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.username-hint {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: var(--radius);
  margin-bottom: 16px;
  color: var(--text-primary);
  font-weight: 500;
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
  margin-bottom: 16px;
}

.dark .error-alert {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.form-input {
  width: 100%;
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
}

.form-group {
  margin-bottom: 16px;
}

.full-width {
  width: 100%;
}

.sms-row {
  display: flex;
  gap: 12px;
}

.sms-row .form-input {
  flex: 1;
}

.sms-btn {
  padding: 12px 16px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  white-space: nowrap;
}

.sms-btn:disabled {
  opacity: 0.5;
}

@media (max-width: 480px) {
  .login-container {
    padding: 32px 24px;
  }
}
</style>
