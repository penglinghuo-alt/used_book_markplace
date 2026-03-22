import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  async function login(credentials) {
    const res = await userApi.login(credentials)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  async function register(data) {
    const res = await userApi.register(data)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  async function fetchProfile() {
    if (!token.value) return
    const res = await userApi.getProfile()
    user.value = res.user
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  async function updateProfile(data) {
    const res = await userApi.updateProfile(data)
    user.value = res.user
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    updateProfile,
    logout
  }
})
