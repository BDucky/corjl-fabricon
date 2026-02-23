<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-[var(--radius-lg)] shadow-depth-lg min-w-[280px] max-w-[400px]',
            variantClasses(toast.variant),
          ]"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <svg v-if="toast.variant === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="toast.variant === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="toast.variant === 'warning'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <!-- Content -->
          <div class="flex-1 text-sm font-medium">
            {{ toast.message }}
          </div>
          <!-- Close -->
          <button
            class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            @click="removeToast(toast.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <!-- Progress bar -->
          <div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-[var(--radius-lg)] overflow-hidden">
            <div
              class="h-full bg-white/30"
              :style="{ animation: `toast-progress ${toast.duration || 4000}ms linear forwards` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

export interface Toast {
  id: number
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<Toast[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 0

const variantClasses = (variant: Toast['variant']) => {
  switch (variant) {
    case 'success': return 'bg-emerald-900/90 text-emerald-100 border border-emerald-700/50'
    case 'error': return 'bg-red-900/90 text-red-100 border border-red-700/50'
    case 'warning': return 'bg-amber-900/90 text-amber-100 border border-amber-700/50'
    case 'info': return 'bg-primary/90 text-white border border-primary-light/50'
  }
}

const addToast = (message: string, variant: Toast['variant'] = 'info', duration = 4000) => {
  const id = nextId++
  toasts.value.push({ id, message, variant, duration })

  const timer = setTimeout(() => removeToast(id), duration)
  timers.set(id, timer)

  return id
}

const removeToast = (id: number) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

onUnmounted(() => {
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
})

defineExpose({ addToast, removeToast })
</script>

<style scoped>
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
