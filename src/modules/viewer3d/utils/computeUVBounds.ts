import * as THREE from 'three'
import type { PrintAreaUV } from '../types'

/**
 * Compute the UV bounding box of target meshes within a loaded 3D model.
 * Used to automatically determine the printable area in UV space where designs should be placed.
 */
export function computeUVBounds(
  model: THREE.Object3D,
  targetMeshNames: string[],
  targetMaterialNames: string[],
): PrintAreaUV | null {
  let minU = Infinity
  let maxU = -Infinity
  let minV = Infinity
  let maxV = -Infinity
  let found = false

  const meshes: THREE.Mesh[] = []

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const isTarget =
      (targetMeshNames.length === 0 && targetMaterialNames.length === 0) ||
      targetMeshNames.includes(child.name) ||
      (targetMaterialNames.length > 0 &&
        (child.material as THREE.MeshStandardMaterial)?.name != null &&
        targetMaterialNames.includes((child.material as THREE.MeshStandardMaterial).name))

    if (isTarget) meshes.push(child)
  })

  // Fallback: if no target matches, use all meshes
  if (meshes.length === 0) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child)
    })
  }

  for (const mesh of meshes) {
    const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute | null
    if (!uv) continue

    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i)
      const v = uv.getY(i)
      minU = Math.min(minU, u)
      maxU = Math.max(maxU, u)
      minV = Math.min(minV, v)
      maxV = Math.max(maxV, v)
    }
    found = true
  }

  if (!found) return null

  // Detect degenerate UV data (all same point or near-zero area)
  if (maxU - minU < 0.01 || maxV - minV < 0.01) return null

  // Clamp to [0, 1] for models with out-of-range UVs
  return {
    minU: Math.max(0, minU),
    maxU: Math.min(1, maxU),
    minV: Math.max(0, minV),
    maxV: Math.min(1, maxV),
  }
}
