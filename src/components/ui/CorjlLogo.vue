<template>
  <div class="flex items-center" :class="[centered ? 'justify-center' : '']">
    <div class="flex items-center" :class="gapClass">
      <img
        src="@/assets/corjl-logo.png"
        alt="Corjl"
        :class="sizeClass"
      />
      <span
        v-if="showText"
        class="font-rubik font-bold text-white"
        :class="textClass"
      >
        Corjl
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showText: true,
  centered: false,
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-8 h-8'
    case 'lg': return 'w-14 h-14'
    default: return 'w-10 h-10'
  }
})

const textClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-lg'
    case 'lg': return 'text-3xl'
    default: return 'text-2xl'
  }
})

const gapClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'gap-2'
    case 'lg': return 'gap-4'
    default: return 'gap-3'
  }
})
</script>
