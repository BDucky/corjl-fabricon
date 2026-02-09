import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initializes with empty state', () => {
    const authStore = useAuthStore()
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.token).toBeNull()
  })

  it('computes userName from email', () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '123',
      email: 'test@example.com',
      subscriptionTier: 'FREE',
      createdAt: new Date().toISOString(),
    }
    expect(authStore.userName).toBe('test')
  })

  it('computes userEmail correctly', () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: '123',
      email: 'test@example.com',
      subscriptionTier: 'FREE',
      createdAt: new Date().toISOString(),
    }
    expect(authStore.userEmail).toBe('test@example.com')
  })

  describe('initializeAuth', () => {
    it('sets isInitialized after first call', async () => {
      const authStore = useAuthStore()
      expect(authStore.isInitialized).toBe(false)
      await authStore.initializeAuth()
      expect(authStore.isInitialized).toBe(true)
    })

    it('does not reinitialize if already initialized', async () => {
      const authStore = useAuthStore()
      await authStore.initializeAuth()
      const isInitialized = authStore.isInitialized
      await authStore.initializeAuth()
      expect(authStore.isInitialized).toBe(isInitialized)
    })
  })
})
