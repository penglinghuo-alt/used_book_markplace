import { defineStore } from 'pinia'
import { ref } from 'vue'
import { messageApi } from '@/api'

let fetchPromise = null

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)
  let lastFetchTime = 0
  const CACHE_DURATION = 5000

  async function fetchUnreadCount(force = false) {
    const now = Date.now()
    if (!force && now - lastFetchTime < CACHE_DURATION && unreadCount.value > 0) {
      return
    }
    
    if (fetchPromise) {
      return fetchPromise
    }
    
    fetchPromise = messageApi.getUnreadCount()
      .then(res => {
        unreadCount.value = res.unreadCount || 0
        lastFetchTime = now
      })
      .catch(e => {
        console.error('获取未读消息数失败', e)
      })
      .finally(() => {
        fetchPromise = null
      })
    
    return fetchPromise
  }

  async function markAsRead(partnerId) {
    try {
      await messageApi.markAsRead(partnerId)
      await fetchUnreadCount()
    } catch (e) {
      console.error('标记已读失败', e)
    }
  }

  function clearUnread() {
    unreadCount.value = 0
  }

  return {
    unreadCount,
    fetchUnreadCount,
    markAsRead,
    clearUnread
  }
})
