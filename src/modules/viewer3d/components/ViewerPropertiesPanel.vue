<template>
  <div class="p-4 space-y-5">
    <h2 class="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
      Properties
    </h2>

    <!-- Texture -->
    <TextureUploader />

    <!-- UV Mapping (visible when texture is applied) -->
    <div v-if="store.hasTexture" class="space-y-3">
      <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block">
        UV Mapping
      </label>

      <div>
        <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>Offset X</span>
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

      <div>
        <div class="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>Offset Y</span>
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
    </div>

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
import type { TextureMappingConfig } from '../types'
import TextureUploader from './TextureUploader.vue'
import LightingPresetSelector from './LightingPresetSelector.vue'
import CameraPresetBar from './CameraPresetBar.vue'

const store = useViewer3dStore()

function updateMapping(key: keyof TextureMappingConfig, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  store.setTextureMappingConfig({ [key]: value })
}
</script>
