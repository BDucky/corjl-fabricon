import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------

interface BodyProfile {
  /** 0=hem, 1=neck */
  t: number
  /** Half-width (X radius) */
  rx: number
  /** Half-depth (Z radius) */
  rz: number
}

/**
 * Build a garment body as an open-ended elliptical tube.
 * Cross-section is elliptical and varies smoothly along height.
 */
function buildBodyGeometry(
  profiles: BodyProfile[],
  totalHeight: number,
  radialSegs = 32,
): THREE.BufferGeometry {
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const heightSegs = profiles.length - 1

  for (let i = 0; i <= heightSegs; i++) {
    const p = profiles[i]
    const y = p.t * totalHeight

    for (let j = 0; j <= radialSegs; j++) {
      const angle = (j / radialSegs) * Math.PI * 2
      const x = Math.cos(angle) * p.rx
      const z = Math.sin(angle) * p.rz
      vertices.push(x, y, z)
      uvs.push(j / radialSegs, p.t)
    }
  }

  for (let i = 0; i < heightSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j
      const b = a + radialSegs + 1
      indices.push(a, b, a + 1)
      indices.push(a + 1, b, b + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * Build a sleeve as a tapered tube following a direction vector.
 * The direction naturally controls the sleeve angle.
 */
function buildSleeveGeometry(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  armholeRadius: number,
  cuffRadius: number,
  lengthSegs = 10,
  radialSegs = 16,
): THREE.BufferGeometry {
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  // Build a local coordinate frame for the sleeve
  const dir = direction.clone().normalize()
  // Pick an arbitrary up vector that isn't parallel to dir
  const tempUp = Math.abs(dir.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const right = new THREE.Vector3().crossVectors(dir, tempUp).normalize()
  const up = new THREE.Vector3().crossVectors(right, dir).normalize()

  for (let i = 0; i <= lengthSegs; i++) {
    const t = i / lengthSegs
    const radius = THREE.MathUtils.lerp(armholeRadius, cuffRadius, t)
    // Position along sleeve axis
    const center = origin.clone().addScaledVector(dir, t * length)

    for (let j = 0; j <= radialSegs; j++) {
      const angle = (j / radialSegs) * Math.PI * 2
      const x = center.x + (Math.cos(angle) * right.x + Math.sin(angle) * up.x) * radius
      const y = center.y + (Math.cos(angle) * right.y + Math.sin(angle) * up.y) * radius
      const z = center.z + (Math.cos(angle) * right.z + Math.sin(angle) * up.z) * radius
      vertices.push(x, y, z)
      uvs.push(j / radialSegs, t)
    }
  }

  for (let i = 0; i < lengthSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j
      const b = a + radialSegs + 1
      indices.push(a, b, a + 1)
      indices.push(a + 1, b, b + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * Build a collar band (thick ring with visible height).
 */
function buildCollarGeometry(
  neckRadius: number,
  height: number,
  thickness: number,
  y: number,
  segs = 32,
): THREE.BufferGeometry {
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const rings = 4

  // Outer wall
  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const cy = y + t * height
    const r = neckRadius + thickness + Math.sin(t * Math.PI) * thickness * 0.15

    for (let j = 0; j <= segs; j++) {
      const angle = (j / segs) * Math.PI * 2
      vertices.push(Math.cos(angle) * r, cy, Math.sin(angle) * r)
      uvs.push(j / segs, t)
    }
  }

  // Inner wall (slightly smaller radius)
  const innerOffset = (rings + 1) * (segs + 1)
  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const cy = y + t * height
    const r = neckRadius

    for (let j = 0; j <= segs; j++) {
      const angle = (j / segs) * Math.PI * 2
      vertices.push(Math.cos(angle) * r, cy, Math.sin(angle) * r)
      uvs.push(j / segs, t)
    }
  }

  // Outer wall faces
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j
      const b = a + segs + 1
      indices.push(a, b, a + 1)
      indices.push(a + 1, b, b + 1)
    }
  }

  // Inner wall faces (reversed winding)
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = innerOffset + i * (segs + 1) + j
      const b = a + segs + 1
      indices.push(a, a + 1, b)
      indices.push(a + 1, b + 1, b)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

function fabricMat(color = '#e8e8e8'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, side: THREE.DoubleSide })
}
function cardMat(color = '#f5f5f5'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05 })
}
function markTarget(mesh: THREE.Mesh) {
  mesh.name = 'Body'
  mesh.castShadow = true
  mesh.receiveShadow = true
}

