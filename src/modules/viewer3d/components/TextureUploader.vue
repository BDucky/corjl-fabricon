<template>
  <div>
    <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
      Design Texture
    </label>

    <div
      :class="[
        'relative rounded-lg border-2 border-dashed transition-all cursor-pointer',
        isDragOver
          ? 'border-primary bg-primary/10'
          : 'border-[var(--border-default)] hover:border-primary/40',
      ]"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="handleDrop"
      @click="triggerInput"
    >
      <div v-if="store.textureUrl" class="p-2">
        <img
          :src="store.textureUrl"
          alt="Current texture"
          class="w-full rounded object-contain max-h-24"
        />
        <button
          class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:text-white transition-colors"
          @click.stop="removeTexture"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div v-else class="flex flex-col items-center py-4 px-2">
        <svg class="w-6 h-6 text-[var(--text-muted)] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-xs text-[var(--text-muted)]">Drop image or click</span>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useViewer3dStore } from '../store'

const store = useViewer3dStore()
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerInput() {
  fileInput.value?.click()
}

function handleFile(file: File) {
  if (!file.type.startsWith('image/')) return
  const url = URL.createObjectURL(file)
  store.setTextureUrl(url)
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}

function removeTexture() {
  store.setTextureUrl(null)
}
</script>
