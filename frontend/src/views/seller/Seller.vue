<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { bookApi } from '@/api'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()

const books = ref([])
const loading = ref(false)
const activeTab = ref('active')

const filteredBooks = computed(() => {
  return books.value.filter(book => 
    activeTab.value === 'all' || book.status === activeTab.value
  )
})

const stats = computed(() => {
  const active = books.value.filter(b => b.status === 'active').length
  const sold = books.value.filter(b => b.status === 'sold').length
  return { active, sold, total: books.value.length }
})

async function fetchMyBooks() {
  loading.value = true
  try {
    const res = await bookApi.getMyBooks()
    books.value = res.books || res || []
  } catch (error) {
    console.error('获取书籍失败:', error)
  } finally {
    loading.value = false
  }
}

function formatTime(time) {
  return dayjs(time).format('MM/DD')
}

function goToDetail(book) {
  router.push(`/market/book/${book.id}`)
}

async function markAsSold(book) {
  const buyerName = prompt('请输入买家用户名：')
  if (!buyerName) return
  
  try {
    await bookApi.updateBookStatus(book.id, 'sold')
    await fetchMyBooks()
  } catch (error) {
    console.error('标记失败:', error)
    alert('操作失败，请重试')
  }
}

async function deleteBook(book) {
  if (!confirm('确定要删除此书籍吗？')) return
  
  try {
    await bookApi.deleteBook(book.id)
    await fetchMyBooks()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

onMounted(() => {
  fetchMyBooks()
})
</script>

<template>
  <div class="seller-page">
    <div class="seller-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">📖</span>
          我的书架
        </h1>
        <router-link to="/seller/publish" class="publish-btn">
          <span>+</span>
          <span>发布新书</span>
        </router-link>
      </div>
    </div>

    <div class="seller-content">
      <div class="container">
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon active">📚</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.active }}</span>
              <span class="stat-label">在售</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon sold">✅</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.sold }}</span>
              <span class="stat-label">已售</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon total">📊</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">总计</span>
            </div>
          </div>
        </div>

        <div class="filter-tabs">
          <button 
            class="tab" 
            :class="{ active: activeTab === 'active' }"
            @click="activeTab = 'active'"
          >
            在售 ({{ stats.active }})
          </button>
          <button 
            class="tab" 
            :class="{ active: activeTab === 'sold' }"
            @click="activeTab = 'sold'"
          >
            已售 ({{ stats.sold }})
          </button>
          <button 
            class="tab" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            全部 ({{ stats.total }})
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>暂无书籍</h3>
          <p>还没有发布任何书籍，快去发布吧！</p>
          <router-link to="/seller/publish" class="empty-action">
            发布书籍
          </router-link>
        </div>

        <div v-else class="books-list">
          <div 
            v-for="book in filteredBooks" 
            :key="book.id"
            class="book-item"
            @click="goToDetail(book)"
          >
            <div class="book-cover">
              <span class="book-emoji">📖</span>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author }}</p>
              <div class="book-meta">
                <span class="book-price">¥{{ Number(book.price).toFixed(2) }}</span>
                <span class="book-time">{{ formatTime(book.created_at) }}</span>
              </div>
            </div>
            <div class="book-status">
              <span class="status-tag" :class="book.status">
                {{ book.status === 'active' ? '在售' : '已售' }}
              </span>
            </div>
            <div class="book-actions" @click.stop>
              <button 
                v-if="book.status === 'active'"
                class="action-btn sold-btn"
                @click="markAsSold(book)"
              >
                标记售出
              </button>
              <button 
                class="action-btn delete-btn"
                @click="deleteBook(book)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-page {
  min-height: 100vh;
}

.seller-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 24px 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.publish-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all var(--transition);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.publish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.seller-content {
  padding: 24px 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.active {
  background: #d1fae5;
}

.dark .stat-icon.active {
  background: rgba(16, 185, 129, 0.2);
}

.stat-icon.sold {
  background: #fef3c7;
}

.dark .stat-icon.sold {
  background: rgba(245, 158, 11, 0.2);
}

.stat-icon.total {
  background: #dbeafe;
}

.dark .stat-icon.total {
  background: rgba(59, 130, 246, 0.2);
}

.stat-info {
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

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: var(--bg-card);
  padding: 6px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.tab {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  background: var(--primary);
  color: white;
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

.books-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.book-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition);
}

.book-item:hover {
  box-shadow: var(--shadow);
  transform: translateX(4px);
}

.book-cover {
  width: 60px;
  height: 80px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.book-emoji {
  font-size: 32px;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 1rem;
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
  margin-bottom: 8px;
}

.book-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.book-price {
  color: var(--primary);
  font-weight: 600;
}

.book-status {
  flex-shrink: 0;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-tag.active {
  background: #d1fae5;
  color: #065f46;
}

.dark .status-tag.active {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.status-tag.sold {
  background: #fef3c7;
  color: #92400e;
}

.dark .status-tag.sold {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.book-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  transition: all var(--transition);
}

.sold-btn {
  background: var(--success);
  color: white;
}

.sold-btn:hover {
  background: #059669;
}

.delete-btn {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.delete-btn:hover {
  background: var(--error);
  color: white;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .stat-card {
    padding: 12px;
    gap: 10px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .book-item {
    flex-wrap: wrap;
  }
  
  .book-info {
    flex: 1 1 calc(100% - 76px);
  }
  
  .book-status,
  .book-actions {
    margin-left: 76px;
  }
}
</style>
