<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="emit('close')"
        />

        <!-- Sheet -->
        <div
          class="relative bg-surface-1 rounded-t-2xl shadow-depth-xl flex flex-col"
          :style="{ maxHeight }"
        >
          <!-- Drag handle (visual only) + header -->
          <div class="pt-2 pb-1 flex flex-col items-center flex-shrink-0">
            <div class="w-10 h-1.5 rounded-full bg-surface-3" />
          </div>
          <div
            v-if="title"
            class="flex items-center justify-between px-4 pb-2 flex-shrink-0"
          >
            <h2 class="text-sm font-semibold text-[var(--text-primary)]">
              {{ title }}
            </h2>
            <button
              type="button"
              class="p-1 -m-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close"
              @click="emit('close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto overscroll-contain pb-safe-b">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    /** Max height of the sheet content (default 80vh). */
    maxHeight?: string
  }>(),
  {
    maxHeight: '80vh',
  },
)

const emit = defineEmits<{ close: [] }>()
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > .relative,
.sheet-leave-active > .relative {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > .relative,
.sheet-leave-to > .relative {
  transform: translateY(100%);
}
</style>
