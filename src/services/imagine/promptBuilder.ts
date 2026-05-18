// Per-3D-model prompt templates for the Imagine generation.
//
// Each template is tuned to the product type so the generated scene frames the
// product naturally (a mug is held, a phone case is shown on a phone, a t-shirt
// is worn chest-out, etc.). Every prompt emphasizes face-identity preservation
// because PuLID-Flux is face-driven.
//
// Honest limitation: PuLID-Flux is face-only. It cannot reproduce the exact
// pixels of the customer's design or the geometry of the chosen 3D mockup —
// only the face is preserved. Wording like "the printed design shown" biases
// the scene but does not guarantee the design itself. Step 3.5 (or model swap)
// is required for true design + product preservation.

// Per-product PuLID-Flux prompts. PuLID-Flux is face-only — it cannot see the
// captured mockup, so the design cannot be reproduced pixel-for-pixel. We focus
// the prompts on the three things we CAN control:
//   1. FACE     — handled by `main_face_image` + the face-identity clause
//   2. PRODUCT  — explicit product noun, oriented toward the camera so it's framed
//   3. "DESIGN EXISTS" — push the model to render *some* bold printed graphic
//                        instead of a blank product. The actual graphic is
//                        re-imagined, not the customer's exact artwork.
// Everything else (environment, pose, lighting) is left intentionally minimal —
// the user explicitly opted to not constrain those.
const FACE_IDENTITY = 'the exact same face, hair, and expression as the reference photo'
const STYLE = 'photorealistic, sharp focus, natural lighting, simple neutral background'
const DESIGN_VISIBLE = 'with a bold colorful printed graphic design clearly visible facing the camera, covering most of the product surface'

const TEMPLATES: Record<string, string> = {
  // The garment products route to IDM-VTON, not PuLID. These templates are only
  // hit if the garment route is bypassed (manual override). Kept consistent.
  tshirt: `Portrait of the same person wearing a cotton t-shirt ${DESIGN_VISIBLE} on the chest. ${FACE_IDENTITY}. ${STYLE}.`,
  polo: `Portrait of the same person wearing a polo shirt ${DESIGN_VISIBLE} on the chest. ${FACE_IDENTITY}. ${STYLE}.`,
  hoodie: `Portrait of the same person wearing a pull-over hoodie ${DESIGN_VISIBLE} on the front. ${FACE_IDENTITY}. ${STYLE}.`,
  tanktop: `Portrait of the same person wearing a tank top ${DESIGN_VISIBLE} on the chest. ${FACE_IDENTITY}. ${STYLE}.`,

  // True face-route products.
  totebag: `Photo of the same person holding a canvas tote bag at the side, the front face of the bag turned toward the camera, ${DESIGN_VISIBLE.replace('the product surface', 'the bag front')}. ${FACE_IDENTITY}. ${STYLE}.`,
  phonecase: `Photo of the same person holding up a modern smartphone, the back of the phone case turned toward the camera, the phone case ${DESIGN_VISIBLE.replace('the product surface', 'the case back')}. ${FACE_IDENTITY}. ${STYLE}.`,
  coffeemug: `Photo of the same person holding a ceramic coffee mug by the handle, the side of the mug turned toward the camera, the mug ${DESIGN_VISIBLE.replace('covering most of the product surface', 'wrapping around the mug side')}. ${FACE_IDENTITY}. ${STYLE}.`,
  cardboardbox: `Photo of the same person holding a small cardboard product box, the printed face of the box turned toward the camera, the box ${DESIGN_VISIBLE.replace('the product surface', 'the box front')}. ${FACE_IDENTITY}. ${STYLE}.`,
  standee: `Photo of the same person standing beside a flat cardboard standee display, the standee turned toward the camera, the standee ${DESIGN_VISIBLE.replace('the product surface', 'the standee surface')}. ${FACE_IDENTITY}. ${STYLE}.`,
}

// Negative prompt — discourages the failure modes we saw in earlier tests:
// face distortion, multiple people, blank/textless products, cartoon style.
export function buildNegativePrompt(): string {
  return 'blank product, plain unprinted surface, no design, distorted face, deformed face, multiple faces, multiple people, extra fingers, extra limbs, text watermark, logo overlay, low quality, blurry, cartoon, illustration, painting, sketch'
}

const PRODUCT_LABELS: Record<string, string> = {
  tshirt: 'T-shirt',
  polo: 'polo shirt',
  hoodie: 'hoodie',
  tanktop: 'tank top',
  totebag: 'tote bag',
  phonecase: 'phone case',
  coffeemug: 'coffee mug',
  cardboardbox: 'cardboard box',
  standee: 'standee',
}

// Classifies which products can use a true virtual-try-on model (IDM-VTON,
// which preserves the printed design on the garment) vs. the face-only PuLID
// fallback. Anything not in this map defaults to 'face' (prompt-only path).
export type ModelKind = 'garment' | 'face'
export const MODEL_KIND: Record<string, ModelKind> = {
  tshirt: 'garment',
  polo: 'garment',
  hoodie: 'garment',
  tanktop: 'garment',
  totebag: 'face',
  phonecase: 'face',
  coffeemug: 'face',
  cardboardbox: 'face',
  standee: 'face',
}

export function modelKind(modelId: string | null | undefined): ModelKind {
  if (!modelId) return 'face'
  return MODEL_KIND[modelId] ?? 'face'
}

// Garment descriptions passed to IDM-VTON's `garment_des` input. Keep these
// short and descriptive — the model uses them as a text-conditioning hint
// alongside the visual garment input.
const GARMENT_DESCRIPTIONS: Record<string, string> = {
  tshirt: 'A short-sleeve cotton t-shirt with a printed graphic on the front, fits naturally on the upper body.',
  polo: 'A short-sleeve polo shirt with a printed chest emblem, collared, fits naturally on the upper body.',
  hoodie: 'A long-sleeve pull-over hoodie with a printed front graphic, fits naturally on the upper body.',
  tanktop: 'A sleeveless tank top with a printed front graphic, fits naturally on the upper body.',
}

export function buildGarmentDescription(modelId: string | null | undefined): string {
  if (!modelId) return 'A printed upper-body garment.'
  return GARMENT_DESCRIPTIONS[modelId] ?? 'A printed upper-body garment.'
}

const FALLBACK = `Photo of the same person presenting a custom-printed product ${DESIGN_VISIBLE}. ${FACE_IDENTITY}. ${STYLE}.`

export function buildPrompt(modelId: string | null | undefined): string {
  if (!modelId) return FALLBACK
  return TEMPLATES[modelId] ?? FALLBACK
}

export function productLabel(modelId: string | null | undefined): string {
  if (!modelId) return 'product'
  return PRODUCT_LABELS[modelId] ?? 'product'
}
