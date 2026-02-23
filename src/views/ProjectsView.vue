<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)] font-rubik">
            My Projects
          </h1>
          <p class="text-sm text-[var(--text-muted)] mt-1">
            Your recent designs
          </p>
        </div>
        <RouterLink to="/templates">
          <BaseButton variant="accent">
            New Project
          </BaseButton>
        </RouterLink>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard v-for="i in 6" :key="i" />
      </div>

      <!-- Empty state -->
      <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20">
        <div class="w-24 h-24 bg-surface-1 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-12 h-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">No projects yet</h3>
        <p class="text-sm text-[var(--text-muted)] mb-6">Start by choosing a template</p>
        <RouterLink to="/templates">
          <BaseButton variant="primary">Browse Templates</BaseButton>
        </RouterLink>
      </div>

      <!-- Projects grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <BaseCard v-for="project in projects" :key="project.id">
          <!-- Thumbnail -->
          <div class="h-44 bg-surface-2 flex items-center justify-center">
            <svg class="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Content -->
          <div class="p-4">
            <h3 class="text-sm font-semibold text-[var(--text-primary)] truncate">
              {{ project.name }}
            </h3>
            <p class="text-xs text-[var(--text-muted)] mt-1">
              Edited {{ project.lastEdited }}
            </p>
            <RouterLink
              :to="`/editor/${project.id}`"
              class="mt-3 block"
            >
              <BaseButton variant="primary" size="sm" full-width>
                Open
              </BaseButton>
            </RouterLink>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@components/layout/AppLayout.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import SkeletonCard from '@components/ui/SkeletonCard.vue'

interface Project {
  id: string
  name: string
  lastEdited: string
}

const isLoading = ref(true)
const projects = ref<Project[]>([])

onMounted(() => {
  // Simulate loading
  setTimeout(() => {
    projects.value = Array.from({ length: 6 }, (_, i) => ({
      id: `project-${i + 1}`,
      name: `Project ${i + 1}`,
      lastEdited: `${i + 1}d ago`,
    }))
    isLoading.value = false
  }, 1200)
})
</script>
