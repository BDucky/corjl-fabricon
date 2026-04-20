<template>
  <div class="space-y-3">
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block">
      Design Placement
    </label>

    <!-- Design Size -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Design Size</span>
        <span>{{ (store.textureMappingConfig.repeatX * 100).toFixed(0) }}%</span>
      </div>
      <input
        v-model.number="designSize"
        type="range"
        min="0.05"
        max="1.0"
        step="0.01"
        class="w-full accent-primary"
      />
    </div>

    <!-- Horizontal Position -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Horizontal</span>
        <span>{{ (store.textureMappingConfig.offsetX * 100).toFixed(0) }}%</span>
      </div>
      <input
        v-model.number="offsetX"
        type="range"
        min="0"
        max="1"
        step="0.01"
        class="w-full accent-primary"
      />
    </div>

    <!-- Vertical Position -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Vertical</span>
        <span>{{ (store.textureMappingConfig.offsetY * 100).toFixed(0) }}%</span>
      </div>
      <input
        v-model.number="offsetY"
        type="range"
        min="0"
        max="1"
        step="0.01"
        class="w-full accent-primary"
      />
    </div>

    <!-- Rotation -->
    <div>
      <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
        <span>Rotation</span>
        <span>{{ (store.textureMappingConfig.rotation * (180 / Math.PI)).toFixed(0) }}&deg;</span>
      </div>
      <input
        v-model.number="rotation"
        type="range"
        min="0"
        :max="Math.PI * 2"
        step="0.01"
        class="w-full accent-primary"
      />
    </div>

    <!-- Fill entire area toggle -->
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        :checked="store.tileDesign"
        class="accent-primary w-3.5 h-3.5 rounded"
        @change="store.toggleTileDesign()"
      />
      <span class="text-xs text-[var(--text-secondary)]">Fill entire area</span>
    </label>

    <!-- Action buttons -->
    <div class="flex gap-1.5">
      <button
        class="flex-1 px-2 py-1.5 rounded-lg bg-surface-2 text-xs text-[var(--text-secondary)] hover:bg-surface-3 transition-colors"
        @click="placement.fitDesignToArea()"
      >
        Auto Fit
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
import { computed } from 'vue'
import { useViewer3dStore } from '../store'
import { useDesignPlacement } from '../composables/useDesignPlacement'

const store = useViewer3dStore()
const placement = useDesignPlacement()

function makeConfigProp(key: 'repeatX' | 'repeatY' | 'offsetX' | 'offsetY' | 'rotation') {
  return computed({
    get: () => store.textureMappingConfig[key],
    set: (value: number) => store.setTextureMappingConfig({ [key]: value }),
  })
}

const designSize = computed({
  get: () => store.textureMappingConfig.repeatX,
  set: (value: number) => store.setTextureMappingConfig({ repeatX: value, repeatY: value }),
})
const offsetX = makeConfigProp('offsetX')
const offsetY = makeConfigProp('offsetY')
const rotation = makeConfigProp('rotation')
</script>
