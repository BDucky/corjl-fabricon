import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'

// Lazy load components
const LoginView = () => import('@/views/LoginView.vue')
const SignupView = () => import('@/views/SignupView.vue')
const EditorView = () => import('@/views/EditorView.vue')
const ProjectsView = () => import('@/views/ProjectsView.vue')
const TemplatesView = () => import('@/views/TemplatesView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/projects',
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
    path: '/projects',
    name: 'Projects',
    component: ProjectsView,
    meta: { requiresAuth: true, transition: 'page-fade' },
  },
  {
    path: '/templates',
    name: 'Templates',
    component: TemplatesView,
    meta: { requiresAuth: true, transition: 'page-fade' },
  },
  {
    path: '/editor/:projectId',
    name: 'Editor',
    component: EditorView,
    meta: { requiresAuth: true, transition: 'zoom-fade' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/projects',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (!requiresAuth && authStore.isAuthenticated && (to.path === '/login' || to.path === '/signup')) {
    next('/projects')
  } else {
    next()
  }
})

export default router
