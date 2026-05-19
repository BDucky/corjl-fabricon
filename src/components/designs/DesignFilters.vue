<template>
  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
    <!-- Search input -->
    <div class="relative flex-1 min-w-0 w-full sm:w-auto">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        :value="searchQuery"
        type="text"
        placeholder="Search designs..."
        class="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-surface-1 border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        @input="onSearchInput"
      />
    </div>

    <!-- Sort dropdown -->
    <select
      :value="sortValue"
      class="px-3 py-2 text-xs rounded-lg bg-surface-1 border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-primary"
      @change="onSortChange"
    >
      <option value="updatedAt:DESC">Last Updated</option>
      <option value="createdAt:DESC">Newest First</option>
      <option value="createdAt:ASC">Oldest First</option>
      <option value="designName:ASC">Name A-Z</option>
      <option value="designName:DESC">Name Z-A</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DesignSortField, SortDirection } from '@/types/designs'

const props = defineProps<{
  searchQuery: string
  sortBy: DesignSortField
  sortDirection: SortDirection
}>()

const emit = defineEmits<{
  search: [query: string]
  sortChange: [field: DesignSortField, direction: SortDirection]
}>()

const sortValue = computed(() => `${props.sortBy}:${props.sortDirection}`)

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('search', value)
  }, 300)
}

function onSortChange(e: Event) {
  const [field, direction] = (e.target as HTMLSelectElement).value.split(':') as [DesignSortField, SortDirection]
  emit('sortChange', field, direction)
}
</script>
