import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { zipSync } from 'fflate'
import { useViewer3dStore } from '../store'
import { EXPORT_ANGLES } from '../constants'

export function useMultiAngleExport(
  renderer: () => THREE.WebGLRenderer | null,
  scene: () => THREE.Scene | null,
  camera: () => THREE.PerspectiveCamera | null,
  controls: () => OrbitControls | null,
) {
  const store = useViewer3dStore()

  function captureAtAngle(
    r: THREE.WebGLRenderer,
    s: THREE.Scene,
    cam: THREE.PerspectiveCamera,
    ctrl: OrbitControls,
    position: [number, number, number],
    target: [number, number, number],
  ): Promise<Uint8Array> {
    return new Promise((resolve) => {
      cam.position.set(...position)
      ctrl.target.set(...target)
      ctrl.update()
      cam.updateProjectionMatrix()
      r.render(s, cam)

      r.domElement.toBlob((blob) => {
        if (!blob) {
          resolve(new Uint8Array(0))
          return
        }
        blob.arrayBuffer().then((buf) => {
          resolve(new Uint8Array(buf))
        })
      }, 'image/png')
    })
  }

  async function exportAllAngles(): Promise<void> {
    const r = renderer()
    const s = scene()
    const cam = camera()
    const ctrl = controls()
    if (!r || !s || !cam || !ctrl) return

    store.isExporting = true
    store.exportProgress = 0

    const { width, height, transparentBackground } = store.exportSettings

    // Save current state
    const prevSize = new THREE.Vector2()
    r.getSize(prevSize)
    const prevCamPos = cam.position.clone()
    const prevTarget = ctrl.target.clone()
    const prevClearAlpha = r.getClearAlpha()
    const prevClearColor = new THREE.Color()
    r.getClearColor(prevClearColor)

    // Set export size
    r.setSize(width, height)
    cam.aspect = width / height
    cam.updateProjectionMatrix()

    if (transparentBackground) {
      r.setClearAlpha(0)
    }

    const files: Record<string, Uint8Array> = {}
    const modelName = store.activeModel?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'mockup'

    for (let i = 0; i < EXPORT_ANGLES.length; i++) {
      const angle = EXPORT_ANGLES[i]
      store.exportProgress = Math.round(((i + 1) / EXPORT_ANGLES.length) * 100)

      const data = await captureAtAngle(r, s, cam, ctrl, angle.position, angle.target)
      if (data.length > 0) {
        files[`${modelName}-${angle.id}.png`] = data
      }
    }

    // Restore camera
    cam.position.copy(prevCamPos)
    ctrl.target.copy(prevTarget)
    ctrl.update()

    // Restore renderer
    r.setSize(prevSize.x, prevSize.y)
    cam.aspect = prevSize.x / prevSize.y
    cam.updateProjectionMatrix()
    r.setClearColor(prevClearColor, prevClearAlpha)
    r.render(s, cam)

    // Create ZIP
    const zipped = zipSync(files)

    // Download
    const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${modelName}-all-angles-${Date.now()}.zip`
    a.click()
    URL.revokeObjectURL(url)

    store.isExporting = false
    store.exportProgress = 0
  }

  return { exportAllAngles }
}
