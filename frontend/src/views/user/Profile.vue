<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { transactionApi } from '@/api'
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  soldCount: 0,
  boughtCount: 0
})

const user = computed(() => userStore.user)

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

async function fetchStats() {
  try {
    const res = await transactionApi.getTransactionStats()
    stats.value = res.stats || res
  } catch (e) {
    console.error('获取统计失败', e)
  }
}

function logout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
    fetchStats()
  }
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="header-bg"></div>
      <div class="profile-info">
        <div class="avatar-large">
          <img v-if="user?.avatar_url" :src="user.avatar_url" alt="头像" class="avatar-img" />
          <span v-else>{{ user?.username?.charAt(0).toUpperCase() || '?' }}</span>
        </div>
        <h1 class="username">{{ user?.username || '加载中...' }}</h1>
        <p class="bio" v-if="user?.bio">{{ user.bio }}</p>
        <p class="join-date" v-if="user?.created_at">
          <span>📅</span> 加入于 {{ formatDate(user.created_at) }}
        </p>
      </div>
    </div>

    <div class="profile-content">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-detail">
              <span class="stat-value">{{ stats.soldCount }}</span>
              <span class="stat-label">已售出</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-detail">
              <span class="stat-value">{{ stats.boughtCount }}</span>
              <span class="stat-label">已购入</span>
            </div>
          </div>
        </div>

        <div class="menu-section">
          <h3 class="section-title">账户管理</h3>
          <div class="menu-list">
            <router-link to="/profile/edit" class="menu-item">
              <span class="menu-icon">✏️</span>
              <span class="menu-label">编辑资料</span>
              <span class="menu-arrow">›</span>
            </router-link>
            <router-link to="/transactions" class="menu-item">
              <span class="menu-icon">📋</span>
              <span class="menu-label">交易记录</span>
              <span class="menu-arrow">›</span>
            </router-link>
            <router-link to="/seller" class="menu-item">
              <span class="menu-icon">📖</span>
              <span class="menu-label">我的书架</span>
              <span class="menu-arrow">›</span>
            </router-link>
          </div>
        </div>

        <div class="menu-section">
          <h3 class="section-title">联系方式</h3>
          <div class="contact-card">
            <div class="contact-item">
              <span class="contact-icon">💬</span>
              <div class="contact-info">
                <span class="contact-label">微信号</span>
                <span class="contact-value">{{ user?.wechat_id || '未设置' }}</span>
              </div>
            </div>
          </div>
          <p class="contact-tip">
            <span>💡</span> 
            在「编辑资料」中设置你的微信号，方便买家联系你
          </p>
        </div>

        <button class="logout-btn" @click="logout">
          <span>🚪</span>
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.profile-header {
  position: relative;
  padding-bottom: 60px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dark .header-bg {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 100%);
}

.profile-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;
  text-align: center;
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
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
  border: 4px solid var(--bg-card);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.username {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 16px;
}

.bio {
  color: var(--text-secondary);
  margin-top: 8px;
  max-width: 300px;
}

.join-date {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin-top: 8px;
}

.profile-content {
  margin-top: -20px;
  position: relative;
  z-index: 10;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
}

.stat-icon {
  font-size: 32px;
}

.stat-detail {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.menu-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  transition: all var(--transition);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  padding-left: 8px;
}

.menu-icon {
  font-size: 20px;
}

.menu-label {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.menu-arrow {
  font-size: 1.25rem;
  color: var(--text-tertiary);
}

.contact-card {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-icon {
  font-size: 24px;
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.contact-value {
  font-weight: 600;
  color: var(--text-primary);
}

.contact-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #fef3c7;
  border-radius: var(--radius);
  font-size: 0.875rem;
  color: #92400e;
}

.dark .contact-tip {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.contact-tip span {
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: var(--bg-card);
  border: 2px solid var(--error);
  border-radius: var(--radius);
  color: var(--error);
  font-weight: 600;
  transition: all var(--transition);
  margin-top: 24px;
}

.logout-btn:hover {
  background: var(--error);
  color: white;
}
</style>
