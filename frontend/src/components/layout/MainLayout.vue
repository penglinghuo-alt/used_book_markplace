<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useMessageStore } from '@/stores/message'
import { useFriendshipStore } from '@/stores/friendship'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const messageStore = useMessageStore()
const friendshipStore = useFriendshipStore()

const appReady = ref(false)
const showTutorial = ref(false)
const tutorialStep = ref(0)

const isLoggedIn = computed(() => {
  return userStore.isLoggedIn
})

const showNav = computed(() => {
  return appReady.value && (route.meta.requiresAuth !== undefined || route.name === 'Market')
})

const navItems = [
  { path: '/market', name: 'market', icon: '📚', label: '市场', desc: '浏览和搜索二手书籍' },
  { path: '/seller', name: 'seller', icon: '📖', label: '书架', desc: '管理你发布的书籍' },
  { path: '/friends', name: 'friends', icon: '👥', label: '好友', desc: '添加和管理好友' },
  { path: '/messages', name: 'messages', icon: '💬', label: '消息', desc: '查看聊天消息' },
  { path: '/profile', name: 'profile', icon: '👤', label: '我的', desc: '个人资料设置' }
]

const tutorialSteps = [
  { target: '.logo', title: '欢迎来到二手书市', content: '这是我们的logo，点击可以返回首页' },
  { target: '.publish-btn', title: '发布书籍', content: '想要卖书？点击这里发布你的书籍' },
  { target: '[data-tutorial="market"]', title: '市场', content: '在这里浏览所有可购买的二手书籍' },
  { target: '[data-tutorial="seller"]', title: '书架', content: '在这里管理你发布的书籍，查看销售情况' },
  { target: '[data-tutorial="friends"]', title: '好友', content: '添加好友后可以方便地进行聊天' },
  { target: '[data-tutorial="messages"]', title: '消息', content: '与买家或卖家聊天的地方' },
  { target: '[data-tutorial="profile"]', title: '我的', content: '查看和修改你的个人资料' }
]

const isActive = (path) => route.path.startsWith(path)

onMounted(() => {
  setTimeout(() => {
    appReady.value = true
    if (isLoggedIn.value) {
      messageStore.fetchUnreadCount()
      friendshipStore.fetchPendingCount()
      setInterval(() => {
        messageStore.fetchUnreadCount()
      }, 30000)
    }
    
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
    if (!hasSeenTutorial) {
      showTutorial.value = true
    }
  }, 100)
})

const startTutorial = () => {
  tutorialStep.value = 0
  showTutorial.value = true
  localStorage.setItem('hasSeenTutorial', 'true')
  highlightStep()
}

const skipTutorial = () => {
  showTutorial.value = false
  localStorage.setItem('hasSeenTutorial', 'true')
  clearHighlights()
}

const nextStep = () => {
  if (tutorialStep.value < tutorialSteps.length - 1) {
    tutorialStep.value++
    highlightStep()
  } else {
    skipTutorial()
  }
}

const prevStep = () => {
  if (tutorialStep.value > 0) {
    tutorialStep.value--
    highlightStep()
  }
}

const highlightStep = () => {
  clearHighlights()
  const step = tutorialSteps[tutorialStep.value]
  if (!step) return
  
  const elements = document.querySelectorAll(step.target)
  if (elements.length > 0) {
    elements.forEach(el => el.classList.add('tutorial-highlight'))
  }
}

const clearHighlights = () => {
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight')
  })
}
</script>

