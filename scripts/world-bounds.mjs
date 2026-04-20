// Compute world-space bounding boxes by walking the GLB node hierarchy
// (no Three.js needed - pure node)
import fs from 'node:fs'
import path from 'node:path'

const MODELS_DIR = '/Users/admin/Documents/work/corjl-fabricon/public/models'

const MODELS = [
  { id: 'standee', file: 'standee.glb', mat: 'material' },
  { id: 'coffeemug', file: 'coffeeMug.glb', mat: 'White_Mug' },
  { id: 'cardboardbox', file: 'cardboardBox.glb', mat: 'Material' },
  { id: 'hoodie', file: 'hoodie.glb', mat: 'HOODIE_FRONT_5197361' },
  { id: 'polo', file: 'polo.glb', mat: 'Cotton_Heavy_Canvas_FRONT_232020' },
]

const COMPONENT_TYPE = {
  5120: { size: 1, getter: 'getInt8' },
  5121: { size: 1, getter: 'getUint8' },
  5122: { size: 2, getter: 'getInt16' },
  5123: { size: 2, getter: 'getUint16' },
  5125: { size: 4, getter: 'getUint32' },
  5126: { size: 4, getter: 'getFloat32' },
}
const TYPE_COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }

function parseGLB(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let offset = 12, json = null, bin = null
  while (offset < view.getUint32(8, true)) {
    const chunkLen = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    if (chunkType === 0x4e4f534a) {
      const jsonBytes = new Uint8Array(buf.buffer, buf.byteOffset + offset + 8, chunkLen)
      json = JSON.parse(new TextDecoder().decode(jsonBytes))
    } else if (chunkType === 0x004e4942) {
      bin = new Uint8Array(buf.buffer, buf.byteOffset + offset + 8, chunkLen)
    }
    offset += 8 + chunkLen
  }
  return { json, bin }
}

function readAccessor(json, bin, idx) {
  const a = json.accessors[idx]
  const bv = json.bufferViews[a.bufferView]
  const c = COMPONENT_TYPE[a.componentType]
  const nc = TYPE_COUNT[a.type]
  const stride = bv.byteStride ?? c.size * nc
  const base = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0)
  const v = new DataView(bin.buffer, bin.byteOffset, bin.byteLength)
  const out = []
  for (let i = 0; i < a.count; i++) {
    const e = []
    for (let k = 0; k < nc; k++) e.push(v[c.getter](base + i * stride + k * c.size, true))
    out.push(e)
  }
  return out
}

function nodeMatrix(n) {
  if (n.matrix) return n.matrix.slice()
  const t = n.translation ?? [0, 0, 0]
  const r = n.rotation ?? [0, 0, 0, 1]
  const s = n.scale ?? [1, 1, 1]
  const [x, y, z, w] = r
  const xx=x*x, yy=y*y, zz=z*z, xy=x*y, xz=x*z, yz=y*z, wx=w*x, wy=w*y, wz=w*z
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
  return [
    m[0]*p[0] + m[4]*p[1] + m[8]*p[2]  + m[12],
    m[1]*p[0] + m[5]*p[1] + m[9]*p[2]  + m[13],
    m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14],
  ]
}

function walkScene(json, bin, targetMat) {
  const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
  const found = []
  function walk(idx, parentMat) {
    const n = json.nodes[idx]
    const wm = multiply(parentMat, nodeMatrix(n))
    if (n.mesh != null) {
      const m = json.meshes[n.mesh]
      for (const prim of m.primitives) {
        const matName = prim.material != null ? json.materials?.[prim.material]?.name : null
        if (matName === targetMat) {
          found.push({ name: n.name, prim, wm })
        }
      }
    }
    for (const c of n.children ?? []) walk(c, wm)
  }
  for (const root of json.scenes[json.scene ?? 0].nodes) walk(root, I)
  return found
}

for (const m of MODELS) {
  console.log(`\n=== ${m.id} ===`)
  const buf = fs.readFileSync(path.join(MODELS_DIR, m.file))
  const { json, bin } = parseGLB(buf)
  const found = walkScene(json, bin, m.mat)
  for (const f of found) {
    if (f.prim.extensions?.KHR_draco_mesh_compression) {
      console.log(`  ${f.name}: DRACO (skipping)`)
      continue
    }
    const posIdx = f.prim.attributes.POSITION
    const positions = readAccessor(json, bin, posIdx)
    let minLX=Infinity,maxLX=-Infinity,minLY=Infinity,maxLY=-Infinity,minLZ=Infinity,maxLZ=-Infinity
    let minWX=Infinity,maxWX=-Infinity,minWY=Infinity,maxWY=-Infinity,minWZ=Infinity,maxWZ=-Infinity
    for (const p of positions) {
      if (p[0]<minLX)minLX=p[0]; if (p[0]>maxLX)maxLX=p[0]
      if (p[1]<minLY)minLY=p[1]; if (p[1]>maxLY)maxLY=p[1]
      if (p[2]<minLZ)minLZ=p[2]; if (p[2]>maxLZ)maxLZ=p[2]
      const w = transformPoint(f.wm, p)
      if (w[0]<minWX)minWX=w[0]; if (w[0]>maxWX)maxWX=w[0]
      if (w[1]<minWY)minWY=w[1]; if (w[1]>maxWY)maxWY=w[1]
      if (w[2]<minWZ)minWZ=w[2]; if (w[2]>maxWZ)maxWZ=w[2]
    }
    console.log(`  "${f.name}" verts=${positions.length}`)
    console.log(`    Local: x[${minLX.toFixed(2)},${maxLX.toFixed(2)}] y[${minLY.toFixed(2)},${maxLY.toFixed(2)}] z[${minLZ.toFixed(2)},${maxLZ.toFixed(2)}]`)
    console.log(`    Local size: ${(maxLX-minLX).toFixed(2)} x ${(maxLY-minLY).toFixed(2)} x ${(maxLZ-minLZ).toFixed(2)}`)
    console.log(`    World: x[${minWX.toFixed(2)},${maxWX.toFixed(2)}] y[${minWY.toFixed(2)},${maxWY.toFixed(2)}] z[${minWZ.toFixed(2)},${maxWZ.toFixed(2)}]`)
    console.log(`    World size: ${(maxWX-minWX).toFixed(2)} x ${(maxWY-minWY).toFixed(2)} x ${(maxWZ-minWZ).toFixed(2)}`)
  }
}
