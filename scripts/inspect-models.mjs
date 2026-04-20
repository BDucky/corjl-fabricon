// Pure-Node GLB parser — extracts mesh names, materials, position/UV bounds.
// Determines a recommended `printAreaUV` based on the front-chest region of the model.
//
// Doesn't decode Draco compression. If a primitive uses Draco, it's flagged.
import fs from 'node:fs'
import path from 'node:path'

const MODELS_DIR = '/Users/admin/Documents/work/corjl-fabricon/public/models'

const MODELS = [
  { id: 'tshirt', file: 'tshirt.glb', targetMeshNames: ['T_Shirt_male', 'Mesh'], targetMaterialNames: [] },
  { id: 'polo', file: 'polo.glb', targetMeshNames: ['Short Sleeve Polo_Cotton_Heavy_Canvas_FRONT_232020_0'], targetMaterialNames: ['Cotton_Heavy_Canvas_FRONT_232020'] },
  { id: 'hoodie', file: 'hoodie.glb', targetMeshNames: ['Object_3', 'Object_4', 'Object_5'], targetMaterialNames: ['HOODIE_FRONT_5197361'] },
  { id: 'tanktop', file: 'tanktop.glb', targetMeshNames: ['Object_2'], targetMaterialNames: ['FABRIC_3_FRONT_2680'] },
  { id: 'totebag', file: 'toteBag.glb', targetMeshNames: ['Object_27'], targetMaterialNames: ['Mat_Truoc_Tui.002'] },
  { id: 'phonecase', file: 'phoneCase.glb', targetMeshNames: ['Plane_PBR_0'], targetMaterialNames: ['material'] },
  { id: 'coffeemug', file: 'coffeeMug.glb', targetMeshNames: ['Mesh.Mug_White Mug_0'], targetMaterialNames: ['White_Mug'] },
  { id: 'cardboardbox', file: 'cardboardBox.glb', targetMeshNames: ['Box_Material_0', 'Box.Big_Material_0', 'Box.Small_Material_0'], targetMaterialNames: ['Material'] },
  { id: 'standee', file: 'standee.glb', targetMeshNames: [], targetMaterialNames: ['material'] },
]

const COMPONENT_TYPE = {
  5120: { name: 'BYTE', size: 1, getter: 'getInt8' },
  5121: { name: 'UNSIGNED_BYTE', size: 1, getter: 'getUint8' },
  5122: { name: 'SHORT', size: 2, getter: 'getInt16' },
  5123: { name: 'UNSIGNED_SHORT', size: 2, getter: 'getUint16' },
  5125: { name: 'UNSIGNED_INT', size: 4, getter: 'getUint32' },
  5126: { name: 'FLOAT', size: 4, getter: 'getFloat32' },
}
const TYPE_COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }

function parseGLB(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const magic = view.getUint32(0, true)
  if (magic !== 0x46546c67) throw new Error('Not a GLB file')
  const version = view.getUint32(4, true)
  const length = view.getUint32(8, true)

  let offset = 12
  let json = null
  let bin = null
  while (offset < length) {
    const chunkLen = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    const dataStart = offset + 8
    if (chunkType === 0x4e4f534a) {
      const jsonBytes = new Uint8Array(buffer.buffer, buffer.byteOffset + dataStart, chunkLen)
      json = JSON.parse(new TextDecoder().decode(jsonBytes))
    } else if (chunkType === 0x004e4942) {
      bin = new Uint8Array(buffer.buffer, buffer.byteOffset + dataStart, chunkLen)
    }
    offset = dataStart + chunkLen
  }
  return { json, bin, version }
}

function readAccessor(json, bin, accessorIndex) {
  const accessor = json.accessors[accessorIndex]
  const bufferView = json.bufferViews[accessor.bufferView]
  const compInfo = COMPONENT_TYPE[accessor.componentType]
  const numComponents = TYPE_COUNT[accessor.type]
  const elementSize = compInfo.size * numComponents
  const stride = bufferView.byteStride ?? elementSize
  const baseOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength)
  const result = []
  for (let i = 0; i < accessor.count; i++) {
    const elem = []
    for (let c = 0; c < numComponents; c++) {
      const byteOffset = baseOffset + i * stride + c * compInfo.size
      elem.push(view[compInfo.getter](byteOffset, true))
    }
    result.push(elem)
  }
  return result
}

