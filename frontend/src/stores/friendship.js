import { defineStore } from 'pinia'
import { ref } from 'vue'
import { friendshipApi } from '@/api'

let fetchPromise = null

export const useFriendshipStore = defineStore('friendship', () => {
  const pendingCount = ref(0)
  let lastFetchTime = 0
  const CACHE_DURATION = 5000

  async function fetchPendingCount(force = false) {
    const now = Date.now()
    if (!force && now - lastFetchTime < CACHE_DURATION && pendingCount.value >= 0) {
      return
    }
    
    if (fetchPromise) {
      return fetchPromise
    }
    
    fetchPromise = friendshipApi.getPendingCount()
      .then(res => {
        pendingCount.value = res.count || 0
        lastFetchTime = now
      })
      .catch(e => {
        console.error('获取好友申请数量失败', e)
      })
      .finally(() => {
        fetchPromise = null
      })
    
    return fetchPromise
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
