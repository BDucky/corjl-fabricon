<template>
  <div>
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
      Camera
    </label>
    <div class="flex gap-1">
      <button
        v-for="preset in CAMERA_PRESETS"
        :key="preset.id"
        :class="[
          'flex-1 px-2 py-1.5 rounded-lg text-xs text-center transition-all duration-fast',
          store.cameraPresetId === preset.id
            ? 'bg-primary/20 text-primary-light border border-primary/30'
            : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
        ]"
        @click="store.setCameraPreset(preset.id)"
      >
        {{ preset.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import { CAMERA_PRESETS } from '../constants'

const store = useViewer3dStore()
</script>
