import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    } else {
      const token = localStorage.getItem('token')
      if (token && token !== 'demo_token') {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => {
    const res = response.data
    if (res.success === true) {
      return res.data
    }
    return Promise.reject(res)
  },
  error => {
    if (error.response?.status === 401) {
      if (localStorage.getItem('adminToken')) {
        localStorage.removeItem('adminToken')
        window.location.href = '/admin/login'
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    const res = error.response?.data
    return Promise.reject({
      message: res?.message || '请求失败',
      response: error.response
    })
  }
)

export default api
