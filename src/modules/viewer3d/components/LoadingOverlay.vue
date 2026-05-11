<template>
  <Transition name="fade">
    <div
      v-if="store.isModelLoading || store.isDesignLoading"
      class="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg"
    >
      <div class="w-48">
        <div class="text-sm text-white/80 text-center mb-3">
          {{ store.isDesignLoading ? 'Loading design...' : 'Loading model...' }}
        </div>
        <div v-if="store.isModelLoading" class="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-300"
            :style="{ width: `${store.modelLoadProgress}%` }"
          />
        </div>
        <div v-if="store.isModelLoading" class="text-xs text-white/50 text-center mt-2">
          {{ Math.round(store.modelLoadProgress) }}%
        </div>
        <div v-else class="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'
const store = useViewer3dStore()
</script>
