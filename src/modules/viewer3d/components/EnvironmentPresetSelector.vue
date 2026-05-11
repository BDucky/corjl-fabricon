<template>
  <div>
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
      Environment
    </label>
    <div class="grid grid-cols-2 gap-1.5">
      <button
        :class="[
          'px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-fast',
          store.environmentPresetId === null
            ? 'bg-primary/20 text-primary-light border border-primary/30'
            : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
        ]"
        @click="store.setEnvironmentPreset(null)"
      >
        None
      </button>
      <button
        v-for="preset in ENVIRONMENT_PRESETS"
        :key="preset.id"
        :class="[
          'px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-fast',
          store.environmentPresetId === preset.id
            ? 'bg-primary/20 text-primary-light border border-primary/30'
            : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 border border-transparent',
        ]"
        :title="preset.description"
        @click="store.setEnvironmentPreset(preset.id)"
      >
        {{ preset.name }}
      </button>
    </div>

    <!-- Intensity slider -->
    <div v-if="store.environmentPresetId" class="mt-2">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] text-[var(--text-muted)]">Intensity</span>
        <span class="text-[10px] text-[var(--text-muted)]">{{ store.environmentIntensity.toFixed(1) }}</span>
      </div>
      <input
        type="range"
        :value="store.environmentIntensity"
        min="0"
        max="2"
        step="0.1"
        class="w-full accent-primary h-1"
        @input="store.setEnvironmentIntensity(parseFloat(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import { ENVIRONMENT_PRESETS } from '../constants'

const store = useViewer3dStore()
</script>
