import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'

// Lazy load components
const LoginView = () => import('@/views/LoginView.vue')
const SignupView = () => import('@/views/SignupView.vue')
const EditorView = () => import('@/views/EditorView.vue')
const MyDesignsView = () => import('@/views/MyDesignsView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/designs',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false, transition: 'page-fade' },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupView,
    meta: { requiresAuth: false, transition: 'page-fade' },
  },
  {
    path: '/designs',
    name: 'MyDesigns',
    component: MyDesignsView,
    meta: { requiresAuth: true, transition: 'page-fade' },
  },
  {
    path: '/editor/:designId',
    name: 'Editor',
    component: EditorView,
    meta: { requiresAuth: true, transition: 'zoom-fade' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: { requiresAuth: true, transition: 'page-fade' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/designs',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard for authentication
// Note: initializeAuth() is awaited in main.ts before the app mounts,
// so isInitialized is always true when guards run. The check below
// is a safety net for edge cases (e.g., lazy-loaded route navigations).
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Wait for auth initialization if it hasn't completed yet
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (!requiresAuth && authStore.isAuthenticated && (to.path === '/login' || to.path === '/signup')) {
    next('/designs')
  } else {
    next()
  }
})

export default router
