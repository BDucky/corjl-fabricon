import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useViewer3dStore } from '../store'
import { BUNDLED_MODELS } from '../constants'

export function useURLParams() {
  const route = useRoute()
  const store = useViewer3dStore()

  onMounted(async () => {
    const { design, model, color } = route.query as Record<string, string | undefined>

    // Apply model selection from URL
    if (model) {
      const matchedModel = BUNDLED_MODELS.find(
        (m) => m.id === model || m.name.toLowerCase().replace(/\s+/g, '-') === model.toLowerCase(),
      )
      if (matchedModel) {
        store.selectModel(matchedModel.id)
      }
    }

    // Apply product color from URL
    if (color) {
      const hex = color.startsWith('#') ? color : `#${color}`
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        store.setProductColor(hex)
      }
    }

    // Load design from URL
    if (design) {
      try {
        await store.setDesignFromUrl(design)
      } catch {
        // Silently fail — user can upload manually
      }
    }
  })
}
