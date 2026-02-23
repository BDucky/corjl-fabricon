<template>
  <div class="min-h-screen bg-surface-ground">
    <AppHeader
      :user-email="authStore.userEmail"
      @signout="handleSignout"
    />
    <main class="safe-area-padded">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import AppHeader from '@components/layout/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const handleSignout = async () => {
  await authStore.signout()
  router.push('/login')
}
</script>
