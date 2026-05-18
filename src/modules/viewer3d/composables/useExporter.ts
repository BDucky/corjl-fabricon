import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useExporter(
  renderer: () => THREE.WebGLRenderer | null,
  scene: () => THREE.Scene | null,
  camera: () => THREE.PerspectiveCamera | null,
) {
  const store = useViewer3dStore()

  async function captureBlob(opts?: {
    width?: number
    height?: number
    transparent?: boolean
    cleanBackground?: boolean
  }): Promise<Blob | null> {
    const r = renderer()
    const s = scene()
    const cam = camera()
    if (!r || !s || !cam) return null

    const width = opts?.width ?? store.exportSettings.width
    const height = opts?.height ?? store.exportSettings.height
    const transparent = opts?.transparent ?? store.exportSettings.transparentBackground
    const cleanBackground = opts?.cleanBackground ?? false

    const prevSize = new THREE.Vector2()
    r.getSize(prevSize)
    const prevClearAlpha = r.getClearAlpha()
    const prevClearColor = new THREE.Color()
    r.getClearColor(prevClearColor)

    // For `cleanBackground` captures (used by the Imagine flow so the garment
    // try-on model sees a flat product-catalog-style image), hide the helpers
    // and swap the scene background for solid white. Restored after render.
    const hidden: THREE.Object3D[] = []
    const prevSceneBackground = s.background
    if (cleanBackground) {
      for (const name of ['__grid__', '__scene_staging__', '__ground_shadow__']) {
        const obj = s.getObjectByName(name)
        if (obj && obj.visible) {
          obj.visible = false
          hidden.push(obj)
        }
      }
      s.background = new THREE.Color(0xffffff)
      r.setClearColor(0xffffff, 1)
    }

    r.setSize(width, height)
    cam.aspect = width / height
    cam.updateProjectionMatrix()
    if (transparent && !cleanBackground) r.setClearAlpha(0)

    r.render(s, cam)

    const blob = await new Promise<Blob | null>((resolve) =>
      r.domElement.toBlob(resolve, 'image/png'),
    )

    r.setSize(prevSize.x, prevSize.y)
    cam.aspect = prevSize.x / prevSize.y
    cam.updateProjectionMatrix()
    r.setClearColor(prevClearColor, prevClearAlpha)
    if (cleanBackground) {
      s.background = prevSceneBackground
      for (const obj of hidden) obj.visible = true
    }
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