// ---------------------------------------------------------------------------
// Garment body profiles (reusable)
// ---------------------------------------------------------------------------

/** Generate a smooth body profile by interpolating key control points */
function interpolateProfile(
  keyPoints: Array<{ t: number; rx: number; rz: number }>,
  steps = 24,
): BodyProfile[] {
  const result: BodyProfile[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Find surrounding key points
    let lo = keyPoints[0], hi = keyPoints[keyPoints.length - 1]
    for (let k = 0; k < keyPoints.length - 1; k++) {
      if (t >= keyPoints[k].t && t <= keyPoints[k + 1].t) {
        lo = keyPoints[k]
        hi = keyPoints[k + 1]
        break
      }
    }
    const range = hi.t - lo.t
    const frac = range > 0 ? (t - lo.t) / range : 0
    // Smoothstep for organic curves
    const s = frac * frac * (3 - 2 * frac)
    result.push({
      t,
      rx: THREE.MathUtils.lerp(lo.rx, hi.rx, s),
      rz: THREE.MathUtils.lerp(lo.rz, hi.rz, s),
    })
  }
  return result
}

// ---------------------------------------------------------------------------
// T-Shirt
// ---------------------------------------------------------------------------

export function createProceduralTShirt(): THREE.Group {
  const group = new THREE.Group()
  const mat = fabricMat()
  const height = 0.9

  const profile = interpolateProfile([
    { t: 0.00, rx: 0.34, rz: 0.18 },  // hem
    { t: 0.15, rx: 0.33, rz: 0.17 },
    { t: 0.35, rx: 0.29, rz: 0.15 },  // waist
    { t: 0.55, rx: 0.32, rz: 0.17 },
    { t: 0.70, rx: 0.34, rz: 0.18 },  // chest
    { t: 0.82, rx: 0.32, rz: 0.17 },  // upper chest
    { t: 0.90, rx: 0.27, rz: 0.15 },  // shoulder
    { t: 0.95, rx: 0.13, rz: 0.10 },  // neck base
    { t: 1.00, rx: 0.11, rz: 0.08 },  // neck opening
  ])

  const bodyGeo = buildBodyGeometry(profile, height)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.position.y = -height / 2
  markTarget(body)
  group.add(body)

  // Crew-neck collar band
  const collarGeo = buildCollarGeometry(0.10, 0.03, 0.02, height - height / 2)
  const collar = new THREE.Mesh(collarGeo, fabricMat('#d0d0d0'))
  collar.name = 'collar'
  collar.position.y = -height / 2
  group.add(collar)

  // Sleeves: direction points outward and slightly down
  const shoulderY = height * 0.88 - height / 2
  const shoulderX = 0.28

  const leftDir = new THREE.Vector3(-1, -0.35, 0).normalize()
  const rightDir = new THREE.Vector3(1, -0.35, 0).normalize()

  const lSleeveGeo = buildSleeveGeometry(
    new THREE.Vector3(-shoulderX, shoulderY, 0), leftDir, 0.20, 0.10, 0.08,
  )
  const lSleeve = new THREE.Mesh(lSleeveGeo, mat.clone())
  lSleeve.name = 'sleeve_l'
  lSleeve.castShadow = true
  group.add(lSleeve)

  const rSleeveGeo = buildSleeveGeometry(
    new THREE.Vector3(shoulderX, shoulderY, 0), rightDir, 0.20, 0.10, 0.08,
  )
  const rSleeve = new THREE.Mesh(rSleeveGeo, mat.clone())
  rSleeve.name = 'sleeve_r'
  rSleeve.castShadow = true
  group.add(rSleeve)

  return group
}

// ---------------------------------------------------------------------------
// Polo Shirt
// ---------------------------------------------------------------------------

