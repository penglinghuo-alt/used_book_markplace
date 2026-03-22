<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = ref(null)
const loading = ref(true)

async function fetchUser() {
  try {
    const res = await userApi.getUserById(route.params.id)
    user.value = res.user || res
  } catch (error) {
    console.error('获取用户信息失败:', error)
    router.back()
  } finally {
    loading.value = false
  }
}

function startChat() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  router.push(`/messages/chat/${route.params.id}`)
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="user-profile-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">个人资料</h1>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
    </div>

    <div v-else-if="user" class="profile-content">
      <div class="profile-header">
        <div class="avatar-large">
          {{ user.username?.charAt(0).toUpperCase() || '?' }}
        </div>
        <h2 class="username">{{ user.username }}</h2>
        <p class="join-date" v-if="user.created_at">
          <span>📅</span> 加入于 {{ formatDate(user.created_at) }}
        </p>
      </div>

      <div class="profile-card">
        <h3 class="card-title">
          <span>💬</span>
          联系方式
        </h3>
        <div class="contact-item" v-if="user.wechat_id">
          <span class="label">微信号</span>
          <span class="value">{{ user.wechat_id }}</span>
        </div>
        <div class="contact-item" v-else>
          <span class="label">暂未设置</span>
        </div>
      </div>

      <div class="profile-card" v-if="user.bio">
        <h3 class="card-title">
          <span>📝</span>
          个人简介
        </h3>
        <p class="bio-text">{{ user.bio }}</p>
      </div>

      <div class="action-section" v-if="!isOwnProfile">
        <button class="action-btn primary" @click="startChat">
          <span>💬</span>
          <span>发起聊天</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    isOwnProfile() {
      return userStore.user?.id === Number(route.params.id)
    }
  }
}
</script>

<style scoped>
.user-profile-page {
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
  transition: background var(--transition);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 20px;
}

.profile-header {
  text-align: center;
  padding: 32px 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.avatar-large {
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
  margin: 0 auto 16px;
}

.username {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.join-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.profile-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item .label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.contact-item .value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
}

.bio-text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.action-section {
  margin-top: 24px;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}
</style>
