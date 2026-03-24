<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { messageApi, userApi, bookApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const otherUserId = computed(() => Number(route.params.userId))
const bookId = computed(() => route.query.bookId ? Number(route.query.bookId) : null)

const otherUser = ref(null)
const book = ref(null)
const messages = ref([])
const newMessage = ref('')
const loading = ref(false)
const sending = ref(false)
const messagesContainer = ref(null)

async function fetchOtherUser() {
  try {
    const res = await userApi.getUserById(otherUserId.value)
    otherUser.value = res.user
  } catch (e) {
    console.error('获取用户信息失败', e)
  }
}

async function fetchBook() {
  if (!bookId.value) return
  try {
    const res = await bookApi.getBookById(bookId.value)
    book.value = res.book || res
  } catch (e) {
    console.error('获取书籍信息失败', e)
  }
}

async function fetchMessages() {
  loading.value = true
  try {
    const res = await messageApi.getConversation(otherUserId.value)
    messages.value = res.messages || res || []
    scrollToBottom()
    messageStore.markAsRead(otherUserId.value)
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return
  
  sending.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''
  
  try {
    const res = await messageApi.sendMessage({
      receiver_id: otherUserId.value,
      book_id: bookId.value,
      content
    })
    
    messages.value.push({
      ...res.message,
      sender_id: userStore.user.id
    })
    
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送失败:', error)
    newMessage.value = content
    alert('发送失败，请重试')
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatTime(time) {
  return dayjs(time).format('HH:mm')
}

function isMyMessage(msg) {
  return msg.sender_id === userStore.user?.id
}

let pollInterval = null

onMounted(async () => {
  await fetchOtherUser()
  await fetchBook()
  await fetchMessages()
  
  pollInterval = setInterval(fetchMessages, 3000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<template>
  <div class="chat-page">
    <div class="chat-header">
      <button class="back-btn" @click="router.back()">
        <span>←</span>
      </button>
      <div class="header-info">
        <div class="user-info">
          <span class="avatar">{{ otherUser?.username?.charAt(0).toUpperCase() || '?' }}</span>
          <span class="username">{{ otherUser?.username || '加载中...' }}</span>
        </div>
      </div>
    </div>

    <div v-if="book" class="book-banner">
      <div class="book-info">
        <span class="book-icon">📖</span>
        <div class="book-detail">
          <span class="book-title">{{ book.title }}</span>
          <span class="book-price">¥{{ Number(book.price).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div ref="messagesContainer" class="messages-container">
      <div v-if="loading && messages.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <p>还没有消息，开始聊天吧！</p>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="(msg, index) in messages" 
          :key="msg.id || index"
          class="message-item"
          :class="{ mine: isMyMessage(msg) }"
        >
          <div class="message-bubble">
            <p class="message-content">{{ msg.content }}</p>
            <span class="message-time">{{ formatTime(msg.sent_at || msg.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <input 
        v-model="newMessage"
        type="text" 
        class="message-input"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
        :disabled="sending"
      />
      <button 
        class="send-btn" 
        @click="sendMessage"
        :disabled="!newMessage.trim() || sending"
      >
        <span v-if="sending">...</span>
        <span v-else>➤</span>
      </button>
    </div>

    <div v-if="otherUser?.wechat_id" class="wechat-tip">
      <span class="tip-icon">💡</span>
      <span>对方微信号：{{ otherUser.wechat_id }}</span>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.chat-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-primary);
  transition: background var(--transition);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.header-info {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.username {
  font-weight: 600;
  color: var(--text-primary);
}

.book-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 20px;
  flex-shrink: 0;
}

.dark .book-banner {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 100%);
}

.book-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.book-icon {
  font-size: 28px;
}

.book-detail {
  display: flex;
  flex-direction: column;
}

.book-title {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.book-price {
  color: rgba(255,255,255,0.9);
  font-size: 0.75rem;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  justify-content: flex-start;
}

.message-item.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item:not(.mine) .message-bubble {
  background: var(--bg-card);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.message-item.mine .message-bubble {
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-content {
  font-size: 0.9375rem;
  line-height: 1.5;
  word-break: break-word;
}

.message-time {
  display: block;
  font-size: 0.625rem;
  margin-top: 4px;
  opacity: 0.7;
  text-align: right;
}

.input-area {
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 24px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all var(--transition);
}

.message-input:focus {
  outline: none;
  border-color: var(--primary);
}

.message-input::placeholder {
  color: var(--text-tertiary);
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all var(--transition);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wechat-tip {
  background: #fef3c7;
  padding: 8px 16px;
  text-align: center;
  font-size: 0.75rem;
  color: #92400e;
  flex-shrink: 0;
}

.dark .wechat-tip {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.tip-icon {
  margin-right: 6px;
}
</style>
