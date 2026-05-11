import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useExporter(
  renderer: () => THREE.WebGLRenderer | null,
  scene: () => THREE.Scene | null,
  camera: () => THREE.PerspectiveCamera | null,
) {
  const store = useViewer3dStore()

  async function exportImage(): Promise<void> {
    const r = renderer()
    const s = scene()
    const cam = camera()
    if (!r || !s || !cam) return

    const { width, height, transparentBackground } = store.exportSettings

    // Save current state
    const prevSize = new THREE.Vector2()
    r.getSize(prevSize)
    const prevClearAlpha = r.getClearAlpha()
    const prevClearColor = new THREE.Color()
    r.getClearColor(prevClearColor)

    // Resize for export
    r.setSize(width, height)
    cam.aspect = width / height
    cam.updateProjectionMatrix()

    if (transparentBackground) {
      r.setClearAlpha(0)
    }

    r.render(s, cam)

    // Export
    const canvas = r.domElement
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )

    // Restore
    r.setSize(prevSize.x, prevSize.y)
    cam.aspect = prevSize.x / prevSize.y
    cam.updateProjectionMatrix()
    r.setClearColor(prevClearColor, prevClearAlpha)
    r.render(s, cam)

    if (!blob) return

    // Download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mockup-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { exportImage }
}
