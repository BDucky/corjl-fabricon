import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PrintAreaUV } from '../types'

export interface FrameRestoreState {
  position: THREE.Vector3
  target: THREE.Vector3
  aspect: number
}

/**
 * Position the camera along +Z so the print-area region of the model's target
 * meshes fills `fillRatio` of the rendered frame. Used by the Imagine flow's
 * IDM-VTON capture path — feeding the try-on model a tightly-cropped, flat
 * front view of the printed design measurably improves design fidelity in the
 * output (the model has more pixels to learn from). Returns null when no
 * qualifying vertices are found so the caller can fall back to the user's
 * current camera.
 */
export function framePrintArea(opts: {
  model: THREE.Object3D
  targetMeshNames: string[]
  targetMaterialNames: string[]
  printAreaUV: PrintAreaUV
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  aspect?: number
  fillRatio?: number
}): FrameRestoreState | null {
  const { model, targetMeshNames, targetMaterialNames, printAreaUV, camera, controls } = opts
  const fillRatio = opts.fillRatio ?? 0.8
  const aspect = opts.aspect ?? camera.aspect

  const meshes: THREE.Mesh[] = []
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const matName = (child.material as THREE.MeshStandardMaterial)?.name
    const isTarget =
      (targetMeshNames.length === 0 && targetMaterialNames.length === 0) ||
      targetMeshNames.includes(child.name) ||
      (matName != null && targetMaterialNames.includes(matName))
    if (isTarget) meshes.push(child)
  })
  if (meshes.length === 0) return null

  const box = new THREE.Box3()
  const tmp = new THREE.Vector3()
  let found = false

  for (const mesh of meshes) {
    const geom = mesh.geometry
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute | null
    const pos = geom.getAttribute('position') as THREE.BufferAttribute | null
    if (!uv || !pos) continue
    mesh.updateWorldMatrix(true, false)
    const matrix = mesh.matrixWorld

    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i)
      const v = uv.getY(i)
      if (u < printAreaUV.minU || u > printAreaUV.maxU) continue
      if (v < printAreaUV.minV || v > printAreaUV.maxV) continue
      tmp.fromBufferAttribute(pos, i).applyMatrix4(matrix)
      box.expandByPoint(tmp)
      found = true
    }
  }

  if (!found || box.isEmpty()) return null

  const restore: FrameRestoreState = {
    position: camera.position.clone(),
    target: controls.target.clone(),
    aspect: camera.aspect,
  }

  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  const fovV = (camera.fov * Math.PI) / 180
  const halfV = fovV / 2
  const halfH = Math.atan(Math.tan(halfV) * aspect)
  const distV = size.y / 2 / Math.tan(halfV) / fillRatio
  const distH = size.x / 2 / Math.tan(halfH) / fillRatio
  // Add half the print area's depth so the back of the curved chest doesn't
  // clip the near plane, plus a small fixed margin.
  const distance = Math.max(distV, distH) + size.z / 2 + 0.1

  camera.aspect = aspect
  camera.position.set(center.x, center.y, center.z + distance)
  controls.target.copy(center)
  controls.update()
  camera.updateProjectionMatrix()

  return restore
}

export function restoreCameraState(
  state: FrameRestoreState,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): void {
  camera.position.copy(state.position)
  controls.target.copy(state.target)
  camera.aspect = state.aspect
  controls.update()
  camera.updateProjectionMatrix()
}
