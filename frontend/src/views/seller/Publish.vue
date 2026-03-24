<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { bookApi } from '@/api'

const router = useRouter()

const form = ref({
  title: '',
  author: '',
  price: '',
  description: '',
  imageUrl: ''
})

const imageFile = ref(null)
const imagePreview = ref('')
const uploadingImage = ref(false)
const loading = ref(false)
const errors = ref({})

function handleImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB')
    return
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    alert('只支持 JPG、PNG、GIF、WebP 格式的图片')
    return
  }
  
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

async function uploadImage() {
  if (!imageFile.value) return null
  
  uploadingImage.value = true
  try {
    const res = await bookApi.uploadBookImage(imageFile.value)
    return res.image_url
  } catch (e) {
    console.error('图片上传失败:', e)
    alert('图片上传失败，请重试')
    return null
  } finally {
    uploadingImage.value = false
  }
}

function validate() {
  errors.value = {}
  
  if (!form.value.title.trim()) {
    errors.value.title = '请输入书名'
  }
  if (!form.value.author.trim()) {
    errors.value.author = '请输入作者'
  }
  if (!form.value.price) {
    errors.value.price = '请输入价格'
  } else if (isNaN(Number(form.value.price)) || Number(form.value.price) <= 0) {
    errors.value.price = '请输入有效的价格'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  try {
    let imageUrl = form.value.imageUrl
    
    if (imageFile.value) {
      const uploaded = await uploadImage()
      if (!uploaded && imageFile.value) {
        loading.value = false
        return
      }
      imageUrl = uploaded
    }
    
    await bookApi.createBook({
      title: form.value.title.trim(),
      author: form.value.author.trim(),
      price: Number(form.value.price),
      description: form.value.description.trim(),
      image_url: imageUrl || null
    })
    alert('发布成功！')
    router.push('/seller')
  } catch (error) {
    console.error('发布失败:', error)
    alert(error.response?.data?.message || '发布失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="publish-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">
          <span class="title-icon">📚</span>
          发布书籍
        </h1>
      </div>
    </div>

    <div class="publish-content">
      <div class="container">
        <div class="publish-card">
          <div class="form-intro">
            <h2>发布二手书</h2>
            <p>填写书籍信息，让更多需要的人看到你的书</p>
          </div>

          <form @submit.prevent="handleSubmit" class="publish-form">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📖</span>
                书名
                <span class="required">*</span>
              </label>
              <input 
                v-model="form.title"
                type="text" 
                class="form-input"
                :class="{ error: errors.title }"
                placeholder="请输入书籍名称"
              />
              <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">✍️</span>
                作者
                <span class="required">*</span>
              </label>
              <input 
                v-model="form.author"
                type="text" 
                class="form-input"
                :class="{ error: errors.author }"
                placeholder="请输入作者姓名"
              />
              <span v-if="errors.author" class="error-text">{{ errors.author }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">💰</span>
                价格（元）
                <span class="required">*</span>
              </label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">¥</span>
                <input 
                  v-model="form.price"
                  type="number" 
                  step="0.01"
                  min="0"
                  class="form-input price-input"
                  :class="{ error: errors.price }"
                  placeholder="0.00"
                />
              </div>
              <span v-if="errors.price" class="error-text">{{ errors.price }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📷</span>
                书籍图片
              </label>
              <div class="image-upload-area">
                <div v-if="imagePreview" class="image-preview">
                  <img :src="imagePreview" alt="书籍图片预览" />
                  <button type="button" class="remove-image" @click="imageFile = null; imagePreview = ''">×</button>
                </div>
                <label v-else class="upload-placeholder">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    @change="handleImageChange"
                    hidden
                  />
                  <div class="upload-icon">📷</div>
                  <div class="upload-text">点击上传书籍图片</div>
                  <div class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 5MB</div>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📝</span>
                书籍描述
              </label>
              <textarea 
                v-model="form.description"
                class="form-textarea"
                placeholder="描述书籍的新旧程度、是否有笔记、购买渠道等信息..."
                rows="5"
              ></textarea>
            </div>

            <div class="form-tips">
              <h4>发布提示：</h4>
              <ul>
                <li>📚 书名和作者信息越准确，越容易找到买家</li>
                <li>💡 详细描述书籍情况（版本、新旧程度、笔记等）</li>
                <li>💰 价格参考市场价，设置合理更容易售出</li>
              </ul>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              <span v-else>📤</span>
              <span>{{ loading ? '发布中...' : '确认发布' }}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.publish-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 16px 0;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
  transition: all var(--transition);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.title-icon {
  font-size: 1.5rem;
}

.publish-content {
  padding: 24px 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.publish-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow);
}

.form-intro {
  text-align: center;
  margin-bottom: 32px;
}

.form-intro h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-intro p {
  color: var(--text-secondary);
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.label-icon {
  font-size: 1.125rem;
}

.required {
  color: var(--error);
}

.form-input,
.form-textarea {
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-input.error,
.form-textarea.error {
  border-color: var(--error);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.price-input-wrapper {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.price-input {
  padding-left: 36px;
}

.error-text {
  color: var(--error);
  font-size: 0.875rem;
}

.form-tips {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 16px;
}

.form-tips h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-tips ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-tips li {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  transition: all var(--transition);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.image-upload-area {
  width: 100%;
}

.image-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-secondary);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.8);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  background: var(--bg-secondary);
}

.upload-placeholder:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .publish-card {
    padding: 24px 20px;
  }
}
</style>
