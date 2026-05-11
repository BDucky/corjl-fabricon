import * as THREE from 'three'

/**
 * Generate planar UV coordinates for a flat panel mesh that has no UVs (or whose
 * existing UVs are degenerate, e.g. all-zero).
 *
 * When `worldMatrix` is supplied, positions are first transformed into world space
 * before the projection axis is chosen. This is essential for models whose local
 * coordinate system doesn't match world up — e.g., the standee mesh ships from
 * SketchUp with Z-up local geometry, but its parent matrix rotates the panel so
 * that local Z becomes world Y. Using local positions would pick the wrong axis
 * as the "panel normal" and produce upside-down/sideways UVs.
 *
 * The smallest world-space dimension is treated as the panel's "thickness" / normal,
 * and positions are projected onto the plane formed by the remaining two axes.
 *
 * The mapping uses a uniform scale based on the LARGER of the two in-plane dimensions,
 * so the panel's physical aspect ratio is preserved in UV space — a square design will
 * appear square on the panel rather than stretched. The shorter dimension is centered
 * within [0, 1] UV space.
 *
 * Returns true when planar UVs were generated, false when the geometry already has
 * usable UVs or doesn't look like a flat panel (smallest dim > 10% of largest).
 */
export function generatePlanarUVs(
  geometry: THREE.BufferGeometry,
  worldMatrix?: THREE.Matrix4,
): boolean {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!positions || positions.count === 0) return false

  const existing = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined
  if (existing) {
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (let i = 0; i < existing.count; i++) {
      const u = existing.getX(i)
      const v = existing.getY(i)
      if (u < minU) minU = u
      if (u > maxU) maxU = u
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    }
    // Already has non-degenerate UVs — leave them alone
    if (maxU - minU > 0.01 || maxV - minV > 0.01) return false
  }

  // Project positions into world space (or copy if no matrix supplied)
  const wpos = new Float32Array(positions.count * 3)
  const tmp = new THREE.Vector3()
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity
  for (let i = 0; i < positions.count; i++) {
    tmp.set(positions.getX(i), positions.getY(i), positions.getZ(i))
    if (worldMatrix) tmp.applyMatrix4(worldMatrix)
    wpos[i * 3] = tmp.x
    wpos[i * 3 + 1] = tmp.y
    wpos[i * 3 + 2] = tmp.z
    if (tmp.x < minX) minX = tmp.x
    if (tmp.x > maxX) maxX = tmp.x
    if (tmp.y < minY) minY = tmp.y
    if (tmp.y > maxY) maxY = tmp.y
    if (tmp.z < minZ) minZ = tmp.z
    if (tmp.z > maxZ) maxZ = tmp.z
  }

  const dx = maxX - minX
  const dy = maxY - minY
  const dz = maxZ - minZ
  const maxDim = Math.max(dx, dy, dz)
  if (maxDim === 0) return false

  // Only treat as a panel if the smallest dimension is much smaller than the largest
  const minDim = Math.min(dx, dy, dz)
  if (minDim / maxDim > 0.10) return false

  // Pick which axes to use for U and V based on the panel's orientation in WORLD space.
  // World convention: +Y is up. The texture is uploaded with flipY=false, so canvas Y=0
  // corresponds to UV V=0 — meaning image-top must end up at UV V=0. To make image-top
  // visually appear at the TOP of the panel (= high world Y for a vertical panel),
  // V must DECREASE as world Y increases.
  let getU: (i: number) => number
  let getV: (i: number) => number
  let uMin: number, vMin: number
  let uSpan: number, vSpan: number

  if (dx <= dy && dx <= dz) {
    // X is the panel normal — vertical panel facing along X (e.g. side panel).
    // Use Z for U and -Y for V so image-top → high world Y → top of panel.
    getU = (i) => wpos[i * 3 + 2]
    getV = (i) => -wpos[i * 3 + 1]
    uMin = minZ; vMin = -maxY
    uSpan = dz; vSpan = dy
  } else if (dy <= dx && dy <= dz) {
    // Y is the panel normal — horizontal panel (tabletop).
    // Looking down from +Y, camera-right is +X and camera-up (toward viewer) is -Z.
    // → U = +X, V = +Z (so the design's "top" lands at the far side of the panel).
    getU = (i) => wpos[i * 3]
    getV = (i) => wpos[i * 3 + 2]
    uMin = minX; vMin = minZ
    uSpan = dx; vSpan = dz
  } else {
    // Z is the panel normal — vertical front-facing panel (the common standee case).
    // Looking from +Z back toward -Z, camera-right is +X and camera-up is +Y.
    // → U = +X (right), V = -Y (so image-top → high world Y → top of panel).
    getU = (i) => wpos[i * 3]
    getV = (i) => -wpos[i * 3 + 1]
    uMin = minX; vMin = -maxY
    uSpan = dx; vSpan = dy
  }

  const refSpan = Math.max(uSpan, vSpan)
  if (refSpan === 0) return false

  // Center the panel within [0, 1] UV so a square design preserves its aspect ratio
  const uOffset = (1 - uSpan / refSpan) / 2
  const vOffset = (1 - vSpan / refSpan) / 2

  const uvs = new Float32Array(positions.count * 2)
  for (let i = 0; i < positions.count; i++) {
    uvs[i * 2] = uOffset + (getU(i) - uMin) / refSpan
    uvs[i * 2 + 1] = vOffset + (getV(i) - vMin) / refSpan
  }
  // In-place update to avoid stale VAO bindings (see generateCylindricalUVs.ts).
  if (existing && existing.array.length >= uvs.length && existing.itemSize === 2) {
    const target = existing.array as Float32Array
    target.set(uvs)
    existing.needsUpdate = true
  } else {
    const uvAttr = new THREE.BufferAttribute(uvs, 2)
    uvAttr.needsUpdate = true
    geometry.setAttribute('uv', uvAttr)
  }
  return true
}
