<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { friendshipApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useFriendshipStore } from '@/stores/friendship'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()
const friendshipStore = useFriendshipStore()

const activeTab = ref('friends')
const friends = ref([])
const requests = ref([])
const loading = ref(false)

async function fetchFriends() {
  loading.value = true
  try {
    const res = await friendshipApi.getFriends()
    friends.value = res.friends || []
  } catch (e) {
    console.error('获取好友列表失败', e)
  } finally {
    loading.value = false
  }
}

async function fetchRequests() {
  loading.value = true
  try {
    const res = await friendshipApi.getPendingRequests()
    requests.value = res.requests || []
  } catch (e) {
    console.error('获取好友申请失败', e)
  } finally {
    loading.value = false
  }
}

async function handleAccept(friendId) {
  try {
    await friendshipStore.acceptRequest(friendId)
    await fetchRequests()
    await fetchFriends()
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

async function handleReject(friendId) {
  try {
    await friendshipStore.rejectRequest(friendId)
    await fetchRequests()
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

async function handleDeleteFriend(friendId) {
  if (!confirm('确定要删除该好友吗？')) return
  try {
    await friendshipApi.deleteFriend(friendId)
    await fetchFriends()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

function goToChat(friend) {
  router.push(`/messages/chat/${friend.friend_id}`)
}

function formatTime(time) {
  return dayjs(time).format('MM/DD HH:mm')
}

onMounted(() => {
  fetchFriends()
  fetchRequests()
  friendshipStore.fetchPendingCount()
})
</script>

<template>
  <div class="friends-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">好友</h1>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'friends' }"
        @click="activeTab = 'friends'"
      >
        好友列表
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'requests' }"
        @click="activeTab = 'requests'"
      >
        好友申请
        <span v-if="requests.length > 0" class="badge">{{ requests.length }}</span>
      </button>
    </div>

    <div class="content">
      <div v-if="activeTab === 'friends'">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="friends.length === 0" class="empty">
          <div class="empty-icon">👥</div>
          <p>还没有好友</p>
          <p class="hint">去市场找找志同道合的书友吧</p>
        </div>
        <div v-else class="friend-list">
          <div 
            v-for="friend in friends" 
            :key="friend.id"
            class="friend-item"
            @click="goToChat(friend)"
          >
            <div class="avatar">
              {{ friend.friend_name?.charAt(0).toUpperCase() || '?' }}
            </div>
            <div class="friend-info">
              <div class="friend-name">{{ friend.friend_name }}</div>
              <div class="friend-time">{{ formatTime(friend.updated_at) }}</div>
            </div>
            <button class="chat-btn" @click.stop="goToChat(friend)">发消息</button>
            <button class="delete-btn" @click.stop="handleDeleteFriend(friend.friend_id)">删除</button>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="requests.length === 0" class="empty">
          <div class="empty-icon">📭</div>
          <p>没有新的好友申请</p>
        </div>
        <div v-else class="request-list">
          <div 
            v-for="req in requests" 
            :key="req.id"
            class="request-item"
          >
            <div class="avatar">
              {{ req.from_username?.charAt(0).toUpperCase() || '?' }}
            </div>
            <div class="request-info">
              <div class="request-name">{{ req.from_username }}</div>
              <div class="request-message" v-if="req.message">{{ req.message }}</div>
              <div class="request-time">{{ formatTime(req.created_at) }}</div>
            </div>
            <div class="request-actions">
              <button class="accept-btn" @click="handleAccept(req.user_id)">同意</button>
              <button class="reject-btn" @click="handleReject(req.user_id)">拒绝</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friends-page {
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

.tabs {
  display: flex;
  background: var(--bg-card);
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
}

.tab {
  flex: 1;
  padding: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab.active {
  color: var(--primary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 10px;
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

.empty h3 {
  margin-bottom: 8px;
  color: var(--text-primary);
}

.hint {
  font-size: 0.875rem;
}

.friend-list, .request-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item, .request-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.friend-info, .request-info {
  flex: 1;
  min-width: 0;
}

.friend-name, .request-name {
  font-weight: 600;
  color: var(--text-primary);
}

.friend-time, .request-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.request-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.chat-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
}

.delete-btn {
  padding: 8px 12px;
  color: var(--error);
  font-size: 0.875rem;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn {
  padding: 8px 16px;
  background: var(--success);
  color: white;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
}

.reject-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius);
  font-size: 0.875rem;
}
</style>
