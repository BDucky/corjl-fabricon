<template>
  <header
    :class="[
      'sticky top-0 z-40 flex items-center justify-between px-6 h-14',
      'bg-primary border-b border-primary-dark',
      'transition-all duration-normal',
      isScrolled ? 'backdrop-blur-md bg-primary/90 shadow-depth-md' : '',
    ]"
  >
    <!-- Left: Logo -->
    <div class="flex items-center gap-3">
      <RouterLink to="/designs" class="flex items-center gap-2">
        <CorjlLogo size="sm" />
      </RouterLink>
    </div>

    <!-- Center: Nav links (desktop) -->
    <nav class="hidden md:flex items-center gap-1">
      <RouterLink
        to="/designs"
        class="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-fast"
        active-class="!text-white bg-white/15"
      >
        My Designs
      </RouterLink>
    </nav>

    <!-- Right: User menu -->
    <div class="flex items-center gap-3">
      <span class="text-sm text-white/70 hidden sm:block">
        {{ userEmail }}
      </span>
      <button
        class="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-fast"
        @click="$emit('signout')"
      >
        Sign out
      </button>

      <!-- Mobile hamburger -->
      <button
        class="md:hidden p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu dropdown -->
    <Transition name="panel-slide-left">
      <div
        v-if="mobileMenuOpen"
        class="absolute top-14 left-0 right-0 bg-primary-dark border-b border-primary-dark/50 md:hidden"
      >
        <nav class="flex flex-col p-3 gap-1">
          <RouterLink
            to="/designs"
            class="px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            @click="mobileMenuOpen = false"
          >
            My Designs
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CorjlLogo from '@components/ui/CorjlLogo.vue'

defineProps<{
  userEmail?: string
}>()

defineEmits<{
  signout: []
}>()

const mobileMenuOpen = ref(false)
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
