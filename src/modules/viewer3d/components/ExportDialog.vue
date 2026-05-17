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

      <!-- Turntable GIF settings -->
      <div>
        <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
          Turntable GIF
        </label>
        <div class="space-y-2">
          <div>
            <span class="text-[10px] text-[var(--text-muted)] block mb-1">Frames</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="fc in TURNTABLE_FRAME_COUNTS"
                :key="fc.value"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs transition-all duration-fast whitespace-nowrap',
                  store.turntableFrameCount === fc.value
                    ? 'bg-primary/20 text-primary-light border border-primary/30'
                    : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
                ]"
                @click="store.setTurntableSettings({ frameCount: fc.value })"
              >
                {{ fc.label }}
              </button>
            </div>
          </div>
          <div>
            <span class="text-[10px] text-[var(--text-muted)] block mb-1">Speed</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="sp in TURNTABLE_SPEEDS"
                :key="sp.delay"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs transition-all duration-fast whitespace-nowrap',
                  store.turntableFrameDelay === sp.delay
                    ? 'bg-primary/20 text-primary-light border border-primary/30'
                    : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
                ]"
                @click="store.setTurntableSettings({ frameDelay: sp.delay })"
              >
                {{ sp.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

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
      <div class="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          class="min-w-0 px-3 py-2.5 rounded-lg bg-surface-2 text-[var(--text-secondary)] text-sm hover:bg-surface-3 transition-colors disabled:opacity-40 truncate"
          :disabled="store.isExporting"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button
          class="min-w-0 px-3 py-2.5 rounded-lg bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-40 truncate"
          :disabled="store.isExporting"
          @click="$emit('exportAllAngles')"
        >
          All Angles
        </button>
        <button
          class="min-w-0 px-3 py-2.5 rounded-lg bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-40 truncate"
          :disabled="store.isExporting"
          @click="$emit('exportTurntableGif')"
        >
          Turntable GIF
        </button>
        <button
          class="min-w-0 px-3 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40 truncate"
          :disabled="store.isExporting"
          @click="$emit('confirm')"
        >
          Export PNG
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import { EXPORT_RESOLUTIONS, TURNTABLE_FRAME_COUNTS, TURNTABLE_SPEEDS } from '../constants'
import BaseModal from '@components/ui/BaseModal.vue'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
  confirm: []
  exportAllAngles: []
  exportTurntableGif: []
}>()

const store = useViewer3dStore()
</script>
