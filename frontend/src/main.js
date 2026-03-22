import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import './styles/variables.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

import { useThemeStore } from './stores/theme'
const themeStore = useThemeStore()
themeStore.initTheme()

app.mount('#app')
