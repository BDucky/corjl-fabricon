import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useExporter(
  renderer: () => THREE.WebGLRenderer | null,
  scene: () => THREE.Scene | null,
  camera: () => THREE.PerspectiveCamera | null,
) {
  const store = useViewer3dStore()

  async function captureBlob(opts?: { width?: number; height?: number; transparent?: boolean }): Promise<Blob | null> {
    const r = renderer()
    const s = scene()
    const cam = camera()
    if (!r || !s || !cam) return null

    const width = opts?.width ?? store.exportSettings.width
    const height = opts?.height ?? store.exportSettings.height
    const transparent = opts?.transparent ?? store.exportSettings.transparentBackground

    const prevSize = new THREE.Vector2()
    r.getSize(prevSize)
    const prevClearAlpha = r.getClearAlpha()
    const prevClearColor = new THREE.Color()
    r.getClearColor(prevClearColor)

    r.setSize(width, height)
    cam.aspect = width / height
    cam.updateProjectionMatrix()
    if (transparent) r.setClearAlpha(0)

    r.render(s, cam)

    const blob = await new Promise<Blob | null>((resolve) =>
      r.domElement.toBlob(resolve, 'image/png'),
    )

    r.setSize(prevSize.x, prevSize.y)
    cam.aspect = prevSize.x / prevSize.y
    cam.updateProjectionMatrix()
    r.setClearColor(prevClearColor, prevClearAlpha)
    r.render(s, cam)

    return blob
  }

  async function exportImage(): Promise<void> {
    const blob = await captureBlob()
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mockup-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { exportImage, captureBlob }
}
