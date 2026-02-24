<template>
  <div class="space-y-3">
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block">
      Design Placement
    </label>

    <!-- Scale X -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Scale X</span>
        <span>{{ store.textureMappingConfig.repeatX.toFixed(2) }}</span>
      </div>
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        :value="store.textureMappingConfig.repeatX"
        class="w-full accent-primary"
        @input="updateMapping('repeatX', $event)"
      />
    </div>

    <!-- Scale Y -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Scale Y</span>
        <span>{{ store.textureMappingConfig.repeatY.toFixed(2) }}</span>
      </div>
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        :value="store.textureMappingConfig.repeatY"
        class="w-full accent-primary"
        @input="updateMapping('repeatY', $event)"
      />
    </div>

    <!-- Position X -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Position X</span>
        <span>{{ store.textureMappingConfig.offsetX.toFixed(2) }}</span>
      </div>
      <input
        type="range"
        min="-1"
        max="1"
        step="0.01"
        :value="store.textureMappingConfig.offsetX"
        class="w-full accent-primary"
        @input="updateMapping('offsetX', $event)"
      />
    </div>

    <!-- Position Y -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Position Y</span>
        <span>{{ store.textureMappingConfig.offsetY.toFixed(2) }}</span>
      </div>
      <input
        type="range"
        min="-1"
        max="1"
        step="0.01"
        :value="store.textureMappingConfig.offsetY"
        class="w-full accent-primary"
        @input="updateMapping('offsetY', $event)"
      />
    </div>

    <!-- Rotation -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Rotation</span>
        <span>{{ (store.textureMappingConfig.rotation * (180 / Math.PI)).toFixed(0) }}°</span>
      </div>
      <input
        type="range"
        min="0"
        :max="Math.PI * 2"
        step="0.01"
        :value="store.textureMappingConfig.rotation"
        class="w-full accent-primary"
        @input="updateMapping('rotation', $event)"
      />
    </div>

    <!-- Action buttons -->
    <div class="flex gap-1.5">
      <button
        class="flex-1 px-2 py-1.5 rounded-lg bg-surface-2 text-xs text-[var(--text-secondary)] hover:bg-surface-3 transition-colors"
        @click="placement.fitDesignToArea()"
      >
        Fit
      </button>
      <button
        class="flex-1 px-2 py-1.5 rounded-lg bg-surface-2 text-xs text-[var(--text-secondary)] hover:bg-surface-3 transition-colors"
        @click="placement.centerDesign()"
      >
        Center
      </button>
      <button
        class="flex-1 px-2 py-1.5 rounded-lg bg-surface-2 text-xs text-[var(--text-secondary)] hover:bg-surface-3 transition-colors"
        @click="placement.resetPlacement()"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import { useDesignPlacement } from '../composables/useDesignPlacement'
import type { TextureMappingConfig } from '../types'

const store = useViewer3dStore()
const placement = useDesignPlacement()

function updateMapping(key: keyof TextureMappingConfig, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  store.setTextureMappingConfig({ [key]: value })
}
</script>
