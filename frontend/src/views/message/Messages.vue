<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const conversations = ref([])
const loading = ref(false)

async function fetchConversations() {
  loading.value = true
  try {
    const res = await messageApi.getConversations()
    conversations.value = res.conversations || res || []
    
    for (const conv of conversations.value) {
      try {
        const userId = conv.other_user_id
        if (userId) {
          const userRes = await userApi.getUserById(userId)
          conv.otherUser = userRes.user
        }
      } catch (e) {
        console.error('获取用户失败', e)
      }
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
  } finally {
    loading.value = false
  }
}

function goToChat(conversation) {
  const userId = conversation.other_user_id || conversation.otherUser?.id
  if (!userId) {
    console.error('无法获取用户ID', conversation)
    return
  }
  router.push(`/messages/chat/${userId}`)
}

function formatTime(time) {
  if (!time) return ''
  const date = dayjs(time)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    return date.format('HH:mm')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (date.isSame(now, 'year')) {
    return date.format('MM-DD')
  } else {
    return date.format('YYYY-MM-DD')
  }
}

onMounted(() => {
  fetchConversations()
  messageStore.fetchUnreadCount()
})
</script>

<template>
  <div class="messages-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">💬</span>
          消息中心
        </h1>
      </div>
    </div>

    <div class="messages-content">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
        </div>

        <div v-else-if="conversations.length === 0" class="empty-state">
          <div class="empty-icon">💭</div>
          <h3>暂无消息</h3>
          <p>去市场看看有什么书籍吧</p>
          <router-link to="/market" class="empty-action">
            浏览市场
          </router-link>
        </div>

        <div v-else class="conversations-list">
          <div 
            v-for="conv in conversations" 
            :key="conv.id || conv.other_user_id"
            class="conversation-item"
            @click="goToChat(conv)"
          >
            <div class="avatar">
              {{ conv.otherUser?.username?.charAt(0).toUpperCase() || '?' }}
            </div>
            <div class="conv-info">
              <div class="conv-header">
                <span class="conv-name">{{ conv.otherUser?.username || '未知用户' }}</span>
                <span class="conv-time">{{ formatTime(conv.last_message_time) }}</span>
              </div>
              <p class="conv-preview">
                {{ conv.last_message || '暂无消息' }}
              </p>
            </div>
            <div class="conv-right">
              <span v-if="conv.unread_count > 0" class="unread-badge">{{ conv.unread_count > 99 ? '99+' : conv.unread_count }}</span>
              <span class="conv-arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-page {
  min-height: 100vh;
}

.page-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 24px 0;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.title-icon {
  font-size: 1.75rem;
}

.messages-content {
  padding: 20px 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
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

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.empty-action {
  display: inline-flex;
  padding: 12px 32px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
}

.conversations-list {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background var(--transition);
  border-bottom: 1px solid var(--border);
}

.conversation-item:last-child {
  border-bottom: none;
}

.conversation-item:hover {
  background: var(--bg-hover);
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
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conv-name {
  font-weight: 600;
  color: var(--text-primary);
}

.conv-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.conv-preview {
  font-size: 0.875rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.unread-badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.conv-arrow {
  font-size: 1.5rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>
