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

.forgot-link {
  margin-top: 12px;
}

.forgot-link a {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.forgot-link a:hover {
  color: var(--primary);
}

.link {
  color: var(--primary);
  font-weight: 600;
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
