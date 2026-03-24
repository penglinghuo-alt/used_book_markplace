<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useMessageStore } from '@/stores/message'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const messageStore = useMessageStore()

const showNav = computed(() => {
  return route.meta.requiresAuth !== undefined || route.name === 'Market'
})

const navItems = [
  { path: '/market', name: 'market', icon: '📚', label: '市场' },
  { path: '/seller', name: 'seller', icon: '📖', label: '书架' },
  { path: '/messages', name: 'messages', icon: '💬', label: '消息' },
  { path: '/profile', name: 'profile', icon: '👤', label: '我的' }
]

const isActive = (path) => route.path.startsWith(path)

onMounted(() => {
  if (userStore.isLoggedIn) {
    messageStore.fetchUnreadCount()
    setInterval(() => {
      messageStore.fetchUnreadCount()
    }, 30000)
  }
})
</script>

<template>
  <div class="app-wrapper">
    <header class="app-header">
      <div class="header-content">
        <div class="logo" @click="router.push('/market')">
          <span class="logo-icon">📚</span>
          <span class="logo-text">二手书市</span>
        </div>
        
        <nav class="header-nav" v-if="userStore.isLoggedIn">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
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
          
          <template v-if="userStore.isLoggedIn">
            <router-link to="/seller/publish" class="publish-btn">
              <span>+</span>
              <span>发布</span>
            </router-link>
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

    <nav class="app-tabbar" v-if="showNav && userStore.isLoggedIn">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="tab-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="tab-icon">
          {{ item.icon }}
          <span v-if="item.name === 'messages' && messageStore.unreadCount > 0" class="unread-dot"></span>
        </span>
        <span class="tab-label">{{ item.label }}</span>
      </router-link>
    </nav>
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
</style>