export function createProceduralPoloShirt(): THREE.Group {
  const group = new THREE.Group()
  const mat = fabricMat()
  const height = 0.92

  const profile = interpolateProfile([
    { t: 0.00, rx: 0.34, rz: 0.18 },
    { t: 0.15, rx: 0.33, rz: 0.17 },
    { t: 0.35, rx: 0.29, rz: 0.15 },
    { t: 0.55, rx: 0.32, rz: 0.17 },
    { t: 0.70, rx: 0.34, rz: 0.18 },
    { t: 0.82, rx: 0.32, rz: 0.17 },
    { t: 0.90, rx: 0.27, rz: 0.15 },
    { t: 0.95, rx: 0.14, rz: 0.10 },
    { t: 1.00, rx: 0.12, rz: 0.09 },
  ])

  const bodyGeo = buildBodyGeometry(profile, height)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.position.y = -height / 2
  markTarget(body)
  group.add(body)

  // Polo collar: taller band that stands up
  const collarGeo = buildCollarGeometry(0.11, 0.06, 0.025, height - height / 2)
  const collar = new THREE.Mesh(collarGeo, fabricMat('#d5d5d5'))
  collar.name = 'collar'
  collar.position.y = -height / 2
  collar.castShadow = true
  group.add(collar)

  // Collar fold line (ring at mid-collar height)
  const foldGeo = new THREE.TorusGeometry(0.135, 0.005, 6, 32)
  const fold = new THREE.Mesh(foldGeo, fabricMat('#c0c0c0'))
  fold.name = 'collar_fold'
  fold.position.y = height * 0.5 - height / 2 + 0.04
  fold.rotation.x = Math.PI / 2
  group.add(fold)

  // Placket (button strip)
  const placketGeo = new THREE.BoxGeometry(0.03, 0.14, 0.012)
  const placket = new THREE.Mesh(placketGeo, fabricMat('#d0d0d0'))
  placket.name = 'placket'
  const frontZ = 0.095
  placket.position.set(0, height * 0.80 - height / 2, frontZ)
  group.add(placket)

  // Buttons
  const btnMat = new THREE.MeshStandardMaterial({ color: '#aaaaaa', roughness: 0.3, metalness: 0.2 })
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), btnMat)
    btn.name = 'button'
    btn.position.set(0, height * 0.85 - height / 2 - i * 0.04, frontZ + 0.007)
    group.add(btn)
  }

  // Sleeves
  const shoulderY = height * 0.88 - height / 2
  const shoulderX = 0.28
  const leftDir = new THREE.Vector3(-1, -0.35, 0).normalize()
  const rightDir = new THREE.Vector3(1, -0.35, 0).normalize()

  const lGeo = buildSleeveGeometry(new THREE.Vector3(-shoulderX, shoulderY, 0), leftDir, 0.22, 0.10, 0.08)
  const lSleeve = new THREE.Mesh(lGeo, mat.clone())
  lSleeve.name = 'sleeve_l'
  lSleeve.castShadow = true
  group.add(lSleeve)

  const rGeo = buildSleeveGeometry(new THREE.Vector3(shoulderX, shoulderY, 0), rightDir, 0.22, 0.10, 0.08)
  const rSleeve = new THREE.Mesh(rGeo, mat.clone())
  rSleeve.name = 'sleeve_r'
  rSleeve.castShadow = true
  group.add(rSleeve)

  return group
}

// ---------------------------------------------------------------------------
// Hoodie
// ---------------------------------------------------------------------------

