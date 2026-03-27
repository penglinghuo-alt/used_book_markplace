import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('adminToken') || '')
  const adminName = ref(localStorage.getItem('adminName') || '')
  const cardKeyId = ref(localStorage.getItem('cardKeyId') || '')

  function setToken(newToken, name, keyId) {
    token.value = newToken
    adminName.value = name
    cardKeyId.value = keyId
    localStorage.setItem('adminToken', newToken)
    localStorage.setItem('adminName', name)
    localStorage.setItem('cardKeyId', keyId)
  }

  function clearToken() {
    token.value = ''
    adminName.value = ''
    cardKeyId.value = ''
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminName')
    localStorage.removeItem('cardKeyId')
  }

  function isLoggedIn() {
    return !!token.value
  }

  return {
    token,
    adminName,
    cardKeyId,
    setToken,
    clearToken,
    isLoggedIn
  }
})