// Compose node transforms (TRS or matrix) into a 4x4 column-major matrix
function nodeMatrix(node) {
  if (node.matrix) {
    return node.matrix.slice()
  }
  const t = node.translation ?? [0, 0, 0]
  const r = node.rotation ?? [0, 0, 0, 1]
  const s = node.scale ?? [1, 1, 1]
  // Build TRS matrix: M = T * R * S
  const [x, y, z, w] = r
  const xx = x * x, yy = y * y, zz = z * z
  const xy = x * y, xz = x * z, yz = y * z
  const wx = w * x, wy = w * y, wz = w * z
  const m = [
    (1 - 2 * (yy + zz)) * s[0],
    (2 * (xy + wz)) * s[0],
    (2 * (xz - wy)) * s[0],
    0,
    (2 * (xy - wz)) * s[1],
    (1 - 2 * (xx + zz)) * s[1],
    (2 * (yz + wx)) * s[1],
    0,
    (2 * (xz + wy)) * s[2],
    (2 * (yz - wx)) * s[2],
    (1 - 2 * (xx + yy)) * s[2],
    0,
    t[0], t[1], t[2], 1,
  ]
  return m
}

function multiply(a, b) {
  const out = new Array(16).fill(0)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let v = 0
      for (let k = 0; k < 4; k++) {
        v += a[k * 4 + r] * b[c * 4 + k]
      }
      out[c * 4 + r] = v
    }
  }
  return out
}

function transformPoint(m, p) {
  const [x, y, z] = p
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ]
}

// Walk the scene graph, collecting (mesh primitive, world matrix, mesh node name)
function collectMeshes(json, bin) {
  const meshes = []
  const scene = json.scenes?.[json.scene ?? 0]
  if (!scene) return meshes

  function walk(nodeIdx, parentMatrix) {
    const node = json.nodes[nodeIdx]
    const localMat = nodeMatrix(node)
    const worldMat = multiply(parentMatrix, localMat)
    if (node.mesh != null) {
      const mesh = json.meshes[node.mesh]
      for (const [primIdx, prim] of mesh.primitives.entries()) {
        meshes.push({
          nodeName: node.name ?? `node_${nodeIdx}`,
          meshName: mesh.name ?? `mesh_${node.mesh}`,
          primIdx,
          primitive: prim,
          worldMatrix: worldMat,
          materialName: prim.material != null ? (json.materials?.[prim.material]?.name ?? null) : null,
          isDraco: !!(prim.extensions && prim.extensions.KHR_draco_mesh_compression),
        })
      }
    }
    for (const child of node.children ?? []) {
      walk(child, worldMat)
    }
  }
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  for (const nodeIdx of scene.nodes) walk(nodeIdx, identity)
  return meshes
}

function isTarget(entry, targetMeshNames, targetMaterialNames) {
  if (targetMeshNames.length === 0 && targetMaterialNames.length === 0) return true
  // The Three.js loader sets child.name to the node name (in most GLBs).
  // We check both node name and mesh name to be safe.
  if (targetMeshNames.includes(entry.nodeName)) return true
  if (targetMeshNames.includes(entry.meshName)) return true
  if (entry.materialName && targetMaterialNames.includes(entry.materialName)) return true
  return false
}