export function createProceduralHoodie(): THREE.Group {
  const group = new THREE.Group()
  const mat = fabricMat()
  const height = 1.05

  // Looser, wider fit
  const profile = interpolateProfile([
    { t: 0.00, rx: 0.38, rz: 0.21 },
    { t: 0.12, rx: 0.37, rz: 0.20 },
    { t: 0.30, rx: 0.34, rz: 0.18 },  // waist (less taper — hoodie is looser)
    { t: 0.50, rx: 0.37, rz: 0.20 },
    { t: 0.68, rx: 0.38, rz: 0.21 },  // chest
    { t: 0.80, rx: 0.36, rz: 0.20 },
    { t: 0.88, rx: 0.30, rz: 0.18 },  // shoulder
    { t: 0.94, rx: 0.16, rz: 0.12 },
    { t: 1.00, rx: 0.14, rz: 0.10 },
  ])

  const bodyGeo = buildBodyGeometry(profile, height)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.position.y = -height / 2
  markTarget(body)
  group.add(body)

  // Long sleeves
  const shoulderY = height * 0.86 - height / 2
  const shoulderX = 0.30
  const leftDir = new THREE.Vector3(-1, -0.4, 0).normalize()
  const rightDir = new THREE.Vector3(1, -0.4, 0).normalize()

  const lGeo = buildSleeveGeometry(new THREE.Vector3(-shoulderX, shoulderY, 0), leftDir, 0.38, 0.11, 0.07)
  const lSleeve = new THREE.Mesh(lGeo, mat.clone())
  lSleeve.name = 'sleeve_l'
  lSleeve.castShadow = true
  group.add(lSleeve)

  const rGeo = buildSleeveGeometry(new THREE.Vector3(shoulderX, shoulderY, 0), rightDir, 0.38, 0.11, 0.07)
  const rSleeve = new THREE.Mesh(rGeo, mat.clone())
  rSleeve.name = 'sleeve_r'
  rSleeve.castShadow = true
  group.add(rSleeve)

  // Ribbed cuffs at sleeve ends
  for (const side of [-1, 1]) {
    const dir = side < 0 ? leftDir : rightDir
    const origin = new THREE.Vector3(side * shoulderX, shoulderY, 0)
    const cuffCenter = origin.clone().addScaledVector(dir, 0.38)
    const cuffGeo = buildSleeveGeometry(cuffCenter, dir, 0.03, 0.072, 0.070, 3, 16)
    const cuff = new THREE.Mesh(cuffGeo, fabricMat('#d0d0d0'))
    cuff.name = 'cuff'
    group.add(cuff)
  }

  // Hood — half-torus arcing up and over the back
  const hoodGeo = new THREE.TorusGeometry(0.16, 0.11, 16, 24, Math.PI)
  const hood = new THREE.Mesh(hoodGeo, fabricMat('#dcdcdc'))
  hood.name = 'hood'
  // Arc goes from front-left, over the top, to front-right
  hood.rotation.set(Math.PI * 0.15, 0, Math.PI)
  hood.position.set(0, height / 2 + 0.04, -0.06)
  hood.castShadow = true
  group.add(hood)

  // Hood base connection
  const hoodBaseGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.05, 20, 1, true)
  const hoodBase = new THREE.Mesh(hoodBaseGeo, fabricMat('#dcdcdc'))
  hoodBase.name = 'hood_base'
  hoodBase.position.set(0, height / 2 - 0.01, -0.02)
  group.add(hoodBase)

  // Kangaroo pocket
  const pocketGeo = new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4)
  const pocket = new THREE.Mesh(pocketGeo, fabricMat('#dadada'))
  pocket.name = 'pocket'
  pocket.rotation.x = Math.PI
  pocket.scale.set(1.8, 0.5, 0.25)
  const frontZ = 0.20
  pocket.position.set(0, -0.15, frontZ)
  group.add(pocket)

  // Pocket slit
  const slitGeo = new THREE.BoxGeometry(0.20, 0.004, 0.004)
  const slit = new THREE.Mesh(slitGeo, new THREE.MeshStandardMaterial({ color: '#bbb', roughness: 1 }))
  slit.name = 'pocket_slit'
  slit.position.set(0, -0.12, frontZ + 0.04)
  group.add(slit)

  // Drawstrings
  for (const side of [-1, 1]) {
    const strGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6)
    const str = new THREE.Mesh(strGeo, new THREE.MeshStandardMaterial({ color: '#c0c0c0', roughness: 0.6 }))
    str.name = 'drawstring'
    str.position.set(side * 0.04, height / 2 - 0.12, frontZ - 0.04)
    group.add(str)
  }

  // Ribbed waistband
  const waistGeo = buildCollarGeometry(0.37, 0.04, 0.015, -height / 2 - 0.02, 32)
  const waist = new THREE.Mesh(waistGeo, fabricMat('#d0d0d0'))
  waist.name = 'waistband'
  group.add(waist)

  return group
}

// ---------------------------------------------------------------------------
// Tank Top
// ---------------------------------------------------------------------------

