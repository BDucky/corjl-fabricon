import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export interface CapturedPhoto {
  file: File
  previewUrl: string
}

/**
 * Capture a photo for the Imagine flow. Returns a File + object URL preview,
 * or null if the user cancelled.
 *
 * Variant of viewer3d's `useDesignInput.loadFromCamera` that does NOT mutate
 * the viewer3d store — the Imagine flow owns its own state.
 */
export async function captureFacePhoto(): Promise<CapturedPhoto | null> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
    promptLabelHeader: 'Add your photo',
    promptLabelPhoto: 'Choose from gallery',
    promptLabelPicture: 'Take photo',
  }).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : ''
    if (/cancel/i.test(msg)) return null
    throw e
  })

  if (!photo) return null
  const webPath = photo.webPath
  if (!webPath) throw new Error('No image returned from camera')

  const response = await fetch(webPath)
  const blob = await response.blob()
  const ext = photo.format || 'jpg'
  const file = new File([blob], `face-${Date.now()}.${ext}`, {
    type: blob.type || `image/${ext}`,
  })

  return { file, previewUrl: URL.createObjectURL(blob) }
}
