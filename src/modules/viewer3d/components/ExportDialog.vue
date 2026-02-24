<template>
  <BaseModal :is-open="isOpen" title="Export Mockup" :closeable="true" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Resolution -->
      <div>
        <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
          Resolution
        </label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="res in EXPORT_RESOLUTIONS"
            :key="res.label"
            :class="[
              'px-3 py-2 rounded-lg text-xs transition-all duration-fast',
              store.exportSettings.width === res.width
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
            ]"
            @click="store.setExportSettings({ width: res.width, height: res.height })"
          >
            {{ res.label }}
            <span class="text-[10px] text-[var(--text-muted)] block">{{ res.width }}x{{ res.height }}</span>
          </button>
        </div>
      </div>

      <!-- Transparent background -->
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="store.exportSettings.transparentBackground"
          class="accent-primary w-4 h-4 rounded"
          @change="store.setExportSettings({ transparentBackground: ($event.target as HTMLInputElement).checked })"
        />
        <span class="text-sm text-[var(--text-secondary)]">Transparent background</span>
      </label>

      <!-- Export progress -->
      <div v-if="store.isExporting" class="space-y-1.5">
        <div class="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Capturing angles...</span>
          <span>{{ store.exportProgress }}%</span>
        </div>
        <div class="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-300"
            :style="{ width: `${store.exportProgress}%` }"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="flex-1 px-4 py-2 rounded-lg bg-surface-2 text-[var(--text-secondary)] text-sm hover:bg-surface-3 transition-colors"
        :disabled="store.isExporting"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="flex-1 px-4 py-2 rounded-lg bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-40"
        :disabled="store.isExporting"
        @click="$emit('exportAllAngles')"
      >
        All Angles (ZIP)
      </button>
      <button
        class="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
        :disabled="store.isExporting"
        @click="$emit('confirm')"
      >
        Export PNG
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import { EXPORT_RESOLUTIONS } from '../constants'
import BaseModal from '@components/ui/BaseModal.vue'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
  confirm: []
  exportAllAngles: []
}>()

const store = useViewer3dStore()
</script>
