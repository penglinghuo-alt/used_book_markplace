import { defineStore } from 'pinia'
import { ref } from 'vue'
import { friendshipApi } from '@/api'

let fetchPromise = null
let friendsCache = null
let friendsCacheTime = 0
const FRIENDS_CACHE_DURATION = 10000

let requestFetchPromise = null
let requestsCache = null
let requestsCacheTime = 0
const REQUESTS_CACHE_DURATION = 10000

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

  async function fetchFriends(force = false) {
    const now = Date.now()
    if (!force && friendsCache && now - friendsCacheTime < FRIENDS_CACHE_DURATION) {
      return friendsCache
    }
    
    if (fetchPromise) {
      return fetchPromise
    }
    
    fetchPromise = friendshipApi.getFriends()
      .then(res => {
        friendsCache = res.friends || []
        friendsCacheTime = now
        return friendsCache
      })
      .catch(e => {
        console.error('获取好友列表失败', e)
        return []
      })
      .finally(() => {
        fetchPromise = null
      })
    
    return fetchPromise
  }

  async function fetchRequests(force = false) {
    const now = Date.now()
    if (!force && requestsCache && now - requestsCacheTime < REQUESTS_CACHE_DURATION) {
      return requestsCache
    }
    
    if (requestFetchPromise) {
      return requestFetchPromise
    }
    
    requestFetchPromise = friendshipApi.getPendingRequests()
      .then(res => {
        requestsCache = res.requests || []
        requestsCacheTime = now
        return requestsCache
      })
      .catch(e => {
        console.error('获取好友申请列表失败', e)
        return []
      })
      .finally(() => {
        requestFetchPromise = null
      })
    
    return requestFetchPromise
  }

  function clearCache() {
    friendsCache = null
    friendsCacheTime = 0
    requestsCache = null
    requestsCacheTime = 0
  }

  async function sendRequest(friendId, message) {
    await friendshipApi.sendRequest(friendId, message)
    clearCache()
    await fetchPendingCount()
  }

  async function acceptRequest(friendId) {
    await friendshipApi.acceptRequest(friendId)
    clearCache()
    await fetchPendingCount()
  }

  async function rejectRequest(friendId) {
    await friendshipApi.rejectRequest(friendId)
    clearCache()
    await fetchPendingCount()
  }

  return {
    pendingCount,
    fetchPendingCount,
    fetchFriends,
    fetchRequests,
    clearCache,
    sendRequest,
    acceptRequest,
    rejectRequest
  }
})
