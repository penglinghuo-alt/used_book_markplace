import api from './request'

export const userApi = {
  register(data) {
    return api.post('/users/register', data)
  },
  login(data) {
    return api.post('/users/login', data)
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
  updateBook(id, data) {
    return api.put(`/books/${id}`, data)
  },
  updateBookStatus(id, status) {
    return api.patch(`/books/${id}/status`, { status })
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
