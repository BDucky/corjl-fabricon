<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)] font-rubik">
            Design Templates
          </h1>
          <p class="text-sm text-[var(--text-muted)] mt-1">
            Choose a starting point for your design
          </p>
        </div>
        <RouterLink to="/projects">
          <BaseButton variant="secondary" size="sm">
            My Projects
          </BaseButton>
        </RouterLink>
      </div>

      <!-- Category pills -->
      <div class="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap',
            'transition-all duration-fast',
            activeCategory === cat
              ? 'bg-primary text-white shadow-depth-sm'
              : 'bg-surface-1 text-[var(--text-secondary)] hover:bg-surface-2 border border-[var(--border-subtle)]',
          ]"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard v-for="i in 9" :key="i" />
      </div>

      <!-- Templates grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <BaseCard v-for="template in filteredTemplates" :key="template.id" tilt>
          <!-- Thumbnail -->
          <div class="h-48 bg-surface-2 flex items-center justify-center">
            <span class="text-[var(--text-muted)] text-sm">{{ template.name }}</span>
          </div>
          <!-- Content -->
          <div class="p-4">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              {{ template.name }}
            </h3>
            <p class="text-xs text-[var(--text-muted)] mt-1">
              {{ template.category }}
            </p>
            <button
              class="mt-3 w-full"
              @click="useTemplate(template.id)"
            >
              <BaseButton variant="primary" size="sm" full-width>
                Use Template
              </BaseButton>
            </button>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@components/layout/AppLayout.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import SkeletonCard from '@components/ui/SkeletonCard.vue'

const router = useRouter()

interface Template {
  id: string
  name: string
  category: string
}

const categories = ['All', 'Greeting Card', 'Postcard', 'Flyer', 'Brochure']
const activeCategory = ref('All')
const isLoading = ref(true)
const templates = ref<Template[]>([])

const filteredTemplates = computed(() => {
  if (activeCategory.value === 'All') return templates.value
  return templates.value.filter(t => t.category === activeCategory.value)
})

const useTemplate = (templateId: string) => {
  router.push(`/editor/${templateId}`)
}

onMounted(() => {
  const cats = ['Greeting Card', 'Postcard', 'Flyer', 'Brochure']
  setTimeout(() => {
    templates.value = Array.from({ length: 9 }, (_, i) => ({
      id: `template-${i + 1}`,
      name: `Template ${i + 1}`,
      category: cats[i % cats.length],
    }))
    isLoading.value = false
  }, 1000)
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
