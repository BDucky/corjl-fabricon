<template>
  <div class="p-4">
    <h2 class="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
      Models
    </h2>

    <!-- Model grid -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <button
        v-for="model in store.allModels"
        :key="model.id"
        :class="[
          'group relative rounded-lg overflow-hidden border transition-all duration-fast text-left',
          store.activeModelId === model.id
            ? 'border-primary ring-1 ring-primary/40'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
        ]"
        @click="store.selectModel(model.id)"
      >
        <div class="aspect-square bg-surface-2 flex items-center justify-center">
          <img
            v-if="model.thumbnailUrl && !failedThumbs.has(model.id)"
            :src="model.thumbnailUrl"
            :alt="model.name"
            class="w-full h-full object-cover"
            @error="onThumbError(model.id)"
          />
          <!-- Fallback icon -->
          <div v-else class="flex flex-col items-center gap-1">
            <svg class="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span class="text-[10px] text-[var(--text-muted)]">3D</span>
          </div>
        </div>
        <div class="px-2 py-1.5 text-xs text-[var(--text-secondary)] truncate">
          {{ model.name }}
        </div>
      </button>
    </div>

    <!-- Upload button -->
    <label
      class="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-primary/40 hover:bg-surface-2 transition-all cursor-pointer"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Upload GLB
      <input
        type="file"
        accept=".glb,.gltf"
        class="hidden"
        @change="handleUpload"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useViewer3dStore } from '../store'

const store = useViewer3dStore()
const failedThumbs = reactive(new Set<string>())

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const url = URL.createObjectURL(file)
  const id = `uploaded-${Date.now()}`

  store.addUploadedModel({
    id,
    name: file.name.replace(/\.(glb|gltf)$/i, ''),
    url,
    thumbnailUrl: '',
    targetMeshNames: [],
    bundled: false,
  })

  store.selectModel(id)
  input.value = ''
}

function onThumbError(modelId: string) {
  failedThumbs.add(modelId)
}
</script>
