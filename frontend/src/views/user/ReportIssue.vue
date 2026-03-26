<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logApi } from '@/api'

const router = useRouter()

const logTypes = ref([])
const loading = ref(false)
const submitting = ref(false)
const success = ref(false)
const error = ref('')

const form = ref({
  logType: 'error',
  description: '',
  logContent: ''
})

onMounted(async () => {
  try {
    const types = await logApi.getLogTypes()
    logTypes.value = types.types
  } catch (e) {
    console.error('获取日志类型失败', e)
  }
})

function handleLogTypeChange(type) {
  form.value.logType = type
}

async function handleSubmit() {
  error.value = ''
  
  if (!form.value.logContent.trim()) {
    error.value = '请输入日志内容'
    return
  }
  
  if (form.value.logContent.length > 1024 * 1024) {
    error.value = '日志内容过大，请控制在1MB以内'
    return
  }

  submitting.value = true
  
  try {
    await logApi.uploadLog({
      logType: form.value.logType,
      description: form.value.description.trim(),
      logContent: form.value.logContent
    })
    
    success.value = true
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (e) {
    error.value = e.message || '上传失败，请重试'
  } finally {
    submitting.value = false
  }
}

function getSelectedTypeInfo() {
  return logTypes.value.find(t => t.value === form.value.logType) || {}
}
</script>

<template>
  <div class="report-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="router.back()">
          <span>←</span>
        </button>
        <h1 class="page-title">问题反馈</h1>
        <button 
          class="submit-btn" 
          @click="handleSubmit" 
          :disabled="submitting || !form.logContent.trim()"
        >
          {{ submitting ? '上传中...' : '提交' }}
        </button>
      </div>
    </div>

    <div class="report-content">
      <div class="container">
        <div class="intro-card">
          <h2 class="intro-title">遇到问题了？</h2>
          <p class="intro-text">
            如果你在使用过程中遇到了任何问题，如页面异常、功能失灵、数据错误等，
            可以在这里上传相关日志。我们会尽快处理您反馈的问题。
          </p>
        </div>

        <div class="form-card">
          <div v-if="success" class="success-alert">
            <span>✅</span>
            日志上传成功，我们会尽快处理！
          </div>

          <div v-if="error" class="error-alert">
            <span>⚠️</span>
            {{ error }}
          </div>

          <div class="form-group">
            <label class="form-label">问题类型</label>
            <div class="log-types">
              <button
                v-for="type in logTypes"
                :key="type.value"
                type="button"
                :class="['type-btn', { active: form.logType === type.value }]"
                @click="handleLogTypeChange(type.value)"
              >
                {{ type.label }}
              </button>
            </div>
            <p class="type-desc" v-if="getSelectedTypeInfo().description">
              {{ getSelectedTypeInfo().description }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              问题描述
              <span class="optional">（选填）</span>
            </label>
            <textarea
              v-model="form.description"
              class="form-textarea"
              placeholder="请简要描述您遇到的问题..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">
              日志内容
              <span class="required">*</span>
            </label>
            <textarea
              v-model="form.logContent"
              class="form-textarea log-content"
              placeholder="请粘贴日志内容或错误信息..."
              rows="10"
            ></textarea>
            <p class="char-count">
              {{ form.logContent.length }} / 1,048,576 字符
            </p>
          </div>

          <div class="tips-card">
            <h3 class="tips-title">如何获取日志？</h3>
            <ul class="tips-list">
              <li>打开浏览器开发者工具（按 F12）</li>
              <li>切换到 Console（控制台）标签</li>
              <li>如果有报错，复制完整的错误信息</li>
              <li>如果有网络请求失败，切换到 Network 标签查看</li>
              <li>粘贴相关内容到上方文本框</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-page {
  min-height: 100vh;
}

.page-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
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
  transition: background var(--transition);
}

.back-btn:hover {
  background: var(--bg-hover);
}

.page-title {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.submit-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 600;
  transition: all var(--transition);
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.report-content {
  padding: 24px 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.intro-card {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
  color: white;
}

.intro-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.intro-text {
  font-size: 0.9rem;
  opacity: 0.95;
  line-height: 1.6;
}

.form-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow);
}

.success-alert {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #d1fae5;
  border-radius: var(--radius);
  color: #065f46;
  margin-bottom: 20px;
  font-weight: 500;
}

.dark .success-alert {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius);
  color: var(--error);
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.required {
  color: var(--error);
}

.optional {
  font-weight: 400;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.log-types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-btn {
  padding: 8px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition);
  cursor: pointer;
}

.type-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.type-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  color: white;
}

.type-desc {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition);
  resize: vertical;
  font-family: monospace;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.log-content {
  min-height: 200px;
}

.char-count {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-align: right;
}

.tips-card {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 16px;
  margin-top: 20px;
}

.tips-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>