<template>
  <div class="app-wrapper">
    <header class="app-header">
      <div class="header-content">
        <div class="logo" @click="router.push('/market')">
          <span class="logo-icon">📚</span>
          <span class="logo-text">二手书市</span>
        </div>
        
        <nav class="header-nav" v-if="isLoggedIn">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            :data-tutorial="item.name"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="header-actions">
          <button class="theme-toggle" @click="themeStore.toggleDark">
            <span v-if="themeStore.isDark">☀️</span>
            <span v-else>🌙</span>
          </button>
          
          <button class="theme-toggle fox-toggle" @click="themeStore.toggleFox">
            <span v-if="themeStore.isFox" style="color: #e65c00;">🦊</span>
            <span v-else>🦊</span>
          </button>
          
          <template v-if="isLoggedIn">
            <router-link to="/seller/publish" class="publish-btn" data-tutorial="publish">
              <span>+</span>
              <span>发布</span>
            </router-link>
            <button class="tutorial-btn" @click="startTutorial" title="查看新手教程">
              ❓
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="auth-btn">登录</router-link>
            <router-link to="/register" class="auth-btn primary">注册</router-link>
          </template>
        </div>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <nav class="app-tabbar" v-if="showNav && isLoggedIn">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="tab-item"
        :class="{ active: isActive(item.path) }"
        :data-tutorial="item.name"
      >
        <span class="tab-icon">
          {{ item.icon }}
          <span v-if="item.name === 'messages' && messageStore.unreadCount > 0" class="unread-dot"></span>
          <span v-if="item.name === 'friends' && friendshipStore.pendingCount > 0" class="unread-dot"></span>
        </span>
        <span class="tab-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="tutorial-overlay" v-if="showTutorial" @click="skipTutorial"></div>
    
    <div class="tutorial-popover" v-if="showTutorial && tutorialSteps[tutorialStep]">
      <div class="tutorial-card">
        <div class="tutorial-header">
          <h3>{{ tutorialSteps[tutorialStep].title }}</h3>
          <button class="tutorial-close" @click="skipTutorial">×</button>
        </div>
        <div class="tutorial-content">
          <p>{{ tutorialSteps[tutorialStep].content }}</p>
        </div>
        <div class="tutorial-footer">
          <div class="tutorial-progress">
            <span v-for="i in tutorialSteps.length" :key="i" 
              class="progress-dot" 
              :class="{ active: i - 1 <= tutorialStep }">
            </span>
          </div>
          <div class="tutorial-actions">
            <button class="tutorial-btn-skip" @click="skipTutorial">我是老手</button>
            <button class="tutorial-btn-prev" @click="prevStep" v-if="tutorialStep > 0">上一步</button>
            <button class="tutorial-btn-next" @click="nextStep">
              {{ tutorialStep === tutorialSteps.length - 1 ? '完成' : '下一步' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: saturate(180%) blur(20px);
  background: rgba(255, 255, 255, 0.85);
}

.dark .app-header {
  background: rgba(30, 41, 59, 0.85);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform var(--transition);
}

.logo:hover {
  transform: scale(1.02);
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition);
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.nav-icon {
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all var(--transition);
}

.theme-toggle:hover {
  background: var(--bg-hover);
  transform: rotate(15deg);
}

.fox-toggle {
  margin-left: 4px;
}

.publish-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 14px;
  transition: all var(--transition);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.publish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.auth-btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.auth-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.auth-btn.primary {
  background: var(--primary);
  color: white;
}

.auth-btn.primary:hover {
  background: var(--primary-dark);
}

.app-main {
  flex: 1;
  padding-bottom: 80px;
}

.app-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: var(--text-tertiary);
  transition: all var(--transition);
}

.tab-item.active {
  color: var(--primary);
}

.tab-item.active .tab-icon {
  transform: scale(1.1);
}

.tab-icon {
  font-size: 24px;
  transition: transform var(--transition);
  position: relative;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
}

.unread-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
  
  .logo-text {
    font-size: 18px;
  }
}

.tutorial-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all var(--transition);
  background: rgba(79, 70, 229, 0.1);
  border: none;
  cursor: pointer;
}

.tutorial-btn:hover {
  background: rgba(79, 70, 229, 0.2);
  transform: scale(1.1);
}

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  pointer-events: auto;
}

.tutorial-popover {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 90%;
  max-width: 400px;
}

.tutorial-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 2px solid var(--primary);
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
}

.tutorial-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.tutorial-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.tutorial-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tutorial-content {
  padding: 20px;
}

.tutorial-content p {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.tutorial-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tutorial-progress {
  display: flex;
  gap: 6px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  transition: all var(--transition);
}

.progress-dot.active {
  background: var(--primary);
  transform: scale(1.2);
}

.tutorial-actions {
  display: flex;
  gap: 10px;
}

.tutorial-btn-skip,
.tutorial-btn-prev,
.tutorial-btn-next {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  border: none;
}

.tutorial-btn-skip {
  background: transparent;
  color: var(--text-secondary);
}

.tutorial-btn-skip:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.tutorial-btn-prev {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tutorial-btn-prev:hover {
  background: var(--border);
}

.tutorial-btn-next {
  background: var(--primary);
  color: white;
}

.tutorial-btn-next:hover {
  background: var(--primary-dark);
}

:global(.tutorial-highlight) {
  position: relative;
  z-index: 9997;
  box-shadow: 0 0 0 4px var(--primary), 0 0 20px rgba(79, 70, 229, 0.5) !important;
  border-radius: var(--radius) !important;
}
</style>