function inspectPrimitive(json, bin, entry, modelBox) {
  const prim = entry.primitive
  if (entry.isDraco) {
    return { ...entry, isDraco: true, hasUV: false, error: 'Draco-compressed (cannot decode without lib)' }
  }
  const posIdx = prim.attributes.POSITION
  const uvIdx = prim.attributes.TEXCOORD_0
  if (posIdx == null) return { ...entry, error: 'No POSITION attribute' }

  const positions = readAccessor(json, bin, posIdx)
  const uvs = uvIdx != null ? readAccessor(json, bin, uvIdx) : null

  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
  const worldPositions = positions.map((p) => transformPoint(entry.worldMatrix, p))

  for (let i = 0; i < worldPositions.length; i++) {
    const [x, y, z] = worldPositions[i]
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
    if (uvs) {
      const [u, v] = uvs[i]
      if (u < minU) minU = u; if (u > maxU) maxU = u
      if (v < minV) minV = v; if (v > maxV) maxV = v
    }
  }

  // Sample V values at various world Y heights along the front face — to discover whether
  // higher V = higher Y (collar) or lower Y (waist).
  // Sample U values at various world X positions on the front mid-row — for left/right.
  let yvCorrelation = null
  let xuCorrelation = null
  let frontCentroid = null
  if (uvs && modelBox) {
    const modelHeight = modelBox.maxY - modelBox.minY
    const minX = modelBox.minX, maxX = modelBox.maxX
    const midX = (minX + maxX) / 2
    const xSpan = maxX - minX
    const frontZ = modelBox.minZ + (modelBox.maxZ - modelBox.minZ) * 0.65
    // Sample center column on front face
    let topVerts = [], midVerts = [], lowVerts = []
    let leftVerts = [], centerVerts = [], rightVerts = []
    for (let i = 0; i < worldPositions.length; i++) {
      const [x, y, z] = worldPositions[i]
      if (z < frontZ) continue
      const inMidRow = (y > modelBox.minY + modelHeight * 0.55 && y < modelBox.minY + modelHeight * 0.75)
      if (Math.abs(x - midX) <= xSpan * 0.15) {
        if (y > modelBox.minY + modelHeight * 0.85) topVerts.push(uvs[i][1])
        else if (y > modelBox.minY + modelHeight * 0.55 && y < modelBox.minY + modelHeight * 0.75) midVerts.push(uvs[i][1])
        else if (y < modelBox.minY + modelHeight * 0.25) lowVerts.push(uvs[i][1])
      }
      if (inMidRow) {
        if (x < minX + xSpan * 0.30) leftVerts.push(uvs[i][0])
        else if (x > minX + xSpan * 0.70) rightVerts.push(uvs[i][0])
        else centerVerts.push(uvs[i][0])
      }
    }
    const avg = (a) => a.length ? (a.reduce((s, v) => s + v, 0) / a.length) : null
    yvCorrelation = { top: avg(topVerts), mid: avg(midVerts), low: avg(lowVerts) }
    xuCorrelation = { left: avg(leftVerts), center: avg(centerVerts), right: avg(rightVerts) }

    // Centroid of front-center upper area in UV space (the "where to put design" answer)
    let cuSum = 0, cvSum = 0, cn = 0
    const chestY1 = modelBox.minY + modelHeight * 0.55
    const chestY2 = modelBox.minY + modelHeight * 0.80
    for (let i = 0; i < worldPositions.length; i++) {
      const [x, y, z] = worldPositions[i]
      if (z < frontZ) continue
      if (y < chestY1 || y > chestY2) continue
      if (Math.abs(x - midX) > xSpan * 0.30) continue
      cuSum += uvs[i][0]
      cvSum += uvs[i][1]
      cn++
    }
    if (cn > 0) frontCentroid = { u: cuSum / cn, v: cvSum / cn, count: cn }
  }

  // Find UV bounds for vertices in front-chest region
  let chestUV = null
  if (uvs && modelBox) {
    const modelHeight = modelBox.maxY - modelBox.minY
    const modelWidth = modelBox.maxX - modelBox.minX
    const chestYLow = modelBox.minY + modelHeight * 0.55
    const chestYHigh = modelBox.minY + modelHeight * 0.85
    const chestXLow = modelBox.minX + modelWidth * 0.25
    const chestXHigh = modelBox.minX + modelWidth * 0.75
    const frontZ = modelBox.minZ + (modelBox.maxZ - modelBox.minZ) * 0.65 // front-most 35%

    let cMinU = Infinity, cMaxU = -Infinity, cMinV = Infinity, cMaxV = -Infinity
    let count = 0
    for (let i = 0; i < worldPositions.length; i++) {
      const [x, y, z] = worldPositions[i]
      if (y < chestYLow || y > chestYHigh) continue
      if (x < chestXLow || x > chestXHigh) continue
      if (z < frontZ) continue
      count++
      const [u, v] = uvs[i]
      if (u < cMinU) cMinU = u; if (u > cMaxU) cMaxU = u
      if (v < cMinV) cMinV = v; if (v > cMaxV) cMaxV = v
    }
    if (count > 0) {
      chestUV = { minU: cMinU, maxU: cMaxU, minV: cMinV, maxV: cMaxV, count }
    }
  }

  return {
    ...entry,
    hasUV: uvs != null,
    vertices: positions.length,
    uvBounds: uvs ? { minU, maxU, minV, maxV } : null,
    posBounds: { minX, maxX, minY, maxY, minZ, maxZ },
    chestUV,
    yvCorrelation,
    xuCorrelation,
    frontCentroid,
  }
}

