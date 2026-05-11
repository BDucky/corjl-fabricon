<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)] font-rubik">
            My Designs
          </h1>
          <p class="text-sm text-[var(--text-muted)] mt-1">
            Select a design to preview in 3D
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-6">
        <DesignFilters
          :search-query="designsStore.searchQuery"
          :design-type="designsStore.designType"
          :sort-by="designsStore.sortBy"
          :sort-direction="designsStore.sortDirection"
          @search="designsStore.setSearch"
          @type-change="designsStore.setDesignTypeFilter"
          @sort-change="designsStore.setSort"
        />
      </div>

      <!-- Error state -->
      <div
        v-if="designsStore.error"
        class="flex flex-col items-center justify-center py-12 px-4"
      >
        <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-1">Failed to load designs</h3>
        <p class="text-sm text-[var(--text-muted)] mb-4 text-center max-w-md">{{ designsStore.error }}</p>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          @click="designsStore.fetchDesigns(true)"
        >
          Retry
        </button>
      </div>

      <!-- Loading skeleton (initial load) -->
      <div
        v-else-if="designsStore.isLoading && designsStore.designs.length === 0"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <SkeletonCard v-for="i in 8" :key="i" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="designsStore.isEmpty"
        class="flex flex-col items-center justify-center py-20"
      >
        <div class="w-24 h-24 bg-surface-1 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-12 h-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">No designs found</h3>
        <p class="text-sm text-[var(--text-muted)] mb-6">
          {{ designsStore.searchQuery ? 'Try a different search or filter' : 'No designs available for this type' }}
        </p>
        <button
          v-if="designsStore.searchQuery"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-surface-1 text-[var(--text-secondary)] hover:bg-surface-2 transition-colors"
          @click="designsStore.setSearch('')"
        >
          Clear Filters
        </button>
      </div>

      <!-- Designs grid -->
      <template v-else>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DesignCard
            v-for="design in designsStore.designs"
            :key="design.designId"
            :design="design"
            @select="onSelectDesign"
          />
        </div>

        <!-- Load More -->
        <div v-if="designsStore.hasMore" class="flex justify-center mt-8">
          <button
            class="px-6 py-2.5 text-sm font-medium rounded-lg bg-surface-1 text-[var(--text-secondary)] hover:bg-surface-2 transition-colors disabled:opacity-50"
            :disabled="designsStore.isLoading"
            @click="designsStore.loadMore()"
          >
            {{ designsStore.isLoading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@components/layout/AppLayout.vue'
import SkeletonCard from '@components/ui/SkeletonCard.vue'
import DesignCard from '@components/designs/DesignCard.vue'
import DesignFilters from '@components/designs/DesignFilters.vue'
import { useDesignsStore } from '@stores/designs'

const router = useRouter()
const designsStore = useDesignsStore()

onMounted(() => {
  designsStore.fetchDesigns(true)
})

function onSelectDesign(designId: string) {
  router.push(`/editor/${designId}`)
}
</script>
