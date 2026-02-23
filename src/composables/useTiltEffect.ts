import { ref, computed, onMounted, type Ref } from 'vue'

interface TiltOptions {
  maxTilt?: number
  speed?: number
}

export function useTiltEffect(
  elementRef: Ref<HTMLElement | null>,
  options: TiltOptions = {},
) {
  const { maxTilt = 8, speed = 100 } = options

  const mouseX = ref(0.5)
  const mouseY = ref(0.5)
  const isHovering = ref(false)
  const prefersReducedMotion = ref(false)

  onMounted(() => {
    prefersReducedMotion.value = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
  })

  const tiltStyle = computed(() => {
    if (!isHovering.value || prefersReducedMotion.value) {
      return {
        transform: 'perspective(600px) rotateX(0deg) rotateY(0deg)',
        transition: `transform ${speed * 3}ms ease-out`,
      }
    }

    const rotateX = (mouseY.value - 0.5) * -maxTilt
    const rotateY = (mouseX.value - 0.5) * maxTilt

    return {
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: `transform ${speed}ms ease-out`,
    }
  })

  const onMouseMove = (e: MouseEvent) => {
    if (!elementRef.value) return
    const rect = elementRef.value.getBoundingClientRect()
    mouseX.value = (e.clientX - rect.left) / rect.width
    mouseY.value = (e.clientY - rect.top) / rect.height
  }

  const onMouseEnter = () => {
    isHovering.value = true
  }

  const onMouseLeave = () => {
    isHovering.value = false
    mouseX.value = 0.5
    mouseY.value = 0.5
  }

  return {
    tiltStyle,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  }
}
