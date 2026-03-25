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
      <div class="hero-decoration">
        <div class="deco-book float-gentle">📚</div>
        <div class="deco-book float-gentle" style="animation-delay: 0.5s">📖</div>
      </div>
      <div class="hero-content">
        <div class="hero-top">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="text-gradient-animate">发现好书</span>
            </h1>
            <p class="hero-subtitle">在这里找到你想要的二手书籍</p>
          </div>
          <div class="quick-stats">
            <div class="quick-stat">
              <span class="stat-icon">📚</span>
              <span class="stat-num">{{ stats.bookCount || books.length }}+</span>
            </div>
            <div class="quick-stat">
              <span class="stat-icon">👥</span>
              <span class="stat-num">{{ stats.userCount || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="search-box glass neon-border">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索书名或作者..."
            class="search-input"
          />
          <span v-if="searchQuery" class="clear-search" @click="searchQuery = ''">×</span>
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
    </div>

    <div class="market-content">
      <div class="container">
        <div class="filter-indicator" :class="{ 'has-filter': selectedCategory !== 'all' || searchQuery }">
          <span v-if="selectedCategory !== 'all'" class="filter-tag">
            {{ getCategoryLabel(selectedCategory) }}
            <span class="filter-remove" @click="selectedCategory = 'all'">×</span>
          </span>
          <span v-if="searchQuery" class="filter-tag">
            搜索: "{{ searchQuery }}"
            <span class="filter-remove" @click="searchQuery = ''">×</span>
          </span>
          <span class="result-count" v-if="filteredBooks.length > 0">
            共 {{ filteredBooks.length }} 本书籍
          </span>
        </div>

        <div class="books-section">
          <h2 class="section-title" v-if="filteredBooks.length > 0">
            <span class="title-icon">🔥</span>
            <span v-if="selectedCategory === 'all' && !searchQuery">最新上架</span>
            <span v-else-if="searchQuery">搜索结果</span>
            <span v-else>{{ getCategoryLabel(selectedCategory) }}书籍</span>
          </h2>

          <div v-if="loading && books.length === 0" class="loading-state">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-else-if="filteredBooks.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>暂无书籍</h3>
            <p v-if="searchQuery || selectedCategory !== 'all'">没有找到符合条件的书籍</p>
            <p v-else>还没有人发布书籍，成为第一个卖家吧！</p>
            <router-link v-if="userStore.isLoggedIn && selectedCategory === 'all' && !searchQuery" to="/seller/publish" class="empty-action">
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
  position: relative;
  z-index: 1;
}

.market-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradient-flow 8s ease infinite;
  padding: 40px 20px 30px;
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
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.hero-text {
  text-align: left;
}

.hero-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-size: 1rem;
  color: rgba(255,255,255,0.85);
}

.quick-stats {
  display: flex;
  gap: 16px;
}

.quick-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.2);
}

.quick-stat .stat-icon {
  font-size: 16px;
}

.quick-stat .stat-num {
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.search-box {
  max-width: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 50px;
  padding: 6px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  transition: all var(--transition);
  border: 1px solid rgba(255,255,255,0.2);
  margin-bottom: 16px;
}

.search-box:focus-within {
  transform: scale(1.01);
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.25);
  background: rgba(255, 255, 255, 0.2);
}

.search-icon {
  font-size: 18px;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  padding: 10px 0;
  background: transparent;
  color: white;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.6);
}

.clear-search {
  font-size: 20px;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  padding: 0 6px;
  transition: color 0.2s;
}

.clear-search:hover {
  color: white;
}

.category-filter {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 6px 18px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  color: white;
  font-weight: 500;
  font-size: 14px;
  transition: all var(--transition);
  border: 1px solid rgba(255,255,255,0.15);
}

.category-btn:hover {
  background: rgba(255,255,255,0.2);
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
  top: 30px;
  right: 5%;
  display: flex;
  gap: 20px;
  opacity: 0.12;
}

.deco-book {
  font-size: 60px;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.2));
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-15px) rotate(5deg); }
  75% { transform: translateY(-8px) rotate(-5deg); }
}

.market-content {
  padding: 24px 0;
  margin-top: -10px;
}

.filter-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius);
  margin-bottom: 20px;
  border: 1px solid var(--border);
  min-height: 48px;
  transition: all 0.3s ease;
}

.filter-indicator.has-filter {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(245, 158, 11, 0.05));
  border-color: var(--primary-light);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--primary);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  animation: bounce-in 0.3s ease;
}

.filter-remove {
  cursor: pointer;
  font-size: 16px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.filter-remove:hover {
  opacity: 1;
}

.result-count {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 13px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.title-icon {
  font-size: 22px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
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
  transform: translateY(-10px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(79, 70, 229, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1);
}

.dark .book-card:hover {
  box-shadow: 
    0 20px 40px rgba(79, 70, 229, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.3);
}

.book-card:hover .book-cover {
  transform: scale(1.08);
}

.book-cover {
  position: relative;
  height: 160px;
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
  height: 50px;
  background: linear-gradient(to top, rgba(0,0,0,0.1), transparent);
}

.book-placeholder {
  width: 80px;
  height: 100px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 36px;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--primary);
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.book-price {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--primary);
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
}

.book-info {
  padding: 12px;
}

.book-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.seller-name {
  display: flex;
  align-items: center;
  gap: 3px;
}

.avatar-mini {
  font-size: 12px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-secondary);
}

.no-more {
  text-align: center;
  padding: 20px;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

.loading-spinner.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .market-hero {
    padding: 30px 16px 24px;
  }
  
  .hero-top {
    flex-direction: column;
    gap: 12px;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .quick-stats {
    align-self: flex-start;
  }
  
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  
  .hero-decoration {
    display: none;
  }
}
</style>
