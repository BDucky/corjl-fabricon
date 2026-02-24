import { ref } from 'vue'
import { useViewer3dStore } from '../store'
import type { DesignInput } from '../types'

export function useDesignInput() {
  const store = useViewer3dStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadFromFile(file: File): Promise<DesignInput | null> {
    isLoading.value = true
    error.value = null

    try {
      const result = await store.setDesignFromFile(file)
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load file'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadFromUrl(url: string): Promise<DesignInput | null> {
    if (!url.trim()) {
      error.value = 'Please enter a URL'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await store.setDesignFromUrl(url.trim())
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load image from URL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  function clearDesign() {
    store.clearDesign()
    error.value = null
  }

  return {
    isLoading,
    error,
    loadFromFile,
    loadFromUrl,
    clearDesign,
  }
}