async function main() {
  for (const m of MODELS) {
    const filePath = path.join(MODELS_DIR, m.file)
    if (!fs.existsSync(filePath)) {
      console.log(`\n[${m.id}] FILE NOT FOUND`)
      continue
    }
    console.log(`\n========== ${m.id.toUpperCase()} (${m.file}) ==========`)
    const buf = fs.readFileSync(filePath)
    let json, bin
    try {
      ({ json, bin } = parseGLB(buf))
    } catch (err) {
      console.log(`  ERROR parsing: ${err.message}`)
      continue
    }
    const allEntries = collectMeshes(json, bin)
    console.log(`  Total primitives: ${allEntries.length}`)

    // First pass: compute model-wide bounding box (only non-draco primitives)
    let mMinX = Infinity, mMaxX = -Infinity, mMinY = Infinity, mMaxY = -Infinity, mMinZ = Infinity, mMaxZ = -Infinity
    for (const entry of allEntries) {
      if (entry.isDraco) continue
      const posIdx = entry.primitive.attributes.POSITION
      if (posIdx == null) continue
      const positions = readAccessor(json, bin, posIdx)
      for (const p of positions) {
        const [x, y, z] = transformPoint(entry.worldMatrix, p)
        if (x < mMinX) mMinX = x; if (x > mMaxX) mMaxX = x
        if (y < mMinY) mMinY = y; if (y > mMaxY) mMaxY = y
        if (z < mMinZ) mMinZ = z; if (z > mMaxZ) mMaxZ = z
      }
    }
    const modelBox = { minX: mMinX, maxX: mMaxX, minY: mMinY, maxY: mMaxY, minZ: mMinZ, maxZ: mMaxZ }
    console.log(`  Model box: x[${mMinX.toFixed(2)},${mMaxX.toFixed(2)}] y[${mMinY.toFixed(2)},${mMaxY.toFixed(2)}] z[${mMinZ.toFixed(2)},${mMaxZ.toFixed(2)}]`)

    // List all (with UV info)
    for (const entry of allEntries) {
      const tag = isTarget(entry, m.targetMeshNames, m.targetMaterialNames) ? '★' : ' '
      const dracoTag = entry.isDraco ? ' [DRACO]' : ''
      const hasUV = entry.primitive.attributes.TEXCOORD_0 != null
      const posIdx = entry.primitive.attributes.POSITION
      const verts = posIdx != null ? json.accessors[posIdx].count : '?'
      console.log(`    ${tag} node="${entry.nodeName}" mesh="${entry.meshName}" mat="${entry.materialName}" verts=${verts} hasUV=${hasUV}${dracoTag}`)
    }

    // Inspect target meshes
    const targets = allEntries.filter((e) => isTarget(e, m.targetMeshNames, m.targetMaterialNames))
    if (targets.length === 0) {
      console.log('  ⚠️  NO TARGETS — would fall back to ALL meshes')
      continue
    }

    let aggMinU = Infinity, aggMaxU = -Infinity, aggMinV = Infinity, aggMaxV = -Infinity
    let aggCMinU = Infinity, aggCMaxU = -Infinity, aggCMinV = Infinity, aggCMaxV = -Infinity, aggCN = 0

    for (const entry of targets) {
      const info = inspectPrimitive(json, bin, entry, modelBox)
      console.log(`\n  TARGET: node="${info.nodeName}" mat="${info.materialName}"`)
      if (info.error) { console.log(`    ⚠️  ${info.error}`); continue }
      if (info.posBounds) {
        const p = info.posBounds
        console.log(`    Pos x[${p.minX.toFixed(2)},${p.maxX.toFixed(2)}] y[${p.minY.toFixed(2)},${p.maxY.toFixed(2)}] z[${p.minZ.toFixed(2)},${p.maxZ.toFixed(2)}] (verts=${info.vertices})`)
      }
      if (!info.hasUV) { console.log('    ⚠️  No UV attribute'); continue }
      const b = info.uvBounds
      console.log(`    verts=${info.vertices} UV[${b.minU.toFixed(3)}-${b.maxU.toFixed(3)}, ${b.minV.toFixed(3)}-${b.maxV.toFixed(3)}]`)
      const p = info.posBounds
      console.log(`    Pos x[${p.minX.toFixed(2)},${p.maxX.toFixed(2)}] y[${p.minY.toFixed(2)},${p.maxY.toFixed(2)}] z[${p.minZ.toFixed(2)},${p.maxZ.toFixed(2)}]`)
      if (info.yvCorrelation) {
        const yv = info.yvCorrelation
        const xu = info.xuCorrelation
        const fmt = (v) => v != null ? v.toFixed(3) : 'N/A'
        console.log(`    Y→V (front center): top=${fmt(yv.top)} mid=${fmt(yv.mid)} low=${fmt(yv.low)}`)
        console.log(`    X→U (front midrow): left=${fmt(xu.left)} center=${fmt(xu.center)} right=${fmt(xu.right)}`)
      }
      if (info.frontCentroid) {
        const fc = info.frontCentroid
        console.log(`    >>> Front-chest centroid (UV): (${fc.u.toFixed(3)}, ${fc.v.toFixed(3)}) from ${fc.count} verts`)
      }
      if (info.chestUV) {
        const c = info.chestUV
        console.log(`    Chest UV: [${c.minU.toFixed(3)}-${c.maxU.toFixed(3)}, ${c.minV.toFixed(3)}-${c.maxV.toFixed(3)}] (${c.count} verts)`)
        if (c.minU < aggCMinU) aggCMinU = c.minU
        if (c.maxU > aggCMaxU) aggCMaxU = c.maxU
        if (c.minV < aggCMinV) aggCMinV = c.minV
        if (c.maxV > aggCMaxV) aggCMaxV = c.maxV
        aggCN += c.count
      }
      if (b.minU < aggMinU) aggMinU = b.minU
      if (b.maxU > aggMaxU) aggMaxU = b.maxU
      if (b.minV < aggMinV) aggMinV = b.minV
      if (b.maxV > aggMaxV) aggMaxV = b.maxV
    }

    console.log(`\n  ✓ AGG UV bounds: U[${aggMinU.toFixed(3)},${aggMaxU.toFixed(3)}] V[${aggMinV.toFixed(3)},${aggMaxV.toFixed(3)}]`)
    if (aggCN > 0) {
      const padU = (aggCMaxU - aggCMinU) * 0.15
      const padV = (aggCMaxV - aggCMinV) * 0.15
      console.log(`  ✓ Chest UV agg: U[${aggCMinU.toFixed(3)},${aggCMaxU.toFixed(3)}] V[${aggCMinV.toFixed(3)},${aggCMaxV.toFixed(3)}] (${aggCN} verts)`)
      console.log(`  ✓ Suggested printAreaUV: { minU: ${(aggCMinU - padU).toFixed(3)}, maxU: ${(aggCMaxU + padU).toFixed(3)}, minV: ${(aggCMinV - padV).toFixed(3)}, maxV: ${(aggCMaxV + padV).toFixed(3)} }`)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
