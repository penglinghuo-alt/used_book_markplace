import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/market'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/user/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/user/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('@/views/market/Market.vue'),
    meta: { title: '市场大厅' }
  },
  {
    path: '/market/book/:id',
    name: 'BookDetail',
    component: () => import('@/views/market/BookDetail.vue'),
    meta: { title: '书籍详情' }
  },
  {
    path: '/seller',
    name: 'Seller',
    component: () => import('@/views/seller/Seller.vue'),
    meta: { title: '我的书架', requiresAuth: true }
  },
  {
    path: '/seller/publish',
    name: 'Publish',
    component: () => import('@/views/seller/Publish.vue'),
    meta: { title: '发布书籍', requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/message/Messages.vue'),
    meta: { title: '消息', requiresAuth: true }
  },
  {
    path: '/messages/chat/:userId',
    name: 'Chat',
    component: () => import('@/views/message/Chat.vue'),
    meta: { title: '聊天', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('@/views/user/EditProfile.vue'),
    meta: { title: '编辑资料', requiresAuth: true }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('@/views/user/UserProfile.vue'),
    meta: { title: '查看资料' }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('@/views/user/Transactions.vue'),
    meta: { title: '交易记录', requiresAuth: true }
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('@/views/friends/Friends.vue'),
    meta: { title: '好友', requiresAuth: true }
  },
  {
    path: '/following',
    name: 'Following',
    component: () => import('@/views/user/Following.vue'),
    meta: { title: '我的关注', requiresAuth: true }
  },
  {
    path: '/followers',
    name: 'Followers',
    component: () => import('@/views/user/Followers.vue'),
    meta: { title: '我的粉丝', requiresAuth: true }
  },
  {
    path: '/browse-history',
    name: 'BrowseHistory',
    component: () => import('@/views/user/BrowseHistory.vue'),
    meta: { title: '浏览历史', requiresAuth: true }
  },
  {
    path: '/report-issue',
    name: 'ReportIssue',
    component: () => import('@/views/user/ReportIssue.vue'),
    meta: { title: '问题反馈', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} - 二手书市` : '二手书市'

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Market' })
  } else {
    next()
  }
})

export default router
