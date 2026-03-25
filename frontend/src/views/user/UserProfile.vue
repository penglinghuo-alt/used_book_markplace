<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi, friendshipApi, followApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useFriendshipStore } from '@/stores/friendship'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const friendshipStore = useFriendshipStore()

const user = ref(null)
const loading = ref(true)
const friendStatus = ref('none')
const showRequestModal = ref(false)
const requestMessage = ref('')
const submitting = ref(false)
const followCounts = ref({ following: 0, followers: 0 })
const isFollowing = ref(false)

async function fetchUser() {
  try {
    const res = await userApi.getUserById(route.params.id)
    user.value = res.user || res
    await checkFriendStatus()
    await fetchFollowCounts()
    await checkFollowStatus()
  } catch (error) {
    console.error('获取用户信息失败:', error)
    router.back()
  } finally {
    loading.value = false
  }
}

async function checkFriendStatus() {
  try {
    const res = await friendshipApi.checkStatus(route.params.id)
    friendStatus.value = res.status
  } catch (e) {
    console.error('检查好友状态失败', e)
  }
}

async function fetchFollowCounts() {
  try {
    const res = await followApi.getCounts(route.params.id)
    followCounts.value = res.data || { following: 0, followers: 0 }
  } catch (e) {
    console.error('获取关注统计失败', e)
  }
}

async function checkFollowStatus() {
  try {
    const res = await followApi.checkStatus(route.params.id)
    isFollowing.value = res.data?.isFollowing || false
  } catch (e) {
    console.error('检查关注状态失败', e)
  }
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  try {
    if (isFollowing.value) {
      await followApi.unfollow(route.params.id)
      isFollowing.value = false
      followCounts.value.followers--
    } else {
      await followApi.follow(route.params.id)
      isFollowing.value = true
      followCounts.value.followers++
    }
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

function openRequestModal() {
  requestMessage.value = ''
  showRequestModal.value = true
}

async function sendFriendRequest() {
  submitting.value = true
  try {
    await friendshipStore.sendRequest(route.params.id, requestMessage.value)
    await checkFriendStatus()
    showRequestModal.value = false
    alert('好友申请已发送')
  } catch (e) {
    alert(e.message || '发送失败')
  } finally {
    submitting.value = false
  }
}

function startChat() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (friendStatus.value !== 'friends') {
    alert('请先添加好友')
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

const isOwnProfile = computed(() => {
  return userStore.user?.id === Number(route.params.id)
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
          <img v-if="user.avatar_url" :src="user.avatar_url" alt="头像" class="avatar-img" />
          <span v-else>{{ user.username?.charAt(0).toUpperCase() || '?' }}</span>
        </div>
        <h2 class="username">{{ user.username }}</h2>
        <div class="follow-stats">
          <span class="stat"><strong>{{ followCounts.following }}</strong> 关注</span>
          <span class="divider">|</span>
          <span class="stat"><strong>{{ followCounts.followers }}</strong> 粉丝</span>
        </div>
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

      <div class="action-section" v-if="!isOwnProfile && userStore.isLoggedIn">
        <button 
          class="action-btn follow-btn"
          :class="{ following: isFollowing }"
          @click="handleFollow"
        >
          <span>{{ isFollowing ? '✓' : '+' }}</span>
          <span>{{ isFollowing ? '已关注' : '关注' }}</span>
        </button>
        <button 
          v-if="friendStatus === 'friends'" 
          class="action-btn primary" 
          @click="startChat"
        >
          <span>💬</span>
          <span>发消息</span>
        </button>
        <button 
          v-else-if="friendStatus === 'none'" 
          class="action-btn add-friend" 
          @click="openRequestModal"
        >
          <span>➕</span>
          <span>添加好友</span>
        </button>
        <button 
          v-else-if="friendStatus === 'sent'" 
          class="action-btn disabled" 
          disabled
        >
          <span>⏳</span>
          <span>等待对方同意</span>
        </button>
        <button 
          v-else-if="friendStatus === 'received'" 
          class="action-btn primary" 
          @click="openRequestModal"
        >
          <span>📩</span>
          <span>回复好友申请</span>
        </button>
        <span v-else-if="friendStatus === 'rejected'" class="rejected-hint">已拒绝此申请</span>
      </div>

      <div v-if="showRequestModal" class="modal-overlay" @click.self="showRequestModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>添加好友</h3>
            <button @click="showRequestModal = false">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-hint">向 {{ user?.username }} 发送好友申请</p>
            <textarea 
              v-model="requestMessage"
              class="form-textarea"
              placeholder="介绍一下自己，表明来意..."
              rows="3"
            ></textarea>
            <button 
              class="submit-btn" 
              @click="sendFriendRequest"
              :disabled="submitting"
            >
              {{ submitting ? '发送中...' : '发送申请' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
  margin-bottom: 8px;
}

.follow-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.follow-stats .stat {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.follow-stats .stat strong {
  color: var(--text-primary);
  font-weight: 600;
}

.follow-stats .divider {
  color: var(--text-tertiary);
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
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition);
}

.action-btn.follow-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.action-btn.follow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.action-btn.follow-btn.following {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  box-shadow: none;
}

.action-btn.follow-btn.following:hover {
  background: var(--error);
  color: white;
  border-color: var(--error);
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

.action-btn.add-friend {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.action-btn.add-friend:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.action-btn.disabled {
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.rejected-hint {
  display: block;
  text-align: center;
  color: var(--text-tertiary);
  padding: 16px;
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
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
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
}

.modal-header button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.5rem;
  color: var(--text-tertiary);
}

.modal-body {
  padding: 20px;
}

.modal-hint {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 16px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
}

.submit-btn:disabled {
  opacity: 0.6;
}
</style>
