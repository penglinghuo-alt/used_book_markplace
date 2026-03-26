<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { browseHistoryApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()

const history = ref([])
const loading = ref(false)

async function fetchHistory() {
  loading.value = true
  try {
    const res = await browseHistoryApi.getHistory(100)
    history.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('获取浏览历史失败', e)
  } finally {
    loading.value = false
  }
}

async function handleClear() {
  if (!confirm('确定要清空所有浏览历史吗？')) return
  try {
    await browseHistoryApi.clearHistory()
    history.value = []
  } catch (e) {
    alert(e.message || '操作失败')
  }
}

async function handleDelete(bookId) {
  try {
    await browseHistoryApi.deleteRecord(bookId)
    history.value = history.value.filter(h => h.book_id !== bookId)
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

function goToBook(book) {
  router.push(`/market/book/${book.book_id}`)
}

function formatTime(time) {
  return dayjs(time).fromNow()
}

function formatPrice(price) {
  return Number(price).toFixed(2)
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">浏览历史</h1>
        <button v-if="history.length > 0" class="clear-btn" @click="handleClear">
          清空
        </button>
      </div>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="history.length === 0" class="empty">
        <div class="empty-icon">📚</div>
        <p>还没有浏览记录</p>
        <p class="hint">去市场看看有什么好看的书吧</p>
      </div>
      <div v-else class="history-list">
        <div 
          v-for="item in history" 
          :key="item.id"
          class="history-item"
        >
          <div class="book-cover" @click="goToBook(item)">
            <img v-if="item.book_image" :src="item.book_image" :alt="item.book_title" />
            <div v-else class="book-placeholder">📖</div>
          </div>
          <div class="book-info" @click="goToBook(item)">
            <div class="book-title">{{ item.book_title }}</div>
            <div class="book-author">{{ item.book_author }}</div>
            <div class="book-meta">
              <span class="book-price">¥{{ formatPrice(item.book_price) }}</span>
              <span class="book-seller">卖家: {{ item.seller_name }}</span>
            </div>
            <div class="view-time">浏览于 {{ formatTime(item.viewed_at) }}</div>
          </div>
          <button class="delete-btn" @click.stop="handleDelete(item.book_id)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
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
  flex: 1;
  font-size: 1.25rem;
  font-weight: 700;
}

.clear-btn {
  padding: 8px 16px;
  color: var(--error);
  font-size: 0.875rem;
  font-weight: 600;
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  position: relative;
}

.book-cover {
  width: 70px;
  height: 90px;
  border-radius: var(--radius);
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-placeholder {
  font-size: 32px;
}

.book-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.book-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.book-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.book-price {
  color: var(--primary);
  font-weight: 600;
}

.book-seller {
  color: var(--text-tertiary);
}

.view-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: var(--error);
  color: white;
}
</style>
