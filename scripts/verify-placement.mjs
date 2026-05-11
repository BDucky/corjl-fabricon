// Simulates the compositor + UV mapping to verify each model's design lands where expected.
// Reads MODEL_TEXTURE_DEFAULTS from constants.ts and the chest UV data measured by inspect-models.mjs.
//
// For each model, computes the canvas Y/X for offsetY=offsetX=0.5 (initial state),
// then converts that to a UV coord and reports whether it falls inside the target's chest UV.

const CANVAS_SIZE = 2048

// Centroid measurements (front-chest area, from inspect-models.mjs)
const MODELS = [
  { id: 'tshirt',       centroid: { u: 0.262, v: 0.256 } },
  { id: 'polo',         centroid: { u: 0.574, v: 0.479 }, note: 'tiled UVs span [-2.3, 2.3]; only [0,1] tile is sampled' },
  { id: 'hoodie',       centroid: { u: 0.509, v: 0.622 }, note: 'combined across 3 meshes' },
  { id: 'totebag',      centroid: { u: 0.627, v: 0.955 }, note: 'centroid biased high; user accepts current centered placement' },
  { id: 'phonecase',    centroid: { u: 0.703, v: 0.737 }, note: 'centroid biased high; user accepts current centered placement' },
  { id: 'cardboardbox', centroid: { u: 0.459, v: 0.605 }, note: '+Z front face centroid' },
  { id: 'coffeemug',    centroid: null, note: 'cylindrical UVs generated at runtime; design on +X side at U≈0.5' },
  { id: 'standee',      centroid: null, note: 'planar UVs generated at runtime; print area auto-computed' },
]

const PRINT_AREAS = {
  tshirt:       { minU: 0.08, maxU: 0.44, minV: 0.14, maxV: 0.38, decorationScale: 0.85 },
  polo:         { minU: 0.25, maxU: 0.90, minV: 0.10, maxV: 0.85, flipV: true, decorationScale: 0.80 },
  hoodie:       { minU: 0.30, maxU: 0.72, minV: 0.42, maxV: 0.82, flipV: true, decorationScale: 0.85 },
  totebag:      { minU: 0.05, maxU: 0.95, minV: 0.15, maxV: 0.85, flipV: true, decorationScale: 0.75 },
  phonecase:    { minU: 0.486, maxU: 0.958, minV: 0.033, maxV: 0.966, flipV: true, decorationScale: 0.85 },
  cardboardbox: { minU: 0.16, maxU: 0.76, minV: 0.42, maxV: 0.79, flipV: true, decorationScale: 0.85 },
  coffeemug:    { minU: 0.55, maxU: 0.80, minV: 0.22, maxV: 0.78, decorationScale: 0.85 },
  // standee uses auto-computed planar UVs (after my generator runs in WORLD space).
  // World box: 31.49 wide × 70.86 tall × 0.04 thick → Z is normal → U=[0.278, 0.722], V=[0, 1].
  standee:      { auto: true, decorationScale: 0.90 },
}

// Approx planar UV bounds for standee, computed from local position bounds
// dx=31.49, dy=70.86, dz=0.04 → uOffset=0.278
const STANDEE_AUTO = { minU: 0.278, maxU: 0.722, minV: 0, maxV: 1 }

const IMAGE_ASPECT = 214 / 300 // ≈ 0.713 (portrait)

function simulate(modelId, area) {
  const a = area.auto && modelId === 'standee' ? STANDEE_AUTO : area
  const minU = a.minU, maxU = a.maxU, minV = a.minV, maxV = a.maxV

  // NEW compositor math (after fix):
  const regionX = minU * CANVAS_SIZE
  const regionY = minV * CANVAS_SIZE
  const regionW = (maxU - minU) * CANVAS_SIZE
  const regionH = (maxV - minV) * CANVAS_SIZE

  const offsetX = 0.5, offsetY = 0.5
  const centerX = regionX + offsetX * regionW
  const centerY = regionY + offsetY * regionH

  // With flipY=false: canvas Y maps directly to UV V (V = canvasY / CANVAS_SIZE)
  const uvCenterU = centerX / CANVAS_SIZE
  const uvCenterV = centerY / CANVAS_SIZE

  const decorationScale = area.decorationScale ?? 0.80
  const refSize = Math.min(regionW, regionH) * decorationScale
  let drawW, drawH
  if (IMAGE_ASPECT > 1) { drawW = refSize; drawH = refSize / IMAGE_ASPECT }
  else { drawH = refSize; drawW = refSize * IMAGE_ASPECT }

  const designUVMinU = (centerX - drawW / 2) / CANVAS_SIZE
  const designUVMaxU = (centerX + drawW / 2) / CANVAS_SIZE
  const designUVMinV = (centerY - drawH / 2) / CANVAS_SIZE
  const designUVMaxV = (centerY + drawH / 2) / CANVAS_SIZE

  return {
    uvCenter: [uvCenterU, uvCenterV],
    designUV: { minU: designUVMinU, maxU: designUVMaxU, minV: designUVMinV, maxV: designUVMaxV },
  }
}

function distanceToCentroid(uv, centroid) {
  if (!centroid) return null
  const du = uv[0] - centroid.u
  const dv = uv[1] - centroid.v
  return Math.sqrt(du * du + dv * dv)
}

console.log('=== Simulating compositor placement (offsetY=offsetX=0.5, image 214x300) ===\n')

for (const m of MODELS) {
  const area = PRINT_AREAS[m.id]
  if (!area) { console.log(`[${m.id}] no print area config`); continue }
  const r = simulate(m.id, area)
  console.log(`${m.id.toUpperCase()}`)
  console.log(`  print area: U[${(area.minU ?? STANDEE_AUTO.minU).toFixed(3)},${(area.maxU ?? STANDEE_AUTO.maxU).toFixed(3)}] V[${(area.minV ?? STANDEE_AUTO.minV).toFixed(3)},${(area.maxV ?? STANDEE_AUTO.maxV).toFixed(3)}] scale=${area.decorationScale}`)
  console.log(`  design center → UV (${r.uvCenter[0].toFixed(3)}, ${r.uvCenter[1].toFixed(3)})`)
  console.log(`  design UV span: U[${r.designUV.minU.toFixed(3)},${r.designUV.maxU.toFixed(3)}] V[${r.designUV.minV.toFixed(3)},${r.designUV.maxV.toFixed(3)}]`)
  if (m.centroid) {
    const dist = distanceToCentroid(r.uvCenter, m.centroid)
    console.log(`  measured front centroid: (${m.centroid.u.toFixed(3)}, ${m.centroid.v.toFixed(3)})  Δ=${dist.toFixed(3)}`)
    console.log(`  ${dist < 0.05 ? '✓ very close' : dist < 0.10 ? '~ acceptable' : '✗ off-center'}`)
  }
  if (m.note) console.log(`  note: ${m.note}`)
  console.log()
}
