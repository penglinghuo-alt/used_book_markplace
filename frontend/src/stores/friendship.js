import { defineStore } from 'pinia'
import { ref } from 'vue'
import { friendshipApi } from '@/api'

export const useFriendshipStore = defineStore('friendship', () => {
  const pendingCount = ref(0)

  async function fetchPendingCount() {
    try {
      const res = await friendshipApi.getPendingCount()
      pendingCount.value = res.count || 0
    } catch (e) {
      console.error('获取好友申请数量失败', e)
    }
  }

  async function sendRequest(friendId, message) {
    await friendshipApi.sendRequest(friendId, message)
    await fetchPendingCount()
  }

  async function acceptRequest(friendId) {
    await friendshipApi.acceptRequest(friendId)
    await fetchPendingCount()
  }

  async function rejectRequest(friendId) {
    await friendshipApi.rejectRequest(friendId)
    await fetchPendingCount()
  }

  return {
    pendingCount,
    fetchPendingCount,
    sendRequest,
    acceptRequest,
    rejectRequest
  }
})
