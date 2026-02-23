<template>
  <button
    :class="[
      'inline-flex items-center justify-center font-medium font-rubik',
      'transition-all duration-normal ease-smooth',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-ground',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'active:translate-y-0.5 active:shadow-none',
      'hover:-translate-y-0.5',
      sizeClasses,
      variantClasses,
      fullWidth ? 'w-full' : '',
    ]"
    :disabled="disabled || isLoading"
  >
    <span v-if="!isLoading" class="flex items-center gap-2">
      <slot />
    </span>
    <span v-else class="flex items-center gap-2">
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {{ loadingText || 'Loading...' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  isLoading: false,
  fullWidth: false,
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm rounded-full'
    case 'lg':
      return 'px-8 py-3 text-lg rounded-full'
    default:
      return 'px-5 py-2.5 rounded-full'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-depth-sm hover:shadow-depth-md'
    case 'secondary':
      return 'bg-surface-2 text-white hover:bg-surface-3 focus:ring-surface-4 border border-surface-3'
    case 'danger':
      return 'bg-cta text-white hover:bg-red-700 focus:ring-red-500 shadow-depth-sm hover:shadow-depth-md'
    case 'ghost':
      return 'bg-transparent text-white hover:bg-surface-1 focus:ring-primary'
    case 'accent':
      return 'bg-accent text-surface-ground hover:bg-accent-hover focus:ring-accent font-semibold shadow-depth-sm hover:shadow-depth-md'
    default:
      return 'bg-primary text-white hover:bg-primary-dark focus:ring-primary'
  }
})
</script>