export function createProceduralTankTop(): THREE.Group {
  const group = new THREE.Group()
  const mat = fabricMat()
  const height = 0.85

  const profile = interpolateProfile([
    { t: 0.00, rx: 0.32, rz: 0.16 },
    { t: 0.15, rx: 0.31, rz: 0.15 },
    { t: 0.35, rx: 0.27, rz: 0.14 },  // waist
    { t: 0.55, rx: 0.30, rz: 0.15 },
    { t: 0.70, rx: 0.32, rz: 0.16 },  // chest
    { t: 0.80, rx: 0.28, rz: 0.14 },  // upper chest
    { t: 0.88, rx: 0.18, rz: 0.10 },  // narrow straps
    { t: 0.94, rx: 0.14, rz: 0.09 },
    { t: 1.00, rx: 0.11, rz: 0.07 },  // wide neck opening
  ])

  const bodyGeo = buildBodyGeometry(profile, height)
  const body = new THREE.Mesh(bodyGeo, mat)
  body.position.y = -height / 2
  markTarget(body)
  group.add(body)

  // Thin neckline binding
  const neckGeo = buildCollarGeometry(0.10, 0.015, 0.01, height - height / 2)
  const neck = new THREE.Mesh(neckGeo, fabricMat('#d0d0d0'))
  neck.name = 'neckline'
  neck.position.y = -height / 2
  group.add(neck)

  return group
}

// ---------------------------------------------------------------------------
// Coffee Mug (unchanged — user said it looks good)
// ---------------------------------------------------------------------------

export function createProceduralMug(): THREE.Group {
  const group = new THREE.Group()

  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 32)
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
    color: '#e0e0e0', roughness: 0.3, metalness: 0.1,
  }))
  markTarget(body)
  group.add(body)

  const innerGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.75, 32)
  const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({
    color: '#2a2a2a', roughness: 0.8, side: THREE.BackSide,
  }))
  inner.name = 'inner'
  inner.position.y = 0.05
  group.add(inner)

  const handleGeo = new THREE.TorusGeometry(0.22, 0.04, 12, 24, Math.PI)
  const handle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({
    color: '#e0e0e0', roughness: 0.3, metalness: 0.1,
  }))
  handle.name = 'handle'
  handle.rotation.z = -Math.PI / 2
  handle.position.set(0.42, 0, 0)
  handle.castShadow = true
  group.add(handle)

  const bottomGeo = new THREE.CircleGeometry(0.35, 32)
  const bottom = new THREE.Mesh(bottomGeo, new THREE.MeshStandardMaterial({
    color: '#d0d0d0', roughness: 0.4,
  }))
  bottom.name = 'bottom'
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = -0.4
  group.add(bottom)

  return group
}

// ---------------------------------------------------------------------------
// Product Box
// ---------------------------------------------------------------------------

export function createProceduralBox(): THREE.Group {
  const group = new THREE.Group()
  const w = 0.8, h = 1.0, d = 0.3

  const faces: Array<[string, [number, number], [number, number, number], [number, number, number], string]> = [
    ['Front',       [w, h], [0, 0, d / 2],     [0, 0, 0],              '#f5f5f5'],
    ['Back',        [w, h], [0, 0, -d / 2],    [0, Math.PI, 0],        '#f5f5f5'],
    ['Side',        [d, h], [-w / 2, 0, 0],    [0, -Math.PI / 2, 0],   '#e8e8e8'],
    ['right',       [d, h], [w / 2, 0, 0],     [0, Math.PI / 2, 0],    '#e8e8e8'],
    ['top',         [w, d], [0, h / 2, 0],     [-Math.PI / 2, 0, 0],   '#eeeeee'],
    ['bottom_face', [w, d], [0, -h / 2, 0],    [Math.PI / 2, 0, 0],    '#e0e0e0'],
  ]

  for (const [name, size, pos, rot, color] of faces) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5 }),
    )
    mesh.name = name
    mesh.position.set(pos[0], pos[1], pos[2])
    mesh.rotation.set(rot[0], rot[1], rot[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  return group
}

// ---------------------------------------------------------------------------
// Gift Card
// ---------------------------------------------------------------------------

export function createProceduralGiftCard(): THREE.Group {
  const group = new THREE.Group()
  const w = 0.86, h = 0.54, r = 0.04

  const shape = new THREE.Shape()
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo(w / 2 - r, -h / 2)
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  shape.lineTo(w / 2, h / 2 - r)
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  shape.lineTo(-w / 2 + r, h / 2)
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  shape.lineTo(-w / 2, -h / 2 + r)
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012, bevelEnabled: true,
    bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3,
  })

  const card = new THREE.Mesh(geo, cardMat())
  markTarget(card)
  card.position.z = -0.006
  group.add(card)

  const stripeGeo = new THREE.BoxGeometry(w * 0.9, 0.06, 0.002)
  const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({
    color: '#333', roughness: 0.3, metalness: 0.4,
  }))
  stripe.name = 'stripe'
  stripe.position.set(0, -h / 4, -0.008)
  group.add(stripe)

  return group
}

