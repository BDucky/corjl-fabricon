<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">
          My Projects
        </h1>
        <RouterLink
          to="/templates"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          New Project
        </RouterLink>
      </div>

      <!-- Projects list -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-500">
                  Project {{ i }}
                </p>
                <p class="mt-1 text-3xl font-semibold text-gray-900">
                  Sample
                </p>
              </div>
            </div>
            <div class="mt-5">
              <RouterLink
                to="`/editor/project-${i}`"
                class="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                Open →
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  console.log('Projects view loaded for user:', authStore.userEmail)
})
</script>
