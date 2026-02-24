import { computed } from 'vue'
import { useViewer3dStore } from '../store'
import type { ProductSuggestion } from '../types'

export function useProductMatcher() {
  const store = useViewer3dStore()

  const suggestions = computed<ProductSuggestion[]>(() => store.productSuggestions)

  const bestMatch = computed<ProductSuggestion | null>(() =>
    suggestions.value.length > 0 ? suggestions.value[0] : null,
  )

  function selectProduct(modelId: string) {
    store.selectModel(modelId)
  }

  function selectBestMatch() {
    if (bestMatch.value) {
      store.selectModel(bestMatch.value.model.id)
    }
  }

  return {
    suggestions,
    bestMatch,
    selectProduct,
    selectBestMatch,
  }
}