// ---------------------------------------------------------------------------
// Tote Bag
// ---------------------------------------------------------------------------

export function createProceduralToteBag(): THREE.Group {
  const group = new THREE.Group()
  const w = 0.6, h = 0.7, d = 0.2

  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fabricMat())
  markTarget(front)
  front.position.z = d / 2
  group.add(front)

  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fabricMat())
  back.name = 'back'
  back.position.z = -d / 2
  back.rotation.y = Math.PI
  back.castShadow = true
  group.add(back)

  for (const side of [-1, 1]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(d, h), fabricMat('#d5d5d5'))
    mesh.name = 'side'
    mesh.position.x = side * w / 2
    mesh.rotation.y = side * Math.PI / 2
    mesh.castShadow = true
    group.add(mesh)
  }

  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fabricMat('#d0d0d0'))
  bottom.name = 'bottom'
  bottom.position.y = -h / 2
  bottom.rotation.x = Math.PI / 2
  group.add(bottom)

  for (const side of [-1, 1]) {
    const strapGeo = new THREE.TorusGeometry(0.16, 0.015, 8, 24, Math.PI)
    const strap = new THREE.Mesh(strapGeo, fabricMat('#c8c8c8'))
    strap.name = 'handle'
    strap.position.set(side * 0.16, h / 2 + 0.005, 0)
    strap.castShadow = true
    group.add(strap)
  }

  return group
}

// ---------------------------------------------------------------------------
// Phone Case
// ---------------------------------------------------------------------------

export function createProceduralPhoneCase(): THREE.Group {
  const group = new THREE.Group()
  const w = 0.38, h = 0.76, d = 0.045, r = 0.06

  const shape = new THREE.Shape()
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo(w / 2 - r, -h / 2)
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  shape.lineTo(w / 2, h / 2 - r)
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  shape.lineTo(-w / 2 + r, h / 2)
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  shape.lineTo(-w / 2, -h / 2 + r)
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)

  const camHole = new THREE.Path()
  camHole.absarc(0.06, 0.28, 0.04, 0, Math.PI * 2, false)
  shape.holes.push(camHole)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true,
    bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4,
  })

  const caseMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: '#e8e8e8', roughness: 0.35, metalness: 0.15,
  }))
  markTarget(caseMesh)
  caseMesh.position.z = -d / 2
  group.add(caseMesh)

  const bumperMat = new THREE.MeshStandardMaterial({ color: '#d0d0d0', roughness: 0.5, metalness: 0.1 })
  for (const side of [-1, 1]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.015, h * 0.7, d + 0.02), bumperMat.clone())
    bumper.name = 'bumper'
    bumper.position.set(side * (w / 2 + 0.005), 0, 0)
    bumper.castShadow = true
    group.add(bumper)
  }

  const bottomBumper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.015, d + 0.02), bumperMat.clone())
  bottomBumper.name = 'bumper_bottom'
  bottomBumper.position.set(0, -(h / 2 + 0.005), 0)
  group.add(bottomBumper)

  return group
}

// ---------------------------------------------------------------------------
// Poster / Print
// ---------------------------------------------------------------------------

export function createProceduralPoster(): THREE.Group {
  const group = new THREE.Group()

  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), cardMat())
  markTarget(poster)
  poster.position.z = 0.006
  group.add(poster)

  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 1.14, 0.012),
    new THREE.MeshStandardMaterial({ color: '#ccc', roughness: 0.6 }),
  )
  backing.name = 'backing'
  backing.castShadow = true
  backing.receiveShadow = true
  group.add(backing)

  return group
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PROCEDURAL_GENERATORS: Record<string, () => THREE.Group> = {
  mug: createProceduralMug,
  box: createProceduralBox,
  tshirt: createProceduralTShirt,
  polo: createProceduralPoloShirt,
  hoodie: createProceduralHoodie,
  tanktop: createProceduralTankTop,
  giftcard: createProceduralGiftCard,
  totebag: createProceduralToteBag,
  phonecase: createProceduralPhoneCase,
  poster: createProceduralPoster,
}
