<template>
  <div
    ref="cardRef"
    :class="[
      'bg-surface-1 border border-[var(--border-subtle)] rounded-[var(--radius-lg)]',
      'transition-all duration-normal ease-smooth cursor-pointer overflow-hidden',
      'hover:-translate-y-1 hover:shadow-depth-lg hover:border-[var(--border-default)]',
      'active:translate-y-0 active:shadow-depth-sm',
    ]"
    :style="tilt ? tiltStyle : undefined"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  tilt?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tilt: false,
})

const cardRef = ref<HTMLElement | null>(null)
const mouseX = ref(0.5)
const mouseY = ref(0.5)
const isHovering = ref(false)

const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

const tiltStyle = computed(() => {
  if (!props.tilt || !isHovering.value || prefersReducedMotion) return {}
  const maxTilt = 6
  const rotateX = (mouseY.value - 0.5) * -maxTilt
  const rotateY = (mouseX.value - 0.5) * maxTilt
  return {
    transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
    transition: 'transform 0.1s ease-out',
  }
})

const onMouseEnter = () => {
  isHovering.value = true
}

const onMouseMove = (e: MouseEvent) => {
  if (!props.tilt || !cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  mouseX.value = (e.clientX - rect.left) / rect.width
  mouseY.value = (e.clientY - rect.top) / rect.height
}

const onMouseLeave = () => {
  isHovering.value = false
  mouseX.value = 0.5
  mouseY.value = 0.5
}
</script>
