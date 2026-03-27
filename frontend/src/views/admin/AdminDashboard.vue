<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/api'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const activeTab = ref('stats')
const loading = ref(false)

const stats = ref({
  users: 0,
  activeBooks: 0,
  soldBooks: 0,
  pendingFeedbacks: 0
})

const books = ref([])
const users = ref([])
const feedbacks = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const searchQuery = ref('')
const filterStatus = ref('')
const selectedFeedback = ref(null)
const replyContent = ref('')

onMounted(() => {
  if (!adminStore.isLoggedIn()) {
    router.push('/admin/login')
    return
  }
  fetchStats()
  fetchData()
})

async function fetchStats() {
  try {
    stats.value = await adminApi.getStats()
  } catch (e) {
    console.error('获取统计失败', e)
  }
}

async function fetchData() {
  loading.value = true
  try {
    if (activeTab.value === 'books') {
      const data = await adminApi.getBooks({ 
        page: pagination.value.page, 
        limit: pagination.value.limit,
        search: searchQuery.value,
        status: filterStatus.value
      })
      books.value = data.books
      pagination.value = data.pagination
    } else if (activeTab.value === 'users') {
      const data = await adminApi.getUsers({ 
        page: pagination.value.page, 
        limit: pagination.value.limit,
        search: searchQuery.value
      })
      users.value = data.users
      pagination.value = data.pagination
    } else if (activeTab.value === 'feedbacks') {
      const data = await adminApi.getFeedbacks({ 
        page: pagination.value.page, 
        limit: pagination.value.limit,
        status: filterStatus.value
      })
      feedbacks.value = data.feedbacks
      pagination.value = data.pagination
    }
  } catch (e) {
    console.error('获取数据失败', e)
  } finally {
    loading.value = false
  }
}

function handleTabChange(tab) {
  activeTab.value = tab
  pagination.value.page = 1
  searchQuery.value = ''
  filterStatus.value = ''
  fetchData()
}

function handleSearch() {
  pagination.value.page = 1
  fetchData()
}

