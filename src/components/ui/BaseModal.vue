<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          @click="closeModal"
        />

        <!-- Modal Content -->
        <div class="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div v-if="title || closeable" class="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 v-if="title" class="text-lg font-semibold text-gray-900">
              {{ title }}
            </h2>
            <button
              v-if="closeable"
              class="text-gray-500 hover:text-gray-700 transition-colors"
              @click="closeModal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex gap-2 p-4 border-t border-gray-200">
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

defineEmits<{
  close: []
}>()

const closeModal = () => {
  // Let parent handle the close
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
