<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { transactionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()

const transactions = ref([])
const loading = ref(false)
const activeTab = ref('sold')

const filteredTransactions = computed(() => {
  const userId = userStore.user?.id
  return transactions.value.filter(t => {
    if (activeTab.value === 'sold') {
      return String(t.seller_id) === String(userId)
    } else {
      return String(t.buyer_id) === String(userId)
    }
  })
})

async function fetchTransactions() {
  loading.value = true
  try {
    const res = await transactionApi.getMyTransactions()
    transactions.value = res.transactions || res || []
  } catch (error) {
    console.error('获取交易记录失败:', error)
  } finally {
    loading.value = false
  }
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function goToMarket() {
  router.push('/market')
}

onMounted(() => {
  fetchTransactions()
})
</script>

<template>
  <div class="transactions-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">
          <span class="title-icon">📋</span>
          交易记录
        </h1>
      </div>
    </div>

    <div class="transactions-content">
      <div class="container">
        <div class="filter-tabs">
          <button 
            class="tab" 
            :class="{ active: activeTab === 'sold' }"
            @click="activeTab = 'sold'"
          >
            我卖出的
          </button>
          <button 
            class="tab" 
            :class="{ active: activeTab === 'bought' }"
            @click="activeTab = 'bought'"
          >
            我买到的
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
        </div>

        <div v-else-if="filteredTransactions.length === 0" class="empty-state">
          <div class="empty-icon">
            {{ activeTab === 'sold' ? '📦' : '🛍️' }}
          </div>
          <h3>
            {{ activeTab === 'sold' ? '暂无售出记录' : '暂无购入记录' }}
          </h3>
          <p>
            {{ activeTab === 'sold' ? '快去书架发布书籍吧' : '去市场逛逛发现好书' }}
          </p>
          <button class="empty-action" @click="goToMarket">
            浏览市场
          </button>
        </div>

        <div v-else class="transactions-list">
          <div 
            v-for="tx in filteredTransactions" 
            :key="tx.id"
            class="transaction-card"
          >
            <div class="tx-book">
              <div class="book-icon">📖</div>
              <div class="book-info">
                <h4 class="book-title">{{ tx.book_title || '书籍' }}</h4>
                <p class="book-author">{{ tx.book_author || '作者信息' }}</p>
              </div>
            </div>
            
            <div class="tx-info">
              <div class="tx-partner">
                <span class="label">{{ activeTab === 'sold' ? '买家' : '卖家' }}：</span>
                <span class="value">{{ activeTab === 'sold' ? tx.buyer_username : tx.seller_username }}</span>
              </div>
              <div class="tx-price" v-if="tx.book_price">
                <span class="label">价格：</span>
                <span class="value price">¥{{ Number(tx.book_price).toFixed(2) }}</span>
              </div>
              <div class="tx-time">
                <span class="label">时间：</span>
                <span class="value">{{ formatTime(tx.completed_at || tx.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transactions-page {
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
  color: var(--text-primary);
  transition: background var(--transition);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.title-icon {
  font-size: 1.5rem;
}

.transactions-content {
  padding: 24px 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: var(--bg-card);
  padding: 6px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.tab {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-sm);
  font-weight: 600;
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
  padding: 60px 20px;
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
  padding: 12px 32px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all var(--transition);
}

.empty-action:hover {
  background: var(--primary-dark);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.tx-book {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.book-icon {
  font-size: 40px;
}

.book-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.book-author {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.tx-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tx-partner,
.tx-price,
.tx-time {
  display: flex;
  font-size: 0.875rem;
}

.label {
  color: var(--text-tertiary);
  min-width: 50px;
}

.value {
  color: var(--text-primary);
}

.value.price {
  color: var(--primary);
  font-weight: 600;
}
</style>
