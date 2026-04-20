import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useViewer3dStore } from '../store'
import { useDesignsStore } from '@stores/designs'
import { BUNDLED_MODELS } from '../constants'

export function useURLParams() {
  const route = useRoute()
  const store = useViewer3dStore()

  onMounted(async () => {
    const { design, model, color } = route.query as Record<string, string | undefined>
    const designId = route.params.designId as string | undefined

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

    // Load design from route param (designId from /editor/:designId)
    if (designId) {
      try {
        const designsStore = useDesignsStore()
        const detail = await designsStore.fetchDesignDetail(designId)
        if (detail) {
          const thumbnailUrl = designsStore.getPrimaryPageThumbnail(detail)
          if (thumbnailUrl) {
            store.designName = detail.designName
            await store.setDesignFromUrl(thumbnailUrl)
          }
        }
      } catch {
        // Silently fail — user can upload manually
      }
    }
    // Load design from query param (legacy ?design=url support)
    else if (design) {
      try {
        await store.setDesignFromUrl(design)
      } catch {
        // Silently fail — user can upload manually
      }
    }

    // Opening a design via /editor/:designId should always pick the
    // highest-match product for the design just loaded — the Pinia store
    // persists activeModelId across navigations, so without this the viewer
    // would stick on whatever model the user picked in the previous session.
    // productSuggestions is sorted by score desc; if the design didn't load,
    // it returns all models with a neutral score and we still fall back to a
    // visible bundled model so the viewer isn't empty.
    const best = store.productSuggestions[0]?.model ?? BUNDLED_MODELS.find((m) => !m.hidden)
    if (best) store.selectModel(best.id)
  })
}
