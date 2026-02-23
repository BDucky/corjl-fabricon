<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="(route.meta.transition as string) || 'page-fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initializeAuth()

  if (!authStore.isAuthenticated && router.currentRoute.value.path !== '/login' && router.currentRoute.value.path !== '/signup') {
    router.push('/login')
  }
})
</script>
