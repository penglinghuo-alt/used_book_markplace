<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { followApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()

const following = ref([])
const loading = ref(false)

async function fetchFollowing() {
  loading.value = true
  try {
    const res = await followApi.getFollowing()
    following.value = res.data || []
  } catch (e) {
    console.error('获取关注列表失败', e)
  } finally {
    loading.value = false
  }
}

async function handleUnfollow(userId) {
  if (!confirm('确定要取消关注吗？')) return
  try {
    await followApi.unfollow(userId)
    await fetchFollowing()
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

function goToUser(userId) {
  router.push(`/user/${userId}`)
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD')
}

onMounted(() => {
  fetchFollowing()
})
</script>

<template>
  <div class="following-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">我的关注</h1>
      </div>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="following.length === 0" class="empty">
        <div class="empty-icon">👥</div>
        <p>还没有关注任何人</p>
        <p class="hint">去市场看看有哪些有趣的书友吧</p>
      </div>
      <div v-else class="user-list">
        <div 
          v-for="item in following" 
          :key="item.id"
          class="user-item"
        >
          <div class="avatar" @click="goToUser(item.following_id)">
            {{ item.following_username?.charAt(0).toUpperCase() || '?' }}
          </div>
          <div class="user-info" @click="goToUser(item.following_id)">
            <div class="user-name">{{ item.following_username }}</div>
            <div class="user-bio" v-if="item.following_bio">{{ item.following_bio }}</div>
            <div class="user-time">关注于 {{ formatTime(item.created_at) }}</div>
          </div>
          <button class="unfollow-btn" @click="handleUnfollow(item.following_id)">取消关注</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.following-page {
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
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.content {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.hint {
  font-size: 0.875rem;
  margin-top: 8px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.avatar:hover {
  transform: scale(1.1);
}

.user-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.user-bio {
  font-size: 0.875rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.user-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.unfollow-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.unfollow-btn:hover {
  background: var(--error);
  color: white;
  border-color: var(--error);
}
</style>
