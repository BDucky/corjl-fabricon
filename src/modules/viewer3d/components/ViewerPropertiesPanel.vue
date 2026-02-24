<template>
  <div class="p-4 space-y-5">
    <h2 class="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
      Properties
    </h2>

    <!-- Product Color -->
    <ProductColorPicker />

    <!-- Design Placement -->
    <DesignPlacementControls v-if="store.hasTexture" />

    <!-- Lighting -->
    <LightingPresetSelector />

    <!-- Camera -->
    <CameraPresetBar />

    <!-- Background color -->
    <div>
      <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
        Background
      </label>
      <div class="flex items-center gap-2">
        <input
          type="color"
          :value="store.backgroundColor"
          class="w-8 h-8 rounded cursor-pointer border border-[var(--border-subtle)]"
          @input="store.backgroundColor = ($event.target as HTMLInputElement).value"
        />
        <span class="text-xs text-[var(--text-secondary)]">{{ store.backgroundColor }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
import ProductColorPicker from './ProductColorPicker.vue'
import DesignPlacementControls from './DesignPlacementControls.vue'
import LightingPresetSelector from './LightingPresetSelector.vue'
import CameraPresetBar from './CameraPresetBar.vue'

const store = useViewer3dStore()
</script>
