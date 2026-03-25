import api from './request'

export const userApi = {
  register(data) {
    return api.post('/users/register', data)
  },
  login(data) {
    return api.post('/users/login', data)
  },
  getCaptcha() {
    return api.get('/users/captcha')
  },
  verifyCaptcha(token, input) {
    return api.post('/users/verify-captcha', { token, userInput: input })
  },
  getStats() {
    return api.get('/users/stats')
  },
  sendSms(phone) {
    return api.post('/users/send-sms', { phone })
  },
  verifySms(phone, code) {
    return api.post('/users/verify-sms', { phone, code })
  },
  resetPassword(phone, code, newPassword) {
    return api.post('/users/reset-password', { phone, code, newPassword })
  },
  findByPhone(phone) {
    return api.get('/users/find-by-phone', { params: { phone } })
  },
  bindPhone(phone, smsCode) {
    return api.post('/users/me/phone', { phone, smsCode })
  },
  getProfile() {
    return api.get('/users/me')
  },
  updateProfile(data) {
    return api.put('/users/me', data)
  },
  updatePassword(data) {
    return api.put('/users/me/password', data)
  },
  uploadAvatar(formData) {
    return api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getUserList() {
    return api.get('/users')
  },
  getUserById(id) {
    return api.get(`/users/${id}`)
  },
  getUsersForSelection() {
    return api.get('/users/selection')
  }
}

export const bookApi = {
  getBooks(params) {
    return api.get('/books', { params })
  },
  getBookById(id) {
    return api.get(`/books/${id}`)
  },
  getMyBooks() {
    return api.get('/books/my')
  },
  getSellerBooks(sellerId) {
    return api.get(`/books/seller/${sellerId}`)
  },
  createBook(data) {
    return api.post('/books', data)
  },
  uploadBookImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/books/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateBook(id, data) {
    return api.put(`/books/${id}`, data)
  },
  updateBookStatus(id, status, buyerId = null) {
    return api.patch(`/books/${id}/status`, { status, buyer_id: buyerId })
  },
  deleteBook(id) {
    return api.delete(`/books/${id}`)
  }
}

export const messageApi = {
  sendMessage(data) {
    return api.post('/messages', data)
  },
  getConversations() {
    return api.get('/messages/conversations')
  },
  getConversation(userId) {
    return api.get(`/messages/conversation/${userId}`)
  },
  getBookMessages(bookId) {
    return api.get(`/messages/book/${bookId}`)
  },
  deleteMessage(id) {
    return api.delete(`/messages/${id}`)
  },
  getUnreadCount() {
    return api.get('/messages/unread-count')
  },
  markAsRead(partnerId) {
    return api.post(`/messages/conversation/${partnerId}/read`)
  }
}

export const transactionApi = {
  createTransaction(data) {
    return api.post('/transactions', data)
  },
  getMyTransactions() {
    return api.get('/transactions')
  },
  getTransactionStats() {
    return api.get('/transactions/stats')
  },
  getTransactionById(id) {
    return api.get(`/transactions/${id}`)
  },
  getBookTransactions(bookId) {
    return api.get(`/transactions/book/${bookId}`)
  }
}

export const friendshipApi = {
  sendRequest(friendId, message = '') {
    return api.post('/friendships', { friend_id: friendId, message })
  },
  getFriends() {
    return api.get('/friendships')
  },
  getPendingRequests() {
    return api.get('/friendships/requests')
  },
  getPendingCount() {
    return api.get('/friendships/requests/count')
  },
  acceptRequest(friendId) {
    return api.post(`/friendships/${friendId}/accept`)
  },
  rejectRequest(friendId) {
    return api.post(`/friendships/${friendId}/reject`)
  },
  checkStatus(friendId) {
    return api.get(`/friendships/${friendId}/status`)
  },
  deleteFriend(friendId) {
    return api.delete(`/friendships/${friendId}`)
  }
}

export const followApi = {
  follow(userId) {
    return api.post(`/follow/${userId}`)
  },
  unfollow(userId) {
    return api.delete(`/follow/${userId}`)
  },
  getFollowing() {
    return api.get('/follow/following')
  },
  getFollowers() {
    return api.get('/follow/followers')
  },
  getCounts(userId) {
    return api.get(`/follow/counts/${userId}`)
  },
  checkStatus(userId) {
    return api.get(`/follow/status/${userId}`)
  }
}

export const browseHistoryApi = {
  addRecord(bookId) {
    return api.post(`/browse-history/${bookId}`)
  },
  getHistory(limit = 50) {
    return api.get('/browse-history', { params: { limit } })
  },
  getCount() {
    return api.get('/browse-history/count')
  },
  clearHistory() {
    return api.delete('/browse-history')
  },
  deleteRecord(bookId) {
    return api.delete(`/browse-history/${bookId}`)
  }
}
