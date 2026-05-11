<template>
  <div>
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
      Scene Staging
    </label>
    <div class="grid grid-cols-2 gap-1.5">
      <button
        v-for="preset in SCENE_STAGING_PRESETS"
        :key="preset.id"
        :class="[
          'px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-fast',
          store.sceneStagingPresetId === preset.id
            ? 'bg-primary/20 text-primary-light border border-primary/30'
            : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
        ]"
        @click="store.setSceneStagingPreset(preset.id)"
      >
        {{ preset.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import { SCENE_STAGING_PRESETS } from '../constants'

const store = useViewer3dStore()
</script>
