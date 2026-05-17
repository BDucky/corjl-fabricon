import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth BEFORE mounting — prevents flash of login page on reload
const authStore = useAuthStore(pinia)
Promise.all([authStore.initializeAuth(), authStore.initBiometric()]).finally(() => {
  app.mount('#app')
})
