<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const book = ref(null)
const seller = ref(null)
const loading = ref(true)
const contacting = ref(false)

const isOwner = computed(() => {
  return userStore.user?.id === book.value?.seller_id
})

const formattedTime = computed(() => {
  if (!book.value?.created_at) return ''
  return dayjs(book.value.created_at).format('YYYY年MM月DD日 HH:mm')
})

async function fetchBookDetail() {
  try {
    const res = await bookApi.getBookById(route.params.id)
    book.value = res.book || res
    
    if (book.value.seller_id) {
      try {
        const sellerRes = await userApi.getUserById(book.value.seller_id)
        seller.value = sellerRes.user
      } catch (e) {
        console.error('获取卖家信息失败', e)
      }
    }
  } catch (error) {
    console.error('获取书籍详情失败:', error)
    router.back()
  } finally {
    loading.value = false
  }
}

async function contactSeller() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  
  contacting.value = true
  
  try {
    const otherId = book.value.seller_id
    router.push(`/messages/chat/${otherId}?bookId=${book.value.id}`)
  } finally {
    contacting.value = false
  }
}

async function markAsSold() {
  if (!confirm('确定要将此书籍标记为已售出吗？')) return
  
  try {
    await bookApi.updateBookStatus(book.value.id, 'sold')
    await fetchBookDetail()
  } catch (error) {
    console.error('标记失败:', error)
    alert('操作失败，请重试')
  }
}

async function deleteBook() {
  if (!confirm('确定要删除此书籍吗？')) return
  
  try {
    await bookApi.deleteBook(book.value.id)
    router.replace('/seller')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

onMounted(() => {
  fetchBookDetail()
})
</script>

<template>
  <div class="book-detail-page">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="book">
      <div class="detail-hero">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
          <span>返回</span>
        </button>
        <div class="hero-content">
          <div class="book-visual">
            <div class="book-cover-large">
              <span class="book-emoji">📖</span>
            </div>
            <div class="book-price-tag">
              <span class="currency">¥</span>
              <span class="price">{{ Number(book.price).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-content">
        <div class="container">
          <div class="detail-main">
            <div class="book-info-card">
              <h1 class="book-title">{{ book.title }}</h1>
              <p class="book-author">
                <span class="author-icon">✍️</span>
                {{ book.author }}
              </p>
              
              <div class="info-tags">
                <span class="tag" :class="book.status">
                  {{ book.status === 'active' ? '在售' : '已售' }}
                </span>
                <span class="tag time">
                  <span>🕐</span>
                  {{ formattedTime }}
                </span>
              </div>
            </div>

            <div class="description-card">
              <h3 class="card-title">
                <span class="title-icon">📝</span>
                书籍描述
              </h3>
              <p class="description-text">
                {{ book.description || '暂无描述' }}
              </p>
            </div>

            <div class="seller-card">
              <h3 class="card-title">
                <span class="title-icon">👤</span>
                卖家信息
              </h3>
              <div class="seller-info" v-if="seller">
                <div class="seller-avatar">
                  {{ seller.username?.charAt(0).toUpperCase() }}
                </div>
                <div class="seller-details">
                  <p class="seller-name">{{ seller.username }}</p>
                  <p class="seller-bio" v-if="seller.bio">{{ seller.bio }}</p>
                </div>
              </div>
              <div class="seller-info" v-else>
                <div class="seller-avatar">?</div>
                <div class="seller-details">
                  <p class="seller-name">加载中...</p>
                </div>
              </div>
              
              <div class="contact-section" v-if="seller?.wechat_id && !isOwner">
                <div class="wechat-info">
                  <span class="wechat-icon">💬</span>
                  <span>微信号：{{ seller.wechat_id }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <template v-if="!isOwner && book.status === 'active'">
              <button class="action-btn primary" @click="contactSeller" :disabled="contacting">
                <span v-if="contacting">跳转中...</span>
                <template v-else>
                  <span>💬</span>
                  <span>联系卖家</span>
                </template>
              </button>
            </template>
            
            <template v-if="isOwner">
              <button class="action-btn danger" @click="deleteBook">
                <span>🗑️</span>
                <span>删除</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.book-detail-page {
  min-height: 100vh;
  padding-bottom: 100px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
  color: var(--text-secondary);
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

.detail-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 80px;
  position: relative;
}

.dark .detail-hero {
  background: linear-gradient(135deg, #1e1e3f 0%, #2d1b4e 100%);
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: var(--radius);
  font-weight: 500;
  transition: all var(--transition);
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(255,255,255,0.3);
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

.book-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.book-cover-large {
  width: 180px;
  height: 240px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-2deg);
  transition: transform var(--transition);
}

.book-cover-large:hover {
  transform: rotate(0deg) scale(1.02);
}

.book-emoji {
  font-size: 80px;
}

.book-price-tag {
  margin-top: 20px;
  background: white;
  padding: 12px 24px;
  border-radius: 30px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.currency {
  font-size: 1.25rem;
  color: var(--error);
  font-weight: 600;
}

.price {
  font-size: 2rem;
  font-weight: 800;
  color: var(--error);
}

.detail-content {
  margin-top: -40px;
  position: relative;
  z-index: 10;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.book-info-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
}

.book-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.book-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.author-icon {
  font-size: 1.25rem;
}

.info-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag.active {
  background: #d1fae5;
  color: #065f46;
}

.dark .tag.active {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.tag.sold {
  background: #fee2e2;
  color: #991b1b;
}

.dark .tag.sold {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.tag.time {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.description-card,
.seller-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.title-icon {
  font-size: 1.25rem;
}

.description-text {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  white-space: pre-wrap;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.seller-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.seller-details {
  flex: 1;
}

.seller-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.seller-bio {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.contact-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.wechat-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: var(--radius);
  color: #0369a1;
  font-weight: 500;
}

.dark .wechat-info {
  background: rgba(3, 105, 161, 0.2);
  color: #38bdf8;
}

.wechat-icon {
  font-size: 1.25rem;
}

.detail-actions {
  margin-top: 30px;
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
}

.action-btn.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.action-btn.danger {
  background: var(--bg-secondary);
  color: var(--error);
  border: 1px solid var(--error);
}

.action-btn.danger:hover {
  background: var(--error);
  color: white;
}

@media (max-width: 768px) {
  .detail-hero {
    padding: 30px 16px 60px;
  }
  
  .book-cover-large {
    width: 140px;
    height: 190px;
  }
  
  .book-emoji {
    font-size: 60px;
  }
  
  .price {
    font-size: 1.5rem;
  }
  
  .book-title {
    font-size: 1.5rem;
  }
}
</style>
