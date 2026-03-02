<template>
  <div
    class="group bg-surface-0 rounded-xl border border-[var(--border-subtle)] overflow-hidden hover:border-[var(--border-default)] hover:shadow-lg transition-all cursor-pointer"
    @click="$emit('select', design.designId)"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-[4/3] bg-surface-2 overflow-hidden">
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        :alt="design.designName"
        class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="imgError = true"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <svg class="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Type badge -->
      <span class="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/50 text-white backdrop-blur-sm">
        {{ design.designType }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-3">
      <h3 class="text-sm font-semibold text-[var(--text-primary)] truncate" :title="design.designName">
        {{ design.designName }}
      </h3>
      <p v-if="formattedDate" class="text-xs text-[var(--text-muted)] mt-0.5">
        {{ formattedDate }}
      </p>
      <button
        class="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        @click.stop="$emit('select', design.designId)"
      >
        View in 3D
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDesignsStore } from '@stores/designs'
import type { DesignListItem } from '@/types/designs'

const props = defineProps<{
  design: DesignListItem
}>()

defineEmits<{
  select: [designId: string]
}>()

const designsStore = useDesignsStore()
const imgError = ref(false)

const thumbnailUrl = computed(() => {
  if (imgError.value) return null
  return designsStore.getThumbnailUrl(props.design.thumbnailFilePath)
})

const formattedDate = computed(() => {
  const dateStr = props.design.updatedAt ?? props.design.createdAt
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
})
</script>
