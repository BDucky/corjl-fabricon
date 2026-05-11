// Per-face UV analysis: groups vertices by which face of the model they're on,
// then reports the UV region each face occupies. Useful for understanding which
// UV region maps to which physical face on box-like models.

import fs from 'node:fs'
import path from 'node:path'

const MODELS_DIR = '/Users/admin/Documents/work/corjl-fabricon/public/models'

// Reuse parser from inspect-models.mjs (inlined for simplicity)
const COMPONENT_TYPE = {
  5120: { size: 1, getter: 'getInt8' },
  5121: { size: 1, getter: 'getUint8' },
  5122: { size: 2, getter: 'getInt16' },
  5123: { size: 2, getter: 'getUint16' },
  5125: { size: 4, getter: 'getUint32' },
  5126: { size: 4, getter: 'getFloat32' },
}
const TYPE_COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }

function parseGLB(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error('Not GLB')
  let json = null, bin = null
  let offset = 12
  while (offset < view.getUint32(8, true)) {
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
  return { json, bin }
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
      elem.push(view[compInfo.getter](baseOffset + i * stride + c * compInfo.size, true))
    }
    result.push(elem)
  }
  return result
}

function nodeMatrix(node) {
  if (node.matrix) return node.matrix.slice()
  const t = node.translation ?? [0, 0, 0]
  const r = node.rotation ?? [0, 0, 0, 1]
  const s = node.scale ?? [1, 1, 1]
  const [x, y, z, w] = r
  const xx = x*x, yy = y*y, zz = z*z, xy = x*y, xz = x*z, yz = y*z
  const wx = w*x, wy = w*y, wz = w*z
  return [
    (1-2*(yy+zz))*s[0], (2*(xy+wz))*s[0], (2*(xz-wy))*s[0], 0,
    (2*(xy-wz))*s[1], (1-2*(xx+zz))*s[1], (2*(yz+wx))*s[1], 0,
    (2*(xz+wy))*s[2], (2*(yz-wx))*s[2], (1-2*(xx+yy))*s[2], 0,
    t[0], t[1], t[2], 1,
  ]
}
function multiply(a, b) {
  const out = new Array(16).fill(0)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    let v = 0
    for (let k = 0; k < 4; k++) v += a[k*4+r] * b[c*4+k]
    out[c*4+r] = v
  }
  return out
}
function transformPoint(m, p) {
  const [x, y, z] = p
  return [
    m[0]*x + m[4]*y + m[8]*z + m[12],
    m[1]*x + m[5]*y + m[9]*z + m[13],
    m[2]*x + m[6]*y + m[10]*z + m[14],
  ]
}

function collectMeshes(json) {
  const out = []
  const scene = json.scenes?.[json.scene ?? 0]
  if (!scene) return out
  function walk(nodeIdx, parentMat) {
    const node = json.nodes[nodeIdx]
    const worldMat = multiply(parentMat, nodeMatrix(node))
    if (node.mesh != null) {
      const m = json.meshes[node.mesh]
      for (const prim of m.primitives) {
        out.push({
          nodeName: node.name ?? `node_${nodeIdx}`,
          primitive: prim,
          worldMatrix: worldMat,
          materialName: prim.material != null ? json.materials?.[prim.material]?.name : null,
        })
      }
    }
    for (const child of node.children ?? []) walk(child, worldMat)
  }
  const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
  for (const n of scene.nodes) walk(n, I)
  return out
}

