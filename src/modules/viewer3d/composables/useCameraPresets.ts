import { watch } from 'vue'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useViewer3dStore } from '../store'
import type { SavedCameraState } from '../types'

export function useCameraPresets(
  camera: () => THREE.PerspectiveCamera | null,
  controls: () => OrbitControls | null,
) {
  const store = useViewer3dStore()
  let animationId: number | null = null

  function animateToPosition(
    position: [number, number, number],
    target: [number, number, number],
    duration = 600,
  ) {
    const cam = camera()
    const ctrl = controls()
    if (!cam || !ctrl) return

    if (animationId !== null) {
      cancelAnimationFrame(animationId)
    }

    const startPos = cam.position.clone()
    const startTarget = ctrl.target.clone()
    const endPos = new THREE.Vector3(...position)
    const endTarget = new THREE.Vector3(...target)
    const startTime = performance.now()

    function step() {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3)

      cam!.position.lerpVectors(startPos, endPos, ease)
      ctrl!.target.lerpVectors(startTarget, endTarget, ease)
      ctrl!.update()

      if (t < 1) {
        animationId = requestAnimationFrame(step)
      } else {
        animationId = null
      }
    }

    step()
  }

  function saveCurrentAsCustom(): SavedCameraState {
    const cam = camera()
    const ctrl = controls()
    if (!cam || !ctrl) {
      return { positionX: 0, positionY: 0, positionZ: 3, targetX: 0, targetY: 0, targetZ: 0 }
    }

    return {
      positionX: cam.position.x,
      positionY: cam.position.y,
      positionZ: cam.position.z,
      targetX: ctrl.target.x,
      targetY: ctrl.target.y,
      targetZ: ctrl.target.z,
    }
  }

  // Watch camera preset changes (skip 'custom')
  watch(
    () => store.activeCameraPreset,
    (preset) => {
      if (preset && preset.id !== 'custom') {
        animateToPosition(preset.position, preset.target)
      }
    },
  )

  return {
    animateToPosition,
    saveCurrentAsCustom,
  }
}
