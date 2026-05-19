<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop (glassmorphism) -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="closeModal"
        />

        <!-- Modal Content -->
        <div class="relative glass-panel--elevated w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <!-- Header -->
          <div v-if="title || closeable" class="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-[var(--border-subtle)]">
            <h2 v-if="title" class="text-base sm:text-lg font-semibold text-[var(--text-primary)] min-w-0 truncate">
              {{ title }}
            </h2>
            <button
              v-if="closeable"
              class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-fast p-1 rounded-lg hover:bg-surface-2 flex-shrink-0"
              @click="closeModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex flex-wrap gap-2 sm:gap-3 p-4 sm:p-5 border-t border-[var(--border-subtle)]">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title?: string
  closeable?: boolean
}

withDefaults(defineProps<Props>(), {
  closeable: true,
})

const emit = defineEmits<{
  close: []
}>()

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > .glass-panel--elevated {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-leave-active > .glass-panel--elevated {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from > .glass-panel--elevated {
  opacity: 0;
  transform: scale(0.92);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to > .glass-panel--elevated {
  opacity: 0;
  transform: scale(0.96);
}
</style>