function handlePageChange(page) {
  pagination.value.page = page
  fetchData()
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

function getLogTypeLabel(type) {
  const labels = {
    error: '错误',
    client: '客户端',
    performance: '性能',
    network: '网络',
    other: '其他'
  }
  return labels[type] || type
}

function getStatusLabel(status) {
  const labels = {
    pending: '待处理',
    replied: '已回复',
    resolved: '已解决',
    closed: '已关闭'
  }
  return labels[status] || status
}

function getBookStatusLabel(status) {
  return status === 'active' ? '挂售中' : '已售出'
}

function getCategoryLabel(cat) {
  const labels = {
    teaching: '教辅',
    textbook: '课本',
    notebook: '笔记本',
    other: '其他'
  }
  return labels[cat] || cat
}

async function handleDeleteBook(book) {
  if (!confirm(`确定删除书籍「${book.title}」吗？`)) return
  try {
    await adminApi.deleteBook(book.id)
    fetchData()
    fetchStats()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

async function handleDeleteUser(user) {
  if (!confirm(`确定删除用户「${user.username}」吗？`)) return
  try {
    await adminApi.deleteUser(user.id)
    fetchData()
    fetchStats()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

function openFeedbackDetail(feedback) {
  selectedFeedback.value = feedback
  replyContent.value = ''
}

function closeFeedbackDetail() {
  selectedFeedback.value = null
  replyContent.value = ''
}

async function handleReplyFeedback() {
  if (!replyContent.value.trim()) {
    alert('请输入回复内容')
    return
  }
  try {
    await adminApi.replyFeedback(selectedFeedback.value.id, {
      reply: replyContent.value,
      status: 'replied'
    })
    closeFeedbackDetail()
    fetchData()
    fetchStats()
  } catch (e) {
    alert(e.message || '回复失败')
  }
}

function handleLogout() {
  adminStore.clearToken()
  router.push('/admin/login')
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.totalPages) return
  handlePageChange(page)
}

function getRowNumber(index) {
  return (pagination.value.page - 1) * pagination.value.limit + index + 1
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <div class="header-content">
        <h1>二手书市管理系统</h1>
        <div class="header-right">
          <span class="admin-name">{{ adminStore.adminName }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </div>
    </header>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ stats.users }}</span>
        <span class="stat-label">用户</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.activeBooks }}</span>
        <span class="stat-label">挂售中</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.soldBooks }}</span>
        <span class="stat-label">已售出</span>
      </div>
      <div class="stat-item highlight">
        <span class="stat-value">{{ stats.pendingFeedbacks }}</span>
        <span class="stat-label">待处理反馈</span>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'books' }"
        @click="handleTabChange('books')"
      >书籍管理</button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'users' }"
        @click="handleTabChange('users')"
      >用户管理</button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'feedbacks' }"
        @click="handleTabChange('feedbacks')"
      >反馈日志</button>
    </div>

    <div class="content">
      <div v-if="activeTab === 'books'" class="panel">
        <div class="panel-header">
          <div class="search-bar">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索书名/作者/卖家..."
              @keyup.enter="handleSearch"
            />
            <select v-model="filterStatus" @change="handleSearch">
              <option value="">全部状态</option>
              <option value="active">挂售中</option>
              <option value="sold">已售出</option>
            </select>
            <button class="search-btn" @click="handleSearch">搜索</button>
          </div>
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="books.length === 0" class="empty">暂无数据</div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>书名</th>
                <th>作者</th>
                <th>价格</th>
                <th>分类</th>
                <th>卖家</th>
                <th>状态</th>
                <th>排序值</th>
                <th>发布时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(book, index) in books" :key="book.id">
                <td>{{ getRowNumber(index) }}</td>
                <td class="title-cell">{{ book.title }}</td>
                <td>{{ book.author }}</td>
                <td>¥{{ Number(book.price).toFixed(2) }}</td>
                <td>{{ getCategoryLabel(book.category) }}</td>
                <td>{{ book.seller_name }}</td>
                <td>
                  <span class="status-badge" :class="book.status">
                    {{ getBookStatusLabel(book.status) }}
                  </span>
                </td>
                <td>{{ book.sort_order }}</td>
                <td>{{ formatDate(book.created_at) }}</td>
                <td>
                  <button class="delete-btn" @click="handleDeleteBook(book)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'users'" class="panel">
        <div class="panel-header">
          <div class="search-bar">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索用户名/手机号..."
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">搜索</button>
          </div>
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="users.length === 0" class="empty">暂无数据</div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>手机号</th>
                <th>微信</th>
                <th>个性签名</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.phone || '-' }}</td>
                <td>{{ user.wechat_id || '-' }}</td>
                <td class="bio-cell">{{ user.bio || '-' }}</td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <button class="delete-btn" @click="handleDeleteUser(user)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'feedbacks'" class="panel">
        <div class="panel-header">
          <div class="search-bar">
            <select v-model="filterStatus" @change="handleSearch">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="replied">已回复</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
            <button class="search-btn" @click="handleSearch">筛选</button>
          </div>
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="feedbacks.length === 0" class="empty">暂无数据</div>
        <div v-else class="feedback-list">
          <div 
            v-for="fb in feedbacks" 
            :key="fb.id" 
            class="feedback-item"
            @click="openFeedbackDetail(fb)"
          >
            <div class="feedback-header">
              <span class="feedback-type">{{ getLogTypeLabel(fb.log_type) }}</span>
              <span class="feedback-status" :class="fb.status">{{ getStatusLabel(fb.status) }}</span>
              <span class="feedback-user">{{ fb.username }}</span>
              <span class="feedback-time">{{ formatDate(fb.created_at) }}</span>
            </div>
            <div class="feedback-desc">{{ fb.description || '无描述' }}</div>
            <div v-if="fb.admin_reply" class="feedback-reply">
              <strong>回复：</strong>{{ fb.admin_reply }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="page-btn" 
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >上一页</button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button 
          class="page-btn" 
          :disabled="pagination.page >= pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >下一页</button>
      </div>
    </div>

    <div v-if="selectedFeedback" class="modal" @click.self="closeFeedbackDetail">
      <div class="modal-content">
        <div class="modal-header">
          <h3>反馈详情</h3>
          <button class="close-btn" @click="closeFeedbackDetail">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <label>用户：</label>
            <span>{{ selectedFeedback.username }}</span>
          </div>
          <div class="detail-row">
            <label>类型：</label>
            <span>{{ getLogTypeLabel(selectedFeedback.log_type) }}</span>
          </div>
          <div class="detail-row">
            <label>时间：</label>
            <span>{{ formatDate(selectedFeedback.created_at) }}</span>
          </div>
          <div class="detail-row">
            <label>状态：</label>
            <span>{{ getStatusLabel(selectedFeedback.status) }}</span>
          </div>
          <div class="detail-row">
            <label>描述：</label>
            <span>{{ selectedFeedback.description || '无' }}</span>
          </div>
          <div class="detail-row full">
            <label>日志内容：</label>
            <pre class="log-content">{{ selectedFeedback.content }}</pre>
          </div>
          <div v-if="selectedFeedback.admin_reply" class="detail-row full">
            <label>管理员回复：</label>
            <pre class="reply-content">{{ selectedFeedback.admin_reply }}</pre>
          </div>
          <div class="reply-form">
            <label>回复内容：</label>
            <textarea 
              v-model="replyContent" 
              rows="4" 
              placeholder="输入回复内容..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeFeedbackDetail">取消</button>
          <button class="submit-btn" @click="handleReplyFeedback">提交回复</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.admin-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 16px 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-name {
  color: var(--primary);
  font-weight: 600;
}

.logout-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.logout-btn:hover {
  background: var(--border);
}

.stats-bar {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  background: var(--bg-card);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-item.highlight .stat-value {
  color: #ef4444;
}

.tabs {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: var(--primary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

.content {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.panel {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
}

.panel-header {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 12px;
}

.search-bar input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.search-bar select {
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.search-btn {
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.data-table {
  overflow-x: auto;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.title-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bio-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.sold {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.delete-btn {
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.feedback-item:hover {
  background: var(--border);
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.feedback-type {
  padding: 2px 8px;
  background: var(--primary);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
}

.feedback-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.feedback-status.pending {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.feedback-status.replied {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.feedback-status.resolved {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.feedback-user {
  font-weight: 600;
  color: var(--text-primary);
}

.feedback-time {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.feedback-desc {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.feedback-reply {
  margin-top: 8px;
  padding: 8px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
}

.modal {
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
}

.modal-content {
  background: var(--bg-card);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.detail-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-row.full {
  flex-direction: column;
}

.detail-row label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}

.log-content {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.reply-content {
  background: rgba(34, 197, 94, 0.1);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  white-space: pre-wrap;
}

.reply-form {
  margin-top: 20px;
}

.reply-form label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
}

.reply-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.cancel-btn {
  padding: 10px 24px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.submit-btn {
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
