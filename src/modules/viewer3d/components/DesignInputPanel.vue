<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
      Design Input
    </h2>

    <!-- Design preview (when loaded) -->
    <div v-if="store.hasDesign" class="relative">
      <img
        :src="store.designImageUrl!"
        alt="Design preview"
        class="w-full rounded-lg object-contain max-h-32 bg-surface-2"
      />
      <button
        class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:text-white transition-colors"
        title="Remove design"
        @click="designInput.clearDesign()"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div v-if="store.designDimensions" class="mt-1.5 text-[10px] text-[var(--text-muted)] text-center">
        {{ store.designDimensions.width }} x {{ store.designDimensions.height }}px
        <span v-if="store.designName" class="ml-1 truncate">· {{ store.designName }}</span>
      </div>
    </div>

    <!-- Upload area (when no design) -->
    <div v-else>
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
        @click="triggerFileInput"
      >
        <div class="flex flex-col items-center py-6 px-2">
          <svg class="w-8 h-8 text-[var(--text-muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-xs text-[var(--text-muted)] font-medium">Drop your design here</span>
          <span class="text-[10px] text-[var(--text-muted)] mt-0.5">or click to browse</span>
        </div>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileInput"
      />

      <!-- Camera capture -->
      <button
        class="mt-2 w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-primary/40 transition-colors disabled:opacity-40"
        :disabled="designInput.isLoading.value"
        @click="captureFromCamera"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Take photo
      </button>

      <!-- URL input -->
      <div class="mt-2">
        <div class="flex gap-1.5">
          <input
            v-model="urlInput"
            type="text"
            placeholder="Paste image URL..."
            class="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary/50 focus:outline-none transition-colors"
            @keydown.enter="loadUrl"
          />
          <button
            class="px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-medium hover:bg-primary/30 transition-colors disabled:opacity-40"
            :disabled="!urlInput.trim() || designInput.isLoading.value"
            @click="loadUrl"
          >
            Load
          </button>
        </div>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="designInput.isLoading.value" class="flex items-center gap-2 text-xs text-primary-light">
      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading design...
    </div>

    <!-- Error message -->
    <div v-if="designInput.error.value" class="text-xs text-red-400 bg-red-500/10 rounded-lg px-2.5 py-1.5">
      {{ designInput.error.value }}
    </div>

    <!-- Product suggestions -->
    <div v-if="store.hasDesign || store.hasModel">
      <h3 class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
        {{ store.hasDesign ? 'Suggested Products' : 'Products' }}
      </h3>

      <div class="space-y-1">
        <button
          v-for="suggestion in matcher.suggestions.value"
          :key="suggestion.model.id"
          :class="[
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150',
            store.activeModelId === suggestion.model.id
              ? 'bg-primary/20 border border-primary/30'
              : 'hover:bg-surface-2 border border-transparent',
          ]"
          @click="matcher.selectProduct(suggestion.model.id)"
        >
          <!-- Model icon -->
          <div class="w-8 h-8 rounded bg-surface-2 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>

          <!-- Model info -->
          <div class="flex-1 min-w-0">
            <div class="text-xs text-[var(--text-primary)] font-medium truncate">
              {{ suggestion.model.name }}
            </div>
            <div class="text-[10px] text-[var(--text-muted)]">
              {{ suggestion.reason }}
            </div>
          </div>

          <!-- Match score badge -->
          <div
            v-if="store.hasDesign"
            :class="[
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
              suggestion.score >= 90
                ? 'bg-green-500/20 text-green-400'
                : suggestion.score >= 70
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-surface-2 text-[var(--text-muted)]',
            ]"
          >
            {{ suggestion.score }}%
          </div>

          <!-- Selected check -->
          <svg
            v-if="store.activeModelId === suggestion.model.id"
            class="w-4 h-4 text-primary-light flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useViewer3dStore } from '../store'
import { useDesignInput } from '../composables/useDesignInput'
import { useProductMatcher } from '../composables/useProductMatcher'

const store = useViewer3dStore()
const designInput = useDesignInput()
const matcher = useProductMatcher()

const isDragOver = ref(false)
const urlInput = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await designInput.loadFromFile(file)
  input.value = ''
}

async function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) await designInput.loadFromFile(file)
}

async function loadUrl() {
  if (!urlInput.value.trim()) return
  const result = await designInput.loadFromUrl(urlInput.value)
  if (result) urlInput.value = ''
}

async function captureFromCamera() {
  await designInput.loadFromCamera()
}
</script>
