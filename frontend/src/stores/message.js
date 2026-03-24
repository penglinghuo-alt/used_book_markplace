import { defineStore } from 'pinia'
import { ref } from 'vue'
import { messageApi } from '@/api'

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    try {
      const res = await messageApi.getUnreadCount()
      unreadCount.value = res.unreadCount || 0
    } catch (e) {
      console.error('获取未读消息数失败', e)
    }
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
