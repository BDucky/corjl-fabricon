import { CapacitorHttp } from '@capacitor/core'
import {
  buildPrompt,
  buildGarmentDescription,
  buildNegativePrompt,
  modelKind,
} from './promptBuilder'

// Two-route generation:
//   - Garment products (tshirt / polo / hoodie / tanktop) → IDM-VTON. Takes the
//     mockup image as the garment input and the customer's photo as the human
//     input; the model preserves both the printed design and the customer's
//     identity. This is the only route that satisfies the full "face + exact
//     design + exact product" requirement.
//   - Non-garment products (mug, tote, phone case, box, standee) → PuLID-Flux.
//     Face-only model with a per-product prompt. Design pixels are NOT
//     preserved — best-effort framing only. Documented limitation; will
//     improve when a per-product try-on model is available.
//
// Defaults can be overridden via env vars (handy for swapping model versions
// without a redeploy).

const REPLICATE_API = 'https://api.replicate.com/v1'
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

const DEFAULT_FACE_MODEL = 'bytedance/flux-pulid'
const DEFAULT_GARMENT_MODEL = 'cuuupid/idm-vton'

export type GenerateInput = {
  modelId: string | null
  mockupImage: Blob
  faceImage: Blob | File
}

type PredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

type Prediction = {
  id: string
  status: PredictionStatus
  output?: string | string[] | null
  error?: string | null
}

function getToken(): string {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN as string | undefined
  if (!token) {
    throw new Error('Replicate API token is not configured. Set VITE_REPLICATE_API_TOKEN in .env and rebuild.')
  }
  return token
}

function envModel(key: string, fallback: string): string {
  const override = (import.meta.env as Record<string, string | undefined>)[key]
  return override && override.length > 0 ? override : fallback
}

async function blobToDataUri(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)))
  }
  return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// The `/v1/models/{slug}/predictions` endpoint is restricted to Replicate's
// official models. For community models we resolve the slug to its latest
// version SHA and POST to `/v1/predictions` with `{ version, input }` instead.
// Cached for the session so we only resolve each slug once.
const versionCache: Record<string, string> = {}

async function resolveLatestVersion(token: string, slug: string): Promise<string> {
  if (versionCache[slug]) return versionCache[slug]
  const res = await CapacitorHttp.get({
    url: `${REPLICATE_API}/models/${slug}`,
    headers: authHeaders(token),
  })
  if (res.status < 200 || res.status >= 300) {
    const detail = typeof res.data === 'string' ? res.data : (res.data as { detail?: string })?.detail
    throw new Error(`Could not resolve model "${slug}" (${res.status}): ${detail ?? 'not found'}`)
  }
  const id = (res.data as { latest_version?: { id?: string } } | null)?.latest_version?.id
  if (!id) throw new Error(`Model "${slug}" has no published version.`)
  versionCache[slug] = id
  return id
}

async function createPrediction(token: string, version: string, input: Record<string, unknown>): Promise<Prediction> {
  const res = await CapacitorHttp.post({
    url: `${REPLICATE_API}/predictions`,
    headers: authHeaders(token),
    data: { version, input },
  })
  if (res.status < 200 || res.status >= 300) {
    const detail = typeof res.data === 'string' ? res.data : (res.data as { detail?: string })?.detail
    throw new Error(`Replicate ${res.status}: ${detail ?? 'request failed'}`)
  }
  return res.data as Prediction
}

async function fetchPrediction(token: string, id: string): Promise<Prediction> {
  const res = await CapacitorHttp.get({
    url: `${REPLICATE_API}/predictions/${id}`,
    headers: authHeaders(token),
  })
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Replicate poll ${res.status}: ${typeof res.data === 'string' ? res.data : 'poll failed'}`)
  }
  return res.data as Prediction
}

function firstOutputUrl(output: Prediction['output']): string | null {
  if (!output) return null
  if (typeof output === 'string') return output
  return output[0] ?? null
}

async function pollToCompletion(token: string, initial: Prediction): Promise<string> {
  const start = Date.now()
  let current = initial
  while (current.status === 'starting' || current.status === 'processing') {
    if (Date.now() - start > POLL_TIMEOUT_MS) {
      throw new Error('Generation timed out after 5 minutes.')
    }
    await sleep(POLL_INTERVAL_MS)
    current = await fetchPrediction(token, current.id)
  }
  if (current.status === 'succeeded') {
    const url = firstOutputUrl(current.output)
    if (!url) throw new Error('Replicate returned no image.')
    return url
  }
  throw new Error(`Generation ${current.status}${current.error ? `: ${current.error}` : '.'}`)
}

async function generateGarment(token: string, modelId: string, mockup: string, face: string): Promise<string> {
  const slug = envModel('VITE_REPLICATE_MODEL_GARMENT', DEFAULT_GARMENT_MODEL)
  const version = await resolveLatestVersion(token, slug)
  const pending = await createPrediction(token, version, {
    garm_img: mockup,
    human_img: face,
    garment_des: buildGarmentDescription(modelId),
    category: 'upper_body',
    crop: false,
    seed: Math.floor(Math.random() * 1_000_000),
    steps: 30,
  })
  return pollToCompletion(token, pending)
}

async function generateFace(token: string, modelId: string | null, face: string): Promise<string> {
  const slug = envModel('VITE_REPLICATE_MODEL_FACE', DEFAULT_FACE_MODEL)
  const version = await resolveLatestVersion(token, slug)
  // id_weight 1.0 = maximum face identity strength.
  // guidance_scale 6 = follow the prompt more aggressively (default is 4) — we
  //   need the model to actually draw the product + design, not generic portraits.
  // num_steps 28 = mild quality bump over default 20.
  const pending = await createPrediction(token, version, {
    prompt: buildPrompt(modelId),
    negative_prompt: buildNegativePrompt(),
    main_face_image: face,
    num_outputs: 1,
    num_steps: 28,
    id_weight: 1,
    guidance_scale: 6,
    output_format: 'png',
  })
  return pollToCompletion(token, pending)
}

export async function generateImage({
  modelId,
  mockupImage,
  faceImage,
}: GenerateInput): Promise<string> {
  const token = getToken()
  const [mockupUri, faceUri] = await Promise.all([
    blobToDataUri(mockupImage),
    blobToDataUri(faceImage),
  ])

  if (modelKind(modelId) === 'garment' && modelId) {
    // Single-stage IDM-VTON: pass the user's actual photo as `human_img`. The
    // model preserves their real face pixels (PuLID body-synth would re-draw
    // the face and lose fidelity). Requires the user's chest to be in frame —
    // the Step 3 UI guides them to take a wider shot.
    return generateGarment(token, modelId, mockupUri, faceUri)
  }

  return generateFace(token, modelId, faceUri)
}
