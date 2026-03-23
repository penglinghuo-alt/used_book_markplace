import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const themeName = ref(localStorage.getItem('themeName') || 'light')
  
  const isDark = computed(() => themeName.value === 'dark')
  const isFox = computed(() => themeName.value === 'fox')

  function setTheme(name) {
    themeName.value = name
    localStorage.setItem('themeName', name)
    
    document.documentElement.classList.remove('dark', 'fox')
    if (name !== 'light') {
      document.documentElement.classList.add(name)
    }
  }

  function toggleDark() {
    if (themeName.value === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  function toggleFox() {
    if (themeName.value === 'fox') {
      setTheme('light')
    } else {
      setTheme('fox')
    }
  }

  function initTheme() {
    if (themeName.value !== 'light') {
      document.documentElement.classList.add(themeName.value)
    }
  }

  return {
    themeName,
    isDark,
    isFox,
    setTheme,
    toggleDark,
    toggleFox,
    initTheme
  }
})