import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Auto-zoom camera to fit a model's bounding box with padding.
 */
export function fitCameraToModel(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  padding = 1.5,
): void {
  const box = new THREE.Box3().setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  const distance = (maxDim * padding) / (2 * Math.tan(fov / 2))

  camera.position.set(
    center.x + distance * 0.5,
    center.y + distance * 0.4,
    center.z + distance,
  )

  controls.target.copy(center)
  controls.update()
  camera.updateProjectionMatrix()
}
