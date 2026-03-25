<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { bookApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

const router = useRouter()
const userStore = useUserStore()

const books = ref([])
const stats = ref({ userCount: 0, bookCount: 0 })
const loading = ref(false)
const refreshing = ref(false)
const page = ref(1)
const hasMore = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedCategory = ref('all')

const categories = [
  { value: 'all', label: '全部' },
  { value: 'teaching', label: '教辅' },
  { value: 'textbook', label: '课本' },
  { value: 'notebook', label: '笔记本' },
  { value: 'other', label: '其他' }
]

const filteredBooks = computed(() => {
  let result = books.value
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(book => book.category === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    )
  }
  
  return result
})

async function fetchBooks(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  if (!hasMore.value) return

  loading.value = true
  try {
    const res = await bookApi.getBooks({ page: page.value, limit: 20 })
    const booksData = res?.books || res?.data?.books || []
    if (reset) {
      books.value = booksData
    } else {
      books.value = [...books.value, ...booksData]
    }
    hasMore.value = booksData.length === 20
    page.value++
  } catch (error) {
    console.error('获取书籍失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function handleScroll(e) {
  const { scrollTop, scrollHeight, clientHeight } = e.target.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    fetchBooks()
  }
}

function goToDetail(book) {
  router.push(`/market/book/${book.id}`)
}

function formatPrice(price) {
  return Number(price).toFixed(2)
}

function formatTime(time) {
  return dayjs(time).fromNow()
}

function getCategoryLabel(category) {
  const cat = categories.find(c => c.value === category)
  return cat ? cat.label : ''
}

async function fetchStats() {
  try {
    const res = await userApi.getStats()
    stats.value = res
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

onMounted(() => {
  fetchBooks(true)
  fetchStats()
  window.addEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="market-page">
    <div class="market-hero">
      <div class="hero-bg-animation"></div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="text-gradient-animate">发现好书</span>
        </h1>
        <p class="hero-subtitle">在这里找到你想要的二手书籍</p>
        <div class="search-box glass neon-border">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索书名或作者..."
            class="search-input"
          />
        </div>
        <div class="category-filter">
          <button 
            v-for="cat in categories" 
            :key="cat.value"
            class="category-btn ripple"
            :class="{ active: selectedCategory === cat.value }"
            @click="selectedCategory = cat.value"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="deco-book float-gentle">📚</div>
        <div class="deco-book float-gentle" style="animation-delay: 0.5s">📖</div>
        <div class="deco-book float-gentle" style="animation-delay: 1s">📕</div>
      </div>
    </div>

    <div class="market-content">
      <div class="container">
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-value">{{ stats.bookCount || books.length }}+</span>
            <span class="stat-label">在售书籍</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👥</span>
            <span class="stat-value">{{ stats.userCount || 0 }}</span>
            <span class="stat-label">注册用户</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">✨</span>
            <span class="stat-value">优质</span>
            <span class="stat-label">精选好书</span>
          </div>
        </div>

        <div class="books-section">
          <h2 class="section-title">
            <span class="title-icon">🔥</span>
            最新上架
          </h2>

          <div v-if="loading && books.length === 0" class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-else-if="filteredBooks.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>暂无书籍</h3>
            <p>还没有人发布书籍，成为第一个卖家吧！</p>
            <router-link v-if="userStore.isLoggedIn" to="/seller/publish" class="empty-action">
              立即发布
            </router-link>
          </div>

          <div v-else class="books-grid">
            <div 
              v-for="book in filteredBooks" 
              :key="book.id"
              class="book-card"
              @click="goToDetail(book)"
            >
              <div class="book-cover">
                <img v-if="book.image_url" :src="book.image_url" :alt="book.title" class="book-image" />
                <div v-else class="book-placeholder">
                  <span class="book-emoji">📖</span>
                </div>
                <span v-if="book.category && book.category !== 'other'" class="category-tag">
                  {{ getCategoryLabel(book.category) }}
                </span>
                <div class="book-price">¥{{ formatPrice(book.price) }}</div>
              </div>
              <div class="book-info">
                <h3 class="book-title">{{ book.title }}</h3>
                <p class="book-author">{{ book.author }}</p>
                <div class="book-meta">
                  <span class="seller-name">
                    <span class="avatar-mini">👤</span>
                    {{ book.seller_name || '匿名用户' }}
                  </span>
                  <span class="post-time">{{ formatTime(book.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loading && books.length > 0" class="loading-more">
            <div class="loading-spinner small"></div>
            <span>加载更多...</span>
          </div>

          <div v-if="!hasMore && books.length > 0" class="no-more">
            — 没有更多了 —
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-page {
  min-height: 100vh;
}

.market-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradient-flow 8s ease infinite;
  padding: 80px 20px;
  position: relative;
  overflow: hidden;
}

.hero-bg-animation {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(240, 147, 251, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(118, 75, 162, 0.3) 0%, transparent 40%);
  animation: pulse-glow 4s ease-in-out infinite;
}

.dark .market-hero {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 50%, #3d2a5c 100%);
  background-size: 200% 200%;
  animation: gradient-flow 8s ease infinite;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 12px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255,255,255,0.9);
  margin-bottom: 32px;
}

.search-box {
  max-width: 560px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 60px;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  transition: all var(--transition);
  border: 1px solid rgba(255,255,255,0.2);
}

.search-box:focus-within {
  transform: scale(1.02);
  box-shadow: 0 15px 50px rgba(79, 70, 229, 0.3);
  background: rgba(255, 255, 255, 0.25);
}

.search-icon {
  font-size: 20px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 12px 0;
  background: transparent;
}

.dark .search-input {
  color: var(--text-primary);
}

.search-input::placeholder {
  color: #9ca3af;
}

.category-filter {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  color: white;
  font-weight: 500;
  transition: all var(--transition);
  border: 1px solid rgba(255,255,255,0.2);
}

.category-btn:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-2px);
}

.category-btn.active {
  background: white;
  color: var(--primary);
  border-color: white;
  box-shadow: 0 4px 15px rgba(255,255,255,0.3);
}

.hero-decoration {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 8%;
  display: flex;
  gap: 30px;
  opacity: 0.15;
}

.deco-book {
  font-size: 100px;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
}

.deco-book:nth-child(2) {
  animation-delay: 0.5s;
}

.deco-book:nth-child(3) {
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(5deg); }
  75% { transform: translateY(-10px) rotate(-5deg); }
}

.market-content {
  padding: 40px 0;
  margin-top: -20px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.stat-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all var(--transition);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transition: left 0.5s ease;
}

.stat-item:hover::before {
  left: 0;
}

.stat-item:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.title-icon {
  font-size: 28px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all var(--transition);
}

.empty-action:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 28px;
}

.book-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid var(--border);
  position: relative;
}

.book-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  padding: 2px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.book-card:hover::before {
  opacity: 1;
}

.book-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(79, 70, 229, 0.15),
    0 10px 20px rgba(0, 0, 0, 0.1);
}

.dark .book-card:hover {
  box-shadow: 
    0 25px 50px rgba(79, 70, 229, 0.25),
    0 10px 20px rgba(0, 0, 0, 0.3);
}

.book-card:hover .book-cover {
  transform: scale(1.08);
}

.book-cover {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease;
  overflow: hidden;
}

.dark .book-cover {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
}

.book-cover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(0,0,0,0.1), transparent);
}

.book-placeholder {
  width: 100px;
  height: 130px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 50px;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--primary);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.book-price {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: var(--primary);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
}

.book-info {
  padding: 16px;
}

.book-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.seller-name {
  display: flex;
  align-items: center;
  gap: 4px;
}

.avatar-mini {
  font-size: 14px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--text-secondary);
}

.no-more {
  text-align: center;
  padding: 24px;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .stats-bar {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .stat-item {
    padding: 16px 8px;
  }
  
  .stat-icon {
    font-size: 24px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .book-cover {
    height: 160px;
  }
}
</style>
