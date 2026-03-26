<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  bio: '',
  wechat_id: '',
  phone: '',
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
    captcha.value = { token: res.token, data: res.captcha }
    form.value.captchaToken = res.token
  } catch (e) {
    console.error('获取验证码失败', e)
  }
}

onMounted(() => {
  fetchCaptcha()
})

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

  if (!form.value.captchaInput) {
    error.value = '请输入验证码'
    return
  }

  loading.value = true

  try {
    await userStore.register({
      username: form.value.username,
      password: form.value.password,
      bio: form.value.bio,
      wechat_id: form.value.wechat_id,
      phone: form.value.phone || undefined,
      captchaToken: form.value.captchaToken,
      captchaInput: form.value.captchaInput
    })
    router.push('/market')
  } catch (e) {
    error.value = e.message || '注册失败，请重试'
    form.value.captchaInput = ''
    fetchCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="hero-bg-animation"></div>
    <div class="register-container glass">
      <div class="register-header">
        <div class="logo">
          <span class="logo-icon bounce-in">📚</span>
          <span class="logo-text text-gradient-animate">二手书市</span>
        </div>
        <h1 class="register-title">创建账户</h1>
        <p class="register-subtitle">加入我们，开始你的淘书之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
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
            placeholder="设置用户名"
          />
        </div>

        <div class="form-group hover-lift">
          <label class="form-label">密码</label>
          <input 
            v-model="form.password"
            type="password" 
            class="form-input"
            placeholder="设置密码（至少6位）"
          />
        </div>

        <div class="form-group hover-lift">
          <label class="form-label">确认密码</label>
          <input 
            v-model="form.confirmPassword"
            type="password" 
            class="form-input"
            placeholder="再次输入密码"
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

        <div class="form-group hover-lift">
          <label class="form-label">
            手机号
            <span class="optional">（可选，用于找回密码）</span>
          </label>
          <input 
            v-model="form.phone"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="form-input"
            placeholder="请输入手机号"
            maxlength="11"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="form-group hover-lift">
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

        <div class="form-group hover-lift">
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

        <button type="submit" class="submit-btn ripple pulse-glow" :disabled="loading">
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

.dark .register-page {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 50%, #3d2a5c 100%);
  background-size: 200% 200%;
  animation: gradient-flow 8s ease infinite;
}

.register-container {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  padding: 48px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
  max-height: 90vh;
  overflow-y: auto;
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 44px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.logo-text {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255,255,255,0.3);
}

.register-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.register-subtitle {
  color: rgba(255,255,255,0.85);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 6px;
}

.form-label {
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.optional {
  font-weight: 400;
  color: rgba(255,255,255,0.7);
  font-size: 0.8rem;
}

.form-input {
  padding: 14px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  font-size: 0.95rem;
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

.captcha-row {
  display: flex;
  gap: 12px;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 44px;
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
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  color: var(--primary);
  border-radius: var(--radius);
  font-size: 1.05rem;
  font-weight: 700;
  transition: all var(--transition);
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 30px rgba(255, 255, 255, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-footer {
  margin-top: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.link {
  color: white;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
