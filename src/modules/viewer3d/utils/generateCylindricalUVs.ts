import * as THREE from 'three'

/**
 * Generate cylindrical UV coordinates around the WORLD Y axis for a mesh whose
 * existing UVs are missing or degenerate (e.g. the coffee mug body, which ships
 * with all-zero UVs).
 *
 * When `worldMatrix` is supplied, positions are first transformed into world space.
 * This is essential because many mesh-local coordinate systems don't have Y as the
 * up axis — e.g., the coffee mug ships from SketchUp with local Z as up; its parent
 * matrix rotates so that local Z → world Y. Wrapping cylindrically around local Y
 * (which is HORIZONTAL in the mug's mesh-local space) would put the design in
 * nonsense locations.
 *
 * U is computed from the angle around the world Y axis: atan2(z - centerZ, x - centerX).
 * The angular origin (U=0.5) sits on the +X side so the seam (U=0/1) is at -X.
 * V increases downward (canvas Y=0 → UV V=0 → top of mesh).
 *
 * To prevent the design from also appearing on interior surfaces of hollow objects
 * (the inside of a mug), each vertex's world-space normal is checked against the
 * radial-outward direction. Vertices whose normals don't point outward (interior
 * walls, top rim, bottom face) are pushed to UV (0, 0) — a region of the texture
 * that always contains the product background color. If the geometry has no normal
 * attribute, the generator falls back to a radius threshold.
 *
 * Returns true when cylindrical UVs were written, false when the geometry already has
 * usable UVs or doesn't have a Y dimension.
 */
export function generateCylindricalUVs(
  geometry: THREE.BufferGeometry,
  worldMatrix?: THREE.Matrix4,
): boolean {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!positions || positions.count === 0) return false

  const existing = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined
  // Only bail if the existing UVs have a usable range. All-zero UVs (like the coffee
  // mug ships with) need regeneration. Cylindrical UVs we previously generated have
  // a full 0..1 range, so we also bail on those and re-use them.
  const hasUsableExistingUVs = (() => {
    if (!existing) return false
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (let i = 0; i < existing.count; i++) {
      const u = existing.getX(i)
      const v = existing.getY(i)
      if (u < minU) minU = u
      if (u > maxU) maxU = u
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    }
    return maxU - minU > 0.01 || maxV - minV > 0.01
  })()
  if (hasUsableExistingUVs) return false

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

  const ySpan = maxY - minY
  if (ySpan === 0) return false

  const centerX = (minX + maxX) / 2
  const centerZ = (minZ + maxZ) / 2

  // Use vertex normals (if present) to identify outside-body vertices: their normal
  // points radially outward from the cylinder axis. Interior walls have inward-pointing
  // normals, top rim and bottom face have vertical normals — none of these should
  // receive the design.
  const normalAttr = geometry.getAttribute('normal') as THREE.BufferAttribute | null
  const normalMatrix = (normalAttr && worldMatrix)
    ? new THREE.Matrix3().getNormalMatrix(worldMatrix)
    : null
  const wnormal = new THREE.Vector3()

  // Fallback for meshes without normals: assume outside-body verts sit at the maximum
  // distance from the cylinder axis. Anything below 92% of the max radius is excluded.
  let maxR = 0
  if (!normalAttr) {
    for (let i = 0; i < positions.count; i++) {
      const dx = wpos[i * 3] - centerX
      const dz = wpos[i * 3 + 2] - centerZ
      const r = Math.sqrt(dx * dx + dz * dz)
      if (r > maxR) maxR = r
    }
  }
  const radiusThreshold = maxR * 0.92

  const uvs = new Float32Array(positions.count * 2)
  const TWO_PI = Math.PI * 2

  for (let i = 0; i < positions.count; i++) {
    const x = wpos[i * 3] - centerX
    const y = wpos[i * 3 + 1]
    const z = wpos[i * 3 + 2] - centerZ
    const r = Math.sqrt(x * x + z * z)

    let isOutside: boolean
    if (normalAttr) {
      wnormal.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i))
      if (normalMatrix) wnormal.applyNormalMatrix(normalMatrix)
      wnormal.normalize()
      // dot product of the normal with the radial-outward direction (in XZ plane).
      // > 0.5 means the normal is mostly pointing outward → outside body surface.
      const radDot = r > 1e-6 ? (wnormal.x * x + wnormal.z * z) / r : 0
      isOutside = radDot > 0.5
    } else {
      isOutside = r >= radiusThreshold
    }

    if (!isOutside) {
      // Interior surface, top rim, or bottom face — sample background-color region
      uvs[i * 2] = 0
      uvs[i * 2 + 1] = 0
      continue
    }

    // Angle around the world Y axis. atan2(z, x) returns -π..π:
    //   x>0, z=0 → 0       (+X side)
    //   x=0, z>0 → π/2     (+Z side, "front")
    //   x<0, z=0 → ±π      (-X side, the seam)
    //   x=0, z<0 → -π/2    (-Z side)
    // Map -π..π → 0..1 with +X at U=0.5 so the seam stays at U=0/U=1 on the -X side.
    const angle = Math.atan2(z, x)
    const u = angle / TWO_PI + 0.5

    // V increases downward (image-top at low canvas Y → low UV V → top of mesh).
    const v = (maxY - y) / ySpan

    uvs[i * 2] = u
    uvs[i * 2 + 1] = v
  }

  // If an existing UV attribute is present (even all-zero, e.g. the coffee mug),
  // update its underlying array in place rather than replacing the attribute.
  // three.js caches a VAO keyed by geometry + program, so swapping the attribute
  // object can leave the cached VAO pointing at the old, stale buffer even after
  // setAttribute — updating in place with needsUpdate=true is the reliable path.
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
