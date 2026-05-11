<template>
  <div>
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
      Product Color
    </label>

    <!-- Preset color circles -->
    <div class="flex flex-wrap gap-1.5 mb-2">
      <button
        v-for="preset in colorPresets"
        :key="preset.hex"
        :title="preset.name"
        :class="[
          'w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110',
          store.productColor === preset.hex
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
        ]"
        :style="{ backgroundColor: preset.hex }"
        @click="store.setProductColor(preset.hex)"
      />
    </div>

    <!-- Custom color input -->
    <div class="flex items-center gap-2">
      <input
        type="color"
        :value="store.productColor"
        class="w-7 h-7 rounded cursor-pointer border border-[var(--border-subtle)]"
        @input="store.setProductColor(($event.target as HTMLInputElement).value)"
      />
      <input
        type="text"
        :value="store.productColor"
        class="flex-1 px-2 py-1 rounded bg-surface-2 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-mono focus:border-primary/50 focus:outline-none"
        maxlength="7"
        @change="handleHexInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useViewer3dStore } from '../store'
import { PRODUCT_COLORS, DEFAULT_PRODUCT_COLORS } from '../constants'

const store = useViewer3dStore()

const colorPresets = computed(() => {
  if (store.activeModelId && PRODUCT_COLORS[store.activeModelId]) {
    return PRODUCT_COLORS[store.activeModelId]
  }
  return DEFAULT_PRODUCT_COLORS
})

function handleHexInput(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    store.setProductColor(value)
  }
}
</script>
