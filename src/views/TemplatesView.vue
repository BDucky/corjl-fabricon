<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">
          Design Templates
        </h1>
        <RouterLink
          to="/projects"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-white hover:bg-gray-50"
        >
          ← Back to Projects
        </RouterLink>
      </div>

      <!-- Templates grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 9" :key="i" class="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
          <div class="bg-gray-300 h-48 flex items-center justify-center">
            <p class="text-gray-500">Template {{ i }}</p>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900">
              Template Name {{ i }}
            </h3>
            <p class="mt-2 text-sm text-gray-500">
              Category: {{ ['Greeting Card', 'Postcard', 'Flyer', 'Brochure'][i % 4] }}
            </p>
            <div class="mt-4">
              <button
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Templates view loaded')
})
</script>
