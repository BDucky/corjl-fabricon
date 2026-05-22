import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { useViewer3dStore } from '../store'

export function useTurntableExport(
  getRenderer: () => THREE.WebGLRenderer | null,
  getScene: () => THREE.Scene | null,
  getCamera: () => THREE.PerspectiveCamera | null,
  getControls: () => OrbitControls | null,
) {
  const store = useViewer3dStore()

  async function exportTurntableGif(): Promise<void> {
    const r = getRenderer()
    const s = getScene()
    const cam = getCamera()
    const ctrl = getControls()
    if (!r || !s || !cam || !ctrl) return

    store.isExporting = true
    store.exportProgress = 0

    const frameCount = store.turntableFrameCount
    const frameDelay = store.turntableFrameDelay

    // Cap GIF size at 640x640
    const maxSize = 640
    const aspect = cam.aspect
    let width: number
    let height: number
    if (aspect >= 1) {
      width = maxSize
      height = Math.round(maxSize / aspect)
    } else {
      height = maxSize
      width = Math.round(maxSize * aspect)
    }

    // Save current renderer state
    const prevSize = new THREE.Vector2()
    r.getSize(prevSize)
    const prevPixelRatio = r.getPixelRatio()
    const prevCamPos = cam.position.clone()
    const prevTarget = ctrl.target.clone()
    const prevClearAlpha = r.getClearAlpha()
    const prevClearColor = new THREE.Color()
    r.getClearColor(prevClearColor)

    // Force pixelRatio=1 so the drawing buffer matches width×height exactly —
    // gl.readPixels(0, 0, width, height) below assumes a 1:1 buffer. On retina
    // screens the live viewer runs at devicePixelRatio≥2, which would make the
    // buffer 2× larger than requested and the readPixels call would only
    // capture the bottom-left quadrant of the rendered frame.
    r.setPixelRatio(1)
    r.setSize(width, height)
    cam.aspect = width / height
    cam.updateProjectionMatrix()

    // Capture frames by orbiting camera around the target
    const frames: Uint8Array[] = []
    const startAngle = Math.atan2(
      prevCamPos.x - prevTarget.x,
      prevCamPos.z - prevTarget.z,
    )
    const radius = Math.sqrt(
      Math.pow(prevCamPos.x - prevTarget.x, 2) +
      Math.pow(prevCamPos.z - prevTarget.z, 2),
    )
    const camY = prevCamPos.y

    for (let i = 0; i < frameCount; i++) {
      const angle = startAngle + (i / frameCount) * Math.PI * 2
      cam.position.set(
        prevTarget.x + Math.sin(angle) * radius,
        camY,
        prevTarget.z + Math.cos(angle) * radius,
      )
      ctrl.target.copy(prevTarget)
      ctrl.update()
      cam.updateProjectionMatrix()
      r.render(s, cam)

      // Read pixels
      const gl = r.getContext()
      const pixels = new Uint8Array(width * height * 4)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

      // Flip Y (WebGL reads bottom-up)
      const flipped = new Uint8Array(width * height * 4)
      const rowSize = width * 4
      for (let row = 0; row < height; row++) {
        const srcOffset = row * rowSize
        const dstOffset = (height - 1 - row) * rowSize
        flipped.set(pixels.subarray(srcOffset, srcOffset + rowSize), dstOffset)
      }
      frames.push(flipped)

      store.exportProgress = Math.round(((i + 1) / frameCount) * 50)

      // Yield to keep UI responsive
      if (i % 4 === 0) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      }
    }

    // Restore renderer state immediately
    cam.position.copy(prevCamPos)
    ctrl.target.copy(prevTarget)
    ctrl.update()
    r.setPixelRatio(prevPixelRatio)
    r.setSize(prevSize.x, prevSize.y)
    cam.aspect = prevSize.x / prevSize.y
    cam.updateProjectionMatrix()
    r.setClearColor(prevClearColor, prevClearAlpha)
    r.render(s, cam)

    // Encode GIF
    const gif = GIFEncoder()

    for (let i = 0; i < frames.length; i++) {
      const rgba = frames[i]
      const palette = quantize(rgba, 256)
      const index = applyPalette(rgba, palette)
      gif.writeFrame(index, width, height, { palette, delay: frameDelay })
      store.exportProgress = 50 + Math.round(((i + 1) / frames.length) * 50)

      // Yield for large frame counts
      if (i % 6 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
      }
    }

    gif.finish()

    // Download
    const output = gif.bytes()
    const blob = new Blob([output.buffer as ArrayBuffer], { type: 'image/gif' })
    const url = URL.createObjectURL(blob)
    const modelName = store.activeModel?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'mockup'
    const a = document.createElement('a')
    a.href = url
    a.download = `${modelName}-turntable-${Date.now()}.gif`
    a.click()
    URL.revokeObjectURL(url)

    store.isExporting = false
    store.exportProgress = 0
  }

  return { exportTurntableGif }
}
