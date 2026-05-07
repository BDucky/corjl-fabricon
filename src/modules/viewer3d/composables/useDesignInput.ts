import { ref } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
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

  async function loadFromCamera(): Promise<DesignInput | null> {
    isLoading.value = true
    error.value = null

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Add design',
        promptLabelPhoto: 'Choose from gallery',
        promptLabelPicture: 'Take photo',
      })

      const webPath = photo.webPath
      if (!webPath) throw new Error('No image returned from camera')

      // Wrap the captured photo as a File so the existing setDesignFromFile
      // path handles blob URL, dimensions, name, auto-fit, and cleanup.
      const response = await fetch(webPath)
      const blob = await response.blob()
      const ext = photo.format || 'jpg'
      const file = new File([blob], `camera-${Date.now()}.${ext}`, {
        type: blob.type || `image/${ext}`,
      })

      const result = await store.setDesignFromFile(file)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // Capacitor throws "User cancelled photos app" on dismissal — not an error.
      if (/cancel/i.test(msg)) return null
      error.value = msg || 'Failed to capture photo'
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
    loadFromCamera,
    clearDesign,
  }
}