function analyzeBoxFaces(filePath, targetMeshNames, targetMaterialNames) {
  const buf = fs.readFileSync(filePath)
  const { json, bin } = parseGLB(buf)
  const meshes = collectMeshes(json)
  const targets = meshes.filter((e) =>
    targetMeshNames.length === 0 && targetMaterialNames.length === 0 ||
    targetMeshNames.includes(e.nodeName) ||
    (e.materialName && targetMaterialNames.includes(e.materialName))
  )
  for (const t of targets) {
    const posIdx = t.primitive.attributes.POSITION
    const uvIdx = t.primitive.attributes.TEXCOORD_0
    if (posIdx == null) continue
    const positions = readAccessor(json, bin, posIdx).map(p => transformPoint(t.worldMatrix, p))
    const uvs = uvIdx != null ? readAccessor(json, bin, uvIdx) : null

    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity, minZ=Infinity, maxZ=-Infinity
    for (const [x, y, z] of positions) {
      if (x<minX)minX=x; if (x>maxX)maxX=x
      if (y<minY)minY=y; if (y>maxY)maxY=y
      if (z<minZ)minZ=z; if (z>maxZ)maxZ=z
    }
    const dx = maxX-minX, dy = maxY-minY, dz = maxZ-minZ
    console.log(`\n  Mesh "${t.nodeName}" mat="${t.materialName}" verts=${positions.length}`)
    console.log(`    Pos: x[${minX.toFixed(2)},${maxX.toFixed(2)}] y[${minY.toFixed(2)},${maxY.toFixed(2)}] z[${minZ.toFixed(2)},${maxZ.toFixed(2)}]`)

    if (!uvs) { console.log('    NO UVs'); continue }

    // Group by face: which face is each vertex on?
    const eps = Math.max(dx, dy, dz) * 0.05
    const faces = {
      '+X': { uv: [], pos: [] }, '-X': { uv: [], pos: [] },
      '+Y': { uv: [], pos: [] }, '-Y': { uv: [], pos: [] },
      '+Z': { uv: [], pos: [] }, '-Z': { uv: [], pos: [] },
      'interior': { uv: [], pos: [] },
    }
    for (let i = 0; i < positions.length; i++) {
      const [x, y, z] = positions[i]
      let face = 'interior'
      // Pick the face the vertex is closest to
      const distances = {
        '+X': maxX - x, '-X': x - minX,
        '+Y': maxY - y, '-Y': y - minY,
        '+Z': maxZ - z, '-Z': z - minZ,
      }
      let minDist = Infinity
      for (const [k, v] of Object.entries(distances)) {
        if (v < minDist) { minDist = v; face = k }
      }
      if (minDist > eps) face = 'interior'
      faces[face].uv.push(uvs[i])
      faces[face].pos.push(positions[i])
    }

    for (const [face, data] of Object.entries(faces)) {
      if (data.uv.length === 0) continue
      let mnu=Infinity, mxu=-Infinity, mnv=Infinity, mxv=-Infinity, su=0, sv=0
      for (const [u, v] of data.uv) {
        if (u<mnu)mnu=u; if (u>mxu)mxu=u
        if (v<mnv)mnv=v; if (v>mxv)mxv=v
        su+=u; sv+=v
      }
      const cu = su/data.uv.length, cv = sv/data.uv.length
      console.log(`    ${face}: ${data.uv.length} verts UV[${mnu.toFixed(3)}-${mxu.toFixed(3)}, ${mnv.toFixed(3)}-${mxv.toFixed(3)}] centroid=(${cu.toFixed(3)},${cv.toFixed(3)})`)
    }
  }
}

console.log('=== CARDBOARD BOX FACE ANALYSIS ===')
analyzeBoxFaces(path.join(MODELS_DIR, 'cardboardBox.glb'),
  ['Box_Material_0', 'Box.Big_Material_0', 'Box.Small_Material_0'], ['Material'])

console.log('\n\n=== COFFEE MUG ANALYSIS ===')
analyzeBoxFaces(path.join(MODELS_DIR, 'coffeeMug.glb'),
  ['Mesh.Mug_White Mug_0'], ['White_Mug'])

console.log('\n\n=== STANDEE ANALYSIS ===')
analyzeBoxFaces(path.join(MODELS_DIR, 'standee.glb'), [], ['material'])